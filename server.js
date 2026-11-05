// 3nD Basketball: the online league. Runs on the server only, on top of engine.js.
// The browser sends choices ("talk to this player: praise", "this is my plan"); everything is decided here.
// `store` is the database (see the bottom of the server function for the real one, the tests use one in memory).
// store.saveTeam writes only if the row has not changed since it was read (it throws 'conflict' otherwise),
// so a request that overlaps a match day can never write old data over the result.

const CFG={
  MATCH_HOUR_UTC:18,      // matches are played at this hour, UTC
  MATCH_DAYS:[0,3],       // Sunday and Wednesday
  LEAGUE_MATCHES:8,       // two a week for four weeks: one league is one month (16 would be two months)
  MAX_SWAPS:1,            // players a manager may change between leagues
  IDLE_DAYS:21,           // a manager who has not opened the game for this long is left out until they return
  HOUSE_NAME:'The House Team',
};
const DAY_MS=86400000;

// the next Wednesday or Sunday at the match hour, strictly after the given moment
function nextMatchTime(afterMs){
  const d=new Date(afterMs);const t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),CFG.MATCH_HOUR_UTC);
  for(let i=0;i<9;i++){const c=t+i*DAY_MS;if(c>afterMs&&CFG.MATCH_DAYS.includes(new Date(c).getUTCDay()))return c;}
  return t+7*DAY_MS;
}
function newPlayers(n,avoid){
  usedNames.clear();for(const x of avoid||[])usedNames.add(x);
  const out=[],ids=new Set();
  for(let i=0;i<n;i++){const p=makePlayer();do{p.id=1+Math.floor(R()*2000000000);}while(ids.has(p.id));ids.add(p.id);out.push(p);}
  return out;
}
// what a manager may see of their own player: everything except the secret soft spot and sore spot
function ownPlayer(p){const q={...p};delete q.love;delete q.hate;return q;}
// what everybody may see of somebody else's player: looks, character and dots, never mood or trust
function pubPlayer(p){return {id:p.id,n:p.n,temp:p.temp,h:p.h,bulk:p.bulk,col:p.col,top:p.top,shape:p.shape,num:p.num,sh:p.sh,df:p.df,sp:p.sp,ph:p.ph,eye:p.eye,teeth:p.teeth,mood:'ok',trust:0,tr:{sh:0,df:0,sp:0}};}
function cleanName(s){s=String(s||'').replace(/[^\p{L}\p{N} _.\-']/gu,'').replace(/\s+/g,' ').trim().slice(0,22);return s;}
function threeRules(not){return RULES.filter(r=>r.k!==not).sort(()=>R()-0.5).slice(0,3).map(r=>r.k);}
const DEF_SHEET={tempo:1,shots:1,def:0,off:0,guard:0,boards:1};

function newTeamRow(hash,name,players,leagueNo,now){
  const top=[...players].sort((a,b)=>rating(b)-rating(a));
  const data={name,players,starters:top.slice(0,3).map(p=>p.id),subs:top.slice(3,5).map(p=>p.id),
    ball:top.slice(0,3).sort((a,b)=>b.sh-a.sh)[0].id,sheet:{...DEF_SHEET},teamTalked:false,vote:null,last:null,final:null,agents:[],won:0,played:0};
  return {key_hash:hash,name,name_lc:name.toLowerCase(),is_house:false,league_no:leagueNo,w:0,l:0,pf:0,pa:0,pts:0,next_opp:null,last_seen:now,ver:0,pub:{},data};
}
function newHouseRow(leagueNo,now){
  const t=makeTeam(CFG.HOUSE_NAME,newPlayers(7),false);t.skill=0.6;
  const top=[...t.players].sort((a,b)=>rating(b)-rating(a));t.starters=top.slice(0,3).map(p=>p.id);t.subs=top.slice(3,5).map(p=>p.id);t.ball=t.starters[0];
  return {key_hash:'house',name:CFG.HOUSE_NAME,name_lc:CFG.HOUSE_NAME.toLowerCase(),is_house:true,league_no:leagueNo,w:0,l:0,pf:0,pa:0,pts:0,next_opp:null,last_seen:now,ver:0,pub:{},data:t};
}
const standing=(a,b)=>b.pts-a.pts||(b.pf-b.pa)-(a.pf-a.pa)||(a.name<b.name?-1:1);

// Who meets whom next. Teams on similar points meet; nobody meets the same team twice running if it can be avoided.
// With an odd number, one team meets the house team: the lowest one that did not just play it.
function pairUp(list,house){
  for(const t of list){t._prev=t.next_opp;t.next_opp=null;}
  house.next_opp=null;
  const order=[...list].sort((a,b)=>standing(a,b));
  if(order.length%2===1){
    let k=order.length-1;while(k>0&&order[k]._prev===house.id)k--;
    const t=order.splice(k,1)[0];t.next_opp=house.id;house.next_opp=t.id;
  }
  while(order.length){
    const a=order.shift();let j=order.findIndex(b=>b.id!==a._prev);if(j<0)j=0;
    const b=order.splice(j,1)[0];a.next_opp=b.id;b.next_opp=a.id;
  }
  for(const t of list)delete t._prev;
}
// A manager who has no opponent (new, or back after a long absence) takes the house team's place if the house
// team has a match, and otherwise plays the house team. So there is never more than one computer team in play.
// The database does this in one step (store.attach), one manager at a time and never during a match day, so
// two people joining at the same moment cannot both be given the same opponent.

async function ensureLeague(store,now){
  let lg=await store.league();
  if(!lg){
    const rule=pick(RULES).k;
    lg={id:1,no:1,match_no:1,next_match_at:nextMatchTime(now),rule,vote_opts:threeRules(rule),busy_until:null,final:null};
    await store.saveLeague(lg);
  }
  // if several first visitors arrive together, only one of them gets to create the house team
  if(!(await store.house())){try{await store.insertTeam(newHouseRow(lg.no,now));}catch(e){if(!(await store.house()))throw e;}}
  return lg;
}
// Match day comes by itself: the first request after the hour plays it, before anything else is done.
// Several match days that nobody opened the game for are played in order, each with the plans as they stood.
async function tick(store,now){
  let lg=await ensureLeague(store,now);
  let n=0;
  while(now>=lg.next_match_at&&n++<2){   // at most two match days per request, to stay well inside the server's time limit; the next request carries on
    if(!(await store.lock(now)))break;
    lg=await runMatchday(store,await store.league(),now);
  }
  return lg;
}

async function runMatchday(store,lg,now){
  const rows=await store.teamsInPlay();          // every team that has an opponent, and the house team
  const map=new Map(rows.map(r=>[r.id,r]));
  const house=rows.find(r=>r.is_house);
  const rule=lg.rule,matches=[],done=new Set();
  for(const A of rows){
    if(done.has(A.id)||!A.next_opp)continue;
    const B=map.get(A.next_opp);
    if(!B||B.next_opp!==A.id||done.has(B.id)){A.next_opp=null;continue;}   // a broken pairing: no match, re-paired below
    done.add(A.id);done.add(B.id);
    if(A.is_house)botPrepare(A.data,B.data,rule,B.pub.ls||null);
    if(B.is_house)botPrepare(B.data,A.data,rule,A.pub.ls||null);
    const before={a:{st:[...A.data.starters],ball:A.data.ball,sheet:{...A.data.sheet}},b:{st:[...B.data.starters],ball:B.data.ball,sheet:{...B.data.sheet}}};
    const r=playMatch(A.data,B.data,rule);
    const sides=[[A,r.a,r.b,B,before.a,before.b],[B,r.b,r.a,A,before.b,before.a]];
    const rec={league_no:lg.no,match_no:lg.match_no,a:A.id,b:B.id,a_name:A.name,b_name:B.name,score_a:r.a.score,score_b:r.b.score,rule,detail:{}};
    for(const [X,xs,ys,Y,mine,theirs] of sides){
      const won=xs.score>ys.score;
      X.pf+=xs.score;X.pa+=ys.score;if(won){X.w++;X.pts+=3;}else X.l++;
      const lines=reportLines(xs,ys,won,rule);
      let moves=[];
      if(!X.is_house){moves=aftermath(X.data,xs,won,ys.score);weekReset(X.data,false);
        X.data.last={league:lg.no,match:lg.match_no,opp:Y.name,us:xs.score,them:ys.score,won,lines,moves,oppSheet:theirs.sheet,rule};}
      X.pub={...X.pub,ls:mine.sheet,lw:won,st:mine.st,ball:mine.ball};
      rec.detail[X===A?'a':'b']={sheet:mine.sheet,lines};
    }
    matches.push(rec);
  }
  const humans=rows.filter(r=>!r.is_house);
  // the vote: managers chose the rule for the match after the one just played
  const tally=lg.vote_opts.map(()=>0);
  for(const t of humans){if(Number.isInteger(t.data.vote)&&t.data.vote>=0&&t.data.vote<tally.length)tally[t.data.vote]++;t.data.vote=null;}
  const best=Math.max(...tally);const winners=tally.map((v,i)=>v===best?i:-1).filter(i=>i>=0);
  const newRule=lg.vote_opts[pick(winners)];
  // the table as it stands now (teams not in play this time keep their points)
  const tbl=(await store.tableRows()).map(t=>map.has(t.id)?map.get(t.id):t).sort(standing);
  const placeOf=id=>tbl.findIndex(t=>t.id===id)+1;
  for(const t of humans)if(t.data.last&&t.data.last.match===lg.match_no&&t.data.last.league===lg.no){t.data.last.place=placeOf(t.id);t.data.last.of=tbl.length;}
  let reset=false;
  if(lg.match_no>=CFG.LEAGUE_MATCHES){
    // the league is over: remember how it ended, hand out free agents, start again from zero
    const champ=tbl[0]?tbl[0].name:'';
    lg.final={no:lg.no,champion:champ,table:tbl.slice(0,10).map(t=>({name:t.name,w:t.w,l:t.l,pts:t.pts}))};
    // managers who played part of this league and then went away get their place recorded too
    const away=(await store.allTeams()).filter(t=>!map.has(t.id)&&t.w+t.l>0);
    for(const t of away){rows.push(t);map.set(t.id,t);}
    for(const t of [...humans,...away]){
      const place=placeOf(t.id);
      t.data.final={league:lg.no,place,of:tbl.length,champion:champ,seen:false};
      t.data.played=(t.data.played||0)+1;if(place===1)t.data.won=(t.data.won||0)+1;
      t.data.history=[...(t.data.history||[]),{league:lg.no,place,of:tbl.length,w:t.w,l:t.l,pts:t.pts,champion:champ,ended:now}].slice(-80);
      t.data.agents=newPlayers(7,t.data.players.map(p=>p.n));
    }
    for(const t of rows){t.w=t.l=t.pf=t.pa=t.pts=0;t.league_no=lg.no+1;t.pub={...t.pub,lw:null};}
    reset=true;lg.no++;lg.match_no=1;
  }else lg.match_no++;
  lg.rule=newRule;lg.vote_opts=threeRules(newRule);
  lg.next_match_at=nextMatchTime(lg.next_match_at);lg.busy_until=null;
  // next pairings, among the managers who are still around
  const active=humans.filter(t=>t.last_seen>=now-CFG.IDLE_DAYS*DAY_MS);
  for(const t of humans)if(!active.includes(t))t.next_opp=null;
  pairUp(active,house);
  for(const t of humans)enforceRule(t.data,newRule);
  await store.commit({league:lg,teams:rows,matches,reset});
  return lg;
}

function checkPlan(data,req,rule){
  const ids=new Set(data.players.map(p=>p.id));
  const out=rule==='tall_out'?tallestId(data):null;
  const st=Array.isArray(req.starters)?[...new Set(req.starters)]:null,sb=Array.isArray(req.subs)?[...new Set(req.subs)]:null;
  if(!st||!sb||st.length>3||sb.length>2)return 'bad lineup';
  for(const id of [...st,...sb])if(!ids.has(id)||id===out)return 'bad lineup';
  if(sb.some(id=>st.includes(id)))return 'bad lineup';
  const ball=req.ball==null?null:req.ball;if(ball!==null&&!st.includes(ball))return 'bad star';
  const sh={};for(const k of Object.keys(DEF_SHEET)){const v=req.sheet&&req.sheet[k];if(![0,1,2].includes(v))return 'bad plan';sh[k]=v;}
  data.starters=st;data.subs=sb;data.ball=ball;data.sheet=sh;
  return null;
}

async function makeView(store,row,lg,now,extra){
  const tbl=(await store.tableRows()).sort(standing);
  let opp=null;
  if(row.next_opp){const o=await store.teamById(row.next_opp);
    if(o){const top=[...o.data.players].sort((a,b)=>rating(b)-rating(a)).slice(0,3).map(p=>p.id);
      const st=(o.pub.st||[]).filter(id=>o.data.players.some(p=>p.id===id));
      opp={id:o.id,name:o.name,house:o.is_house,w:o.w,l:o.l,pf:o.pf,pa:o.pa,pts:o.pts,players:o.data.players.map(pubPlayer),
        starters:st.length===3?st:top,ball:o.pub.ball&&st.includes(o.pub.ball)?o.pub.ball:null,ls:o.pub.ls||null};}}
  const d=row.data;
  return {phase:'week',now,
    league:{no:lg.no,match_no:lg.match_no,of:CFG.LEAGUE_MATCHES,next_match_at:lg.next_match_at,rule:lg.rule,vote_opts:lg.vote_opts,final:lg.final},
    me:{id:row.id,name:row.name,w:row.w,l:row.l,pf:row.pf,pa:row.pa,pts:row.pts,players:d.players.map(ownPlayer),starters:d.starters,subs:d.subs,ball:d.ball,
      sheet:d.sheet,teamTalked:!!d.teamTalked,vote:d.vote,last:d.last,final:d.final,agents:(d.agents||[]).map(ownPlayer),won:d.won||0,played:d.played||0,history:d.history||[]},
    opp,table:tbl.slice(0,300).map(t=>({id:t.id,name:t.name,w:t.w,l:t.l,pf:t.pf,pa:t.pa,pts:t.pts,ls:t.pub.ls||null,lw:t.pub.lw})),teams:tbl.length,...(extra||{})};
}

// One request from a browser. `req.a` is the action, `req.key` the secret that stands in for an account.
async function handle(store,req,now,hash){
  const a=String(req&&req.a||'');const key=String(req&&req.key||'');
  if(a==='ping'){   // a scheduled job calls this: it keeps the server awake and plays any match that is due
    const lg=await tick(store,now);
    return {ok:true,league:lg.no,match_no:lg.match_no,next_match_at:lg.next_match_at,up_to_date:now<lg.next_match_at};
  }
  if(!/^[a-f0-9]{32,64}$/.test(key))return {error:'bad key'};
  const h=await hash(key);
  try{return await handle2(store,req,a,h,now);}
  catch(e){if(e&&e.message==='conflict')return {busy:true};throw e;}
}
async function handle2(store,req,a,h,now){
  const lg=await tick(store,now);
  // a match day is being played by another request right now: touch nothing, the browser asks again in a moment
  if(now>=lg.next_match_at)return {busy:true};
  let row=await store.teamByKey(h);
  if(!row){
    if(a==='view'){
      // fourteen players are offered once; the manager picks seven of those and cannot ask for others
      let pool=await store.pool(h);
      if(!pool){pool={players:newPlayers(14),rerolls:0};await store.savePool(h,pool);}
      return {phase:'draft',now,pool:pool.players.map(ownPlayer),league:{no:lg.no,match_no:lg.match_no,of:CFG.LEAGUE_MATCHES,next_match_at:lg.next_match_at,rule:lg.rule}};
    }
    if(a==='join'){
      const pool=await store.pool(h);if(!pool)return {error:'no players to pick from'};
      const picks=Array.isArray(req.picks)?[...new Set(req.picks)]:[];
      const mine=pool.players.filter(p=>picks.includes(p.id));
      if(picks.length!==7||mine.length!==7)return {error:'Pick exactly seven players.'};
      const name=cleanName(req.name);if(name.length<2)return {error:'Give your team a name.'};
      if(name.toLowerCase()===CFG.HOUSE_NAME.toLowerCase()||await store.nameTaken(name.toLowerCase()))return {error:'That team name is taken. Try another.'};
      const fresh=newTeamRow(h,name,mine,lg.no,now);enforceRule(fresh.data,lg.rule);
      try{row=await store.insertTeam(fresh);}
      catch(e){   // the same manager joining twice at once (two taps, two devices), or two managers taking one name at once
        row=await store.teamByKey(h);
        if(!row){if(await store.nameTaken(name.toLowerCase()))return {error:'That team name is taken. Try another.'};throw e;}
      }
      await store.attach(row.id,now);await store.dropPool(h);
      row=await store.teamByKey(h);
      return makeView(store,row,lg,now,{joined:true});
    }
    return {error:'no team'};
  }
  // back after a long absence, or the pairing broke: find this manager an opponent
  let paired=!!row.next_opp;
  if(paired){const o=await store.teamById(row.next_opp);paired=!!(o&&o.next_opp===row.id);}
  if(!paired){await store.attach(row.id,now);row=await store.teamByKey(h);}
  const d=row.data;let extra=null,dirty=false;
  if(now-row.last_seen>3600000){row.last_seen=now;dirty=true;}
  if(a==='talk'){
    const p=d.players.find(x=>x.id===req.pid);
    if(!p||!TONES.includes(req.tone))return {error:'bad talk'};
    if(p.talked)return {error:'You already talked to '+p.n+' before this match.'};
    const before=p.mood;const r=talkTo(p,req.tone);
    extra={said:{pid:p.id,text:r[0],before}};dirty=true;
  }else if(a==='teamtalk'){
    if(!TONES.includes(req.tone))return {error:'bad talk'};
    if(d.teamTalked)return {error:'You already talked to the whole team before this match.'};
    const before={};for(const p of d.players)before[p.id]=p.mood;
    const res=teamTalkTo(d,req.tone);
    extra={team:{msg:res.msg,before}};dirty=true;
  }else if(a==='plan'){
    const err=checkPlan(d,req,lg.rule);if(err)return {error:err};
    dirty=true;
  }else if(a==='vote'){
    if(![0,1,2].includes(req.i))return {error:'bad vote'};
    d.vote=req.i;dirty=true;
  }else if(a==='swap'){
    if(!d.final||d.final.seen)return {error:'No swaps now. They open when a league ends.'};
    const outs=Array.isArray(req.outs)?[...new Set(req.outs)]:[],ins=Array.isArray(req.ins)?[...new Set(req.ins)]:[];
    if(outs.length>CFG.MAX_SWAPS||outs.length!==ins.length)return {error:'You may change '+(CFG.MAX_SWAPS===1?'one player':'up to '+CFG.MAX_SWAPS+' players')+', one in for each one out.'};
    const agents=d.agents||[];
    if(outs.some(id=>!d.players.some(p=>p.id===id))||ins.some(id=>!agents.some(p=>p.id===id)))return {error:'bad swap'};
    d.players=d.players.filter(p=>!outs.includes(p.id)).concat(agents.filter(p=>ins.includes(p.id)));
    d.agents=[];d.final.seen=true;enforceRule(d,lg.rule);dirty=true;
  }else if(a!=='view')return {error:'unknown action'};
  if(dirty)await store.saveTeam(row);
  return makeView(store,row,lg,now,extra);
}
