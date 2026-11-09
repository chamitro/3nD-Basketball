// 3nD Basketball: the online league. Runs on the server only, on top of engine.js.
// The browser sends choices ("talk to this player: praise", "this is my plan"); everything is decided here.
// `store` is the database (see the bottom of the server function for the real one, the tests use one in memory).
// store.saveTeam writes only if the row has not changed since it was read (it throws 'conflict' otherwise),
// so a request that overlaps a match day can never write old data over the result.

const CFG={
  MATCH_HOUR_UTC:18,      // matches are played at this hour, UTC
  MATCH_DAYS:[0,3],       // the seasonal leagues: Sunday and Wednesday
  TEST_DAYS:[0,3,5],      // the leagues before SEASONS_FROM: Sunday, Wednesday and Friday
  LEAGUE_MATCHES:13,      // length of the leagues before SEASONS_FROM: 13 match days, so that 13 or 14 teams all meet each other once (League 1: Sun 8 Nov - Sun 6 Dec 2026)
  SEASONS_FROM:2,         // from this league number on, a league lasts one season of the year: Winter (Dec-Feb), Spring (Mar-May), Summer (Jun-Aug), Autumn (Sep-Nov)
  MAX_SWAPS:1,            // players a manager may change between leagues
  IDLE_DAYS:21,           // a manager who has not opened the game for this long is left out until they return
  DB_LIMIT_MB:500,        // the room the free Supabase plan gives the database; `ping` reports how much is used
  HALL_SIZE:50,           // how many teams the all-time list of league winners shows
  HOUSE_NAME:'The House Team',
};
const DAY_MS=86400000;
const SERVER_BUILD='dev';   // build.py puts a fingerprint of the server code here, and `ping` reports it, so a deployment can be checked from outside

// the match days of league `no` (days of the week, 0 = Sunday)
const matchDays=no=>no>=CFG.SEASONS_FROM?CFG.MATCH_DAYS:CFG.TEST_DAYS;
// the next match day of league `no` at the match hour, strictly after the given moment
function nextMatchTime(afterMs,no){
  const days=matchDays(no);
  const d=new Date(afterMs);const t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),CFG.MATCH_HOUR_UTC);
  for(let i=0;i<9;i++){const c=t+i*DAY_MS;if(c>afterMs&&days.includes(new Date(c).getUTCDay()))return c;}
  return t+7*DAY_MS;
}
// ── seasons. A league from SEASONS_FROM on belongs to the season its matches are played in, and ends with it.
const SEASON_NAMES=['Winter','Spring','Summer','Autumn'];
function seasonOf(ms){   // {i: 0..3, y: the year the season starts in}; December belongs to the winter that starts that year
  const d=new Date(ms),m=d.getUTCMonth(),y=d.getUTCFullYear();
  const i=Math.floor(((m+1)%12)/3);
  return {i,y:i===0&&m<11?y-1:y};
}
const seasonKey=ms=>{const s=seasonOf(ms);return s.y*4+s.i;};
const isSeasonal=no=>no>=CFG.SEASONS_FROM;
// is the match played at `at` the last one of league `no`, where it is match number `matchNo`?
function isLastMatch(no,matchNo,at){
  if(!isSeasonal(no))return matchNo>=CFG.LEAGUE_MATCHES;
  return seasonKey(nextMatchTime(at,no))!==seasonKey(at);
}
// how many matches the running league has in all
function leagueLength(lg){
  if(!isSeasonal(lg.no))return CFG.LEAGUE_MATCHES;
  let n=lg.match_no,t=lg.next_match_at;
  for(let k=0;k<80&&!isLastMatch(lg.no,n,t);k++){t=nextMatchTime(t,lg.no);n++;}
  return n;
}
// the name of league `no`, one of whose matches is played at `at`: "Winter League 2026/27", "Spring League 2027"; before the seasons "League 1"
function leagueName(no,at,short){
  if(!isSeasonal(no))return 'League '+no;
  const s=seasonOf(at),nm=SEASON_NAMES[s.i]+' League';
  return short?nm:nm+' '+(s.i===0?s.y+'/'+String((s.y+1)%100).padStart(2,'0'):s.y);
}
// what the browser is told about the running league
function leagueInfo(lg){return {no:lg.no,name:leagueName(lg.no,lg.next_match_at),short:leagueName(lg.no,lg.next_match_at,true),match_no:lg.match_no,of:leagueLength(lg),next_match_at:lg.next_match_at,rule:lg.rule,days:matchDays(lg.no),hour:CFG.MATCH_HOUR_UTC};}
function newPlayers(n,avoid){
  usedNames.clear();for(const x of avoid||[])usedNames.add(x);
  const out=[],ids=new Set();
  for(let i=0;i<n;i++){const p=makePlayer();do{p.id=1+Math.floor(R()*2000000000);}while(ids.has(p.id));ids.add(p.id);out.push(p);}
  return out;
}
// what a manager may see of their own player: everything except the secret soft spot and sore spot
function ownPlayer(p){const q={...p};delete q.love;delete q.hate;q.en=energyOf(p);return q;}   // energy is always sent, also for players from before it existed
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

// Who meets whom next. Everyone should meet everyone: a team is paired first with teams it has not met yet in
// this league, then with those it has met least often; among those, teams on similar points meet, and nobody
// meets the same team twice running if it can be avoided. `met` counts, for every pair of ids, how often they
// have met in this league (key: the two ids sorted and joined with '|').
// With an odd number, one team meets the house team: of the teams that have met it least, the lowest one.
const pairKey=(x,y)=>x<y?x+'|'+y:y+'|'+x;
// Up to 16 participants: an exact schedule. Among the pairs that have met least often, a round is only chosen if the
// rounds left can still let everyone meet everyone (a complete schedule is searched for, depth first), so a league of
// 13 rounds for 14 teams really is everyone against everyone once. Returns null when that is not possible or not needed.
function roundRobinPairs(order,met,roundsLeft,cost){
  const n=order.length;if(n<2||n>16||n%2)return null;
  const tm=(i,j)=>met.get(pairKey(order[i].id,order[j].id))||0;
  let level=Infinity;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)level=Math.min(level,tm(i,j));
  const adj=order.map(()=>[]);
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(tm(i,j)===level){adj[i].push(j);adj[j].push(i);}
  const deg=adj[0].length;if(deg<1||deg>roundsLeft||!adj.every(a=>a.length===deg))return null;
  for(let i=0;i<n;i++)adj[i].sort((a,b)=>cost(order[i],order[a])-cost(order[i],order[b]));   // cheapest partners first: the first round found is the one played
  const used=new Set(),ek=(i,j)=>i<j?i*16+j:j*16+i;
  let budget=200000,first=null;
  const matching=(free,pairs,k)=>{
    if(--budget<0)throw 0;
    if(!free){for(const [i,j] of pairs)used.add(ek(i,j));const ok=rounds(k+1,pairs);if(!ok)for(const [i,j] of pairs)used.delete(ek(i,j));return ok;}
    let i=0;while(!(free&(1<<i)))i++;
    for(const j of adj[i]){if(!(free&(1<<j))||used.has(ek(i,j)))continue;pairs.push([i,j]);if(matching(free&~(1<<i)&~(1<<j),pairs,k))return true;pairs.pop();}
    return false;
  };
  const rounds=(k,pairs)=>{if(k===1)first=pairs.map(x=>[...x]);if(k===deg)return true;return matching((1<<n)-1,[],k);};
  try{if(!rounds(0,[]))return null;}catch(e){return null;}
  return first.map(([i,j])=>[order[i],order[j]]);
}
function pairUp(list,house,met,roundsLeft){
  met=met||new Map();const timesMet=(x,y)=>met.get(pairKey(x,y))||0;roundsLeft=roundsLeft||0;
  for(const t of list){t._prev=t.next_opp;t.next_opp=null;}
  house._prev=house.next_opp;house.next_opp=null;
  const order=[...list].sort((a,b)=>standing(a,b));
  if(order.length%2===1)order.push(house);               // the house team takes part only when the number is odd, at the bottom of the table
  if(!order.length){delete house._prev;return;}
  const rank=new Map(order.map((t,i)=>[t.id,i]));
  const cost=(a,b)=>timesMet(a.id,b.id)*10+(a._prev===b.id?5:0)+Math.abs(rank.get(a.id)-rank.get(b.id))*0.01;
  const total=pairs=>pairs.reduce((s,[a,b])=>s+cost(a,b),0);
  const rr=roundRobinPairs(order,met,roundsLeft,cost);
  if(rr){for(const [a,b] of rr){a.next_opp=b.id;b.next_opp=a.id;}for(const t of list)delete t._prev;delete house._prev;return;}
  // a greedy matching in some order, then partners swapped between pairs while that lowers the total cost
  const build=seq=>{
    const pairs=[],left=[...seq];
    while(left.length){const a=left.shift();let j=0;for(let i=1;i<left.length;i++)if(cost(a,left[i])<cost(a,left[j]))j=i;pairs.push([a,left.splice(j,1)[0]]);}
    if(pairs.length<=300)for(let pass=0;pass<6;pass++){let better=false;
      for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++){
        const [a,b]=pairs[i],[c,d]=pairs[j],now=cost(a,b)+cost(c,d);
        if(cost(a,c)+cost(b,d)<now-1e-9){pairs[i]=[a,c];pairs[j]=[b,d];better=true;}
        else if(cost(a,d)+cost(b,c)<now-1e-9){pairs[i]=[a,d];pairs[j]=[b,c];better=true;}
      }
      if(!better)break;}
    return pairs;
  };
  // several starting orders (top down, bottom up, shuffled); the cheapest matching wins
  let best=build(order),bestC=total(best);
  const tries=order.length<=40?24:order.length<=200?8:2;
  for(let k=0;k<tries;k++){
    const seq=k===0?[...order].reverse():[...order].sort(()=>R()-0.5);
    const p=build(seq),c=total(p);if(c<bestC-1e-9){best=p;bestC=c;}
  }
  for(const [a,b] of best){a.next_opp=b.id;b.next_opp=a.id;}
  for(const t of list)delete t._prev;delete house._prev;
}
// how often every pair of teams has met in league `no`, including the matches of the match day being played now
async function meetings(store,no,today){
  const met=new Map();
  const add=(x,y)=>{if(!x||!y)return;const k=pairKey(x,y);met.set(k,(met.get(k)||0)+1);};
  for(const m of await store.leaguePairs(no))add(m.a,m.b);
  for(const m of today)add(m.a,m.b);
  return met;
}
// A manager who has no opponent (new, or back after a long absence) takes the house team's place if the house
// team has a match, and otherwise plays the house team. So there is never more than one computer team in play.
// The database does this in one step (store.attach), one manager at a time and never during a match day, so
// two people joining at the same moment cannot both be given the same opponent.

async function ensureLeague(store,now){
  let lg=await store.league();
  if(!lg){
    const rule=pick(RULES).k;
    lg={id:1,no:1,match_no:1,next_match_at:nextMatchTime(now,1),rule,vote_opts:threeRules(rule),busy_until:null,final:null};
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
  const rule=lg.rule,matches=[],done=new Set(),playedLeague=lg.no,playedMatch=lg.match_no;
  for(const A of rows){
    if(done.has(A.id)||!A.next_opp)continue;
    const B=map.get(A.next_opp);
    if(!B||B.next_opp!==A.id||done.has(B.id)){A.next_opp=null;continue;}   // a broken pairing: no match, re-paired below
    done.add(A.id);done.add(B.id);
    if(A.is_house)botPrepare(A.data,B.data,rule,B.pub.ls||null);
    if(B.is_house)botPrepare(B.data,A.data,rule,A.pub.ls||null);
    const ordersOf=T=>{const o=T.data.orders||{};return ORDER_KEYS.some(w=>o[w])?{behind:o.behind||null,close:o.close||null,ahead:o.ahead||null}:null;};
    const before={a:{st:[...A.data.starters],ball:A.data.ball,sheet:{...A.data.sheet},orders:ordersOf(A)},b:{st:[...B.data.starters],ball:B.data.ball,sheet:{...B.data.sheet},orders:ordersOf(B)}};
    const r=playMatch(A.data,B.data,rule);
    // the report everybody may read: three strong and three weak points of each side (worked out before moods change)
    const reps=new Map([[A,scoutReport(r.a,r.b,rule)],[B,scoutReport(r.b,r.a,rule)]]);
    const sides=[[A,r.a,r.b,B,before.a,before.b],[B,r.b,r.a,A,before.b,before.a]];
    const rec={league_no:lg.no,match_no:lg.match_no,a:A.id,b:B.id,a_name:A.name,b_name:B.name,score_a:r.a.score,score_b:r.b.score,rule,detail:{at:lg.next_match_at,lname:leagueName(lg.no,lg.next_match_at)}};
    for(const [X,xs,ys,Y,mine,theirs] of sides){
      const won=xs.score>ys.score;
      X.pf+=xs.score;X.pa+=ys.score;if(won){X.w++;X.pts+=3;}else X.l++;
      const lines=reportLines(xs,ys,won,rule);
      // the half-time as everybody may read it: score, the order that fired (with the player's name), what was left for the other cases
      const leftWords=o=>{if(!o)return null;const a=[orderWords(o,X.data),o.talk?'talk: '+TONE_LABEL[o.talk].toLowerCase():''].filter(Boolean);return a.length?a.join(' + '):null;};
      const half=xs.half?{us:xs.half.us,them:xs.half.them,cond:xs.half.cond,order:xs.half.order,who:xs.half.pid?(byId(X.data,xs.half.pid)||{}).n||null:null,talk:xs.half.talk||null,
        left:mine.orders?Object.fromEntries(ORDER_KEYS.map(w=>[w,leftWords(mine.orders[w])])):null}:null;
      let moves=[];
      if(X.is_house)energyAfter(X.data,xs);   // the computer team tires like everyone else
      if(!X.is_house){moves=aftermath(X.data,xs,won,ys.score);weekReset(X.data,false);
        X.data.last={league:lg.no,match:lg.match_no,opp:Y.name,us:xs.score,them:ys.score,won,lines,moves,oppSheet:theirs.sheet,oppHalf:null,half,rule,pros:reps.get(X).pros,cons:reps.get(X).cons};}
      // pub.rep: this team's last match as everybody may see it (shown to its next opponent)
      // pub.sc: this team's league so far in numbers (one small record, updated after each match)
      X.pub={...X.pub,ls:mine.sheet,lw:won,st:mine.st,ball:mine.ball,sc:seasonCard(X.pub.sc,lg.no,xs,ys,won),rep:{league:lg.no,match:lg.match_no,opp:Y.name,us:xs.score,them:ys.score,rule,pros:reps.get(X).pros,cons:reps.get(X).cons,half}};
      rec.detail[X===A?'a':'b']={sheet:mine.sheet,half,lines,pros:reps.get(X).pros,cons:reps.get(X).cons};
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
  const tbl=(await store.tableRows(lg.no)).map(t=>map.has(t.id)?map.get(t.id):t).sort(standing);
  const placeOf=id=>tbl.findIndex(t=>t.id===id)+1;
  for(const t of humans)if(t.data.last&&t.data.last.match===lg.match_no&&t.data.last.league===lg.no){t.data.last.place=placeOf(t.id);t.data.last.of=tbl.length;}
  let reset=false;
  if(isLastMatch(lg.no,lg.match_no,lg.next_match_at)){
    const endedName=leagueName(lg.no,lg.next_match_at),nextName=leagueName(lg.no+1,nextMatchTime(lg.next_match_at,lg.no+1));
    // the league is over: remember how it ended, hand out free agents, start again from zero
    const champ=tbl[0]?tbl[0].name:'';
    // managers who played part of this league and then went away get their place recorded too
    const all=(await store.allTeams()).map(t=>map.get(t.id)||t);
    const away=all.filter(t=>!map.has(t.id)&&t.league_no===lg.no&&t.w+t.l>0);
    for(const t of away){rows.push(t);map.set(t.id,t);}
    for(const t of [...humans,...away]){
      const place=placeOf(t.id);
      t.data.final={league:lg.no,name:endedName,next:nextName,place,of:tbl.length,champion:champ,seen:false};
      t.data.played=(t.data.played||0)+1;if(place===1)t.data.won=(t.data.won||0)+1;
      t.data.history=[...(t.data.history||[]),{league:lg.no,name:endedName,place,of:tbl.length,w:t.w,l:t.l,pts:t.pts,champion:champ,ended:now}].slice(-80);
      t.data.agents=newPlayers(7,t.data.players.map(p=>p.n));
    }
    // the all-time list: how many leagues each team has won, of how many it finished
    const hall=all.filter(t=>(t.data.played||0)>0).map(t=>({id:t.id,name:t.name,won:t.data.won||0,played:t.data.played||0}))
      .sort((a,b)=>b.won-a.won||a.played-b.played||(a.name<b.name?-1:1)).slice(0,CFG.HALL_SIZE);
    lg.final={no:lg.no,name:endedName,champion:champ,table:tbl.slice(0,10).map(t=>({name:t.name,w:t.w,l:t.l,pts:t.pts})),hall};
    // Everyone goes back to zero, and nobody is in the next league yet: a team is in it once its manager enters it.
    // (league_no of a manager's team is the last league it entered; only the house team moves on by itself)
    for(const t of rows){t.w=t.l=t.pf=t.pa=t.pts=0;t.pub={...t.pub,lw:null};if(t.is_house)t.league_no=lg.no+1;}
    reset=true;lg.no++;lg.match_no=1;
  }else lg.match_no++;
  lg.rule=newRule;lg.vote_opts=threeRules(newRule);
  lg.next_match_at=nextMatchTime(lg.next_match_at,lg.no);lg.busy_until=null;   // lg.no is already the next league's number if one just ended
  // next pairings, among the managers who are still around
  if(reset){for(const t of rows)t.next_opp=null;}   // the new league starts empty
  else{
    const active=humans.filter(t=>t.last_seen>=now-CFG.IDLE_DAYS*DAY_MS);
    for(const t of humans)if(!active.includes(t))t.next_opp=null;
    pairUp(active,house,await meetings(store,lg.no,matches),leagueLength(lg)-lg.match_no+1);
  }
  for(const t of humans)enforceRule(t.data,newRule);
  await store.commit({league:lg,teams:rows,matches,reset});
  await notifyResults(store,rows,playedLeague,playedMatch);
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
  // half-time orders: one per case, each an order key, "star" with one of the manager's own players
  let orders=data.orders||null;
  if(req.orders!==undefined){
    if(req.orders===null)orders={behind:null,close:null,ahead:null};
    else{if(typeof req.orders!=='object')return 'bad orders';orders={};
      for(const w of ORDER_KEYS){const o=req.orders[w];if(o==null){orders[w]=null;continue;}
        if(typeof o!=='object')return 'bad orders';
        const talk=o.talk==null?null:o.talk;if(talk!==null&&!TONES.includes(talk))return 'bad orders';
        if(o.k==null){orders[w]=talk?{k:null,talk}:null;continue;}
        if(!orderOf(o.k))return 'bad orders';
        if(o.k==='star'){if(!ids.has(o.pid)||o.pid===out)return 'bad orders';orders[w]={k:'star',pid:o.pid,talk};}else orders[w]={k:o.k,talk};}}
  }
  data.starters=st;data.subs=sb;data.ball=ball;data.sheet=sh;if(orders)data.orders=orders;
  return null;
}

async function makeView(store,row,lg,now,extra){
  const vapid=await getVapid(store);
  const tbl=(await store.tableRows(lg.no)).sort(standing);   // only the teams that entered this league
  let opp=null;
  if(row.next_opp){const o=await store.teamById(row.next_opp);
    if(o){const top=[...o.data.players].sort((a,b)=>rating(b)-rating(a)).slice(0,3).map(p=>p.id);
      const st=(o.pub.st||[]).filter(id=>o.data.players.some(p=>p.id===id));
      opp={id:o.id,name:o.name,house:o.is_house,w:o.w,l:o.l,pf:o.pf,pa:o.pa,pts:o.pts,players:o.data.players.map(pubPlayer),
        starters:st.length===3?st:top,ball:o.pub.ball&&st.includes(o.pub.ball)?o.pub.ball:null,ls:o.pub.ls||null,rep:o.pub.rep||null,sc:o.pub.sc&&o.pub.sc.lg===lg.no?o.pub.sc:null};}}
  const d=row.data;
  return {phase:'week',now,
    league:{...leagueInfo(lg),vote_opts:lg.vote_opts,final:lg.final},
    me:{id:row.id,name:row.name,out:row.league_no!==lg.no&&!tbl.some(t=>t.id===row.id),w:row.w,l:row.l,pf:row.pf,pa:row.pa,pts:row.pts,players:d.players.map(ownPlayer),starters:d.starters,subs:d.subs,ball:d.ball,
      sheet:d.sheet,orders:d.orders||{behind:null,close:null,ahead:null},teamTalked:!!d.teamTalked,vote:d.vote,last:d.last,final:d.final,agents:(d.agents||[]).map(ownPlayer),won:d.won||0,played:d.played||0,history:d.history||[],push:(d.push||[]).length},
    push_key:vapid?vapid.pub:null,
    opp,table:tbl.slice(0,300).map(t=>({id:t.id,name:t.name,w:t.w,l:t.l,pf:t.pf,pa:t.pa,pts:t.pts,ls:t.pub.ls||null,lw:t.pub.lw})),teams:tbl.length,...(extra||{})};
}

// ───────────────────────── match reports ─────────────────────────
// One match day as everybody may read it: every score, each side's plan, three strong and three weak points.
// What a manager was told in private about their own match (the "lines") is never part of it.
const ROUND_MAX=60;   // matches sent for one match day
async function roundView(store,req){
  let L=Number.isInteger(req.league)&&req.league>0?req.league:null,M=Number.isInteger(req.match)&&req.match>0?req.match:null;
  if(L===null||M===null){const last=await store.roundNear(null,null,-1);if(!last)return {none:true};L=last.league_no;M=last.match_no;}
  const rows=await store.roundMatches(L,M,ROUND_MAX+1);
  if(!rows.length)return {none:true,league:L,match:M};
  const pos=x=>x?{league:x.league_no,match:x.match_no}:null;
  const side=d=>({sheet:(d&&d.sheet)||null,half:(d&&d.half)||null,pros:(d&&d.pros)||[],cons:(d&&d.cons)||[]});
  const d0=rows[0].detail||{};
  return {league:L,match:M,name:d0.lname||'League '+L,rule:rows[0].rule,at:d0.at||null,more:rows.length>ROUND_MAX,
    prev:pos(await store.roundNear(L,M,-1)),next:pos(await store.roundNear(L,M,1)),
    matches:rows.slice(0,ROUND_MAX).map(m=>({a:m.a,b:m.b,an:m.a_name,bn:m.b_name,sa:m.score_a,sb:m.score_b,ra:side((m.detail||{}).a),rb:side((m.detail||{}).b)}))};
}

// ───────────────────────── result notifications ─────────────────────────
// The signing key is made once and kept in the database (table b3_config). If that table is not there,
// notifications are simply off and everything else works as before.
let VAPID_CACHE=null;
async function getVapid(store){
  if(VAPID_CACHE)return VAPID_CACHE;
  try{
    let v=await store.config('vapid');
    if(!v){await store.setConfig('vapid',await newVapid());v=await store.config('vapid');}   // if two requests race, the first one stored wins
    if(v&&v.jwk&&v.pub)VAPID_CACHE=v;
    return VAPID_CACHE;
  }catch(e){return null;}
}
function resultMessage(row){
  const l=row.data.last;if(!l)return null;
  let b=(l.won?'You beat ':'You lost to ')+l.opp+' '+l.us+'–'+l.them+'.';
  if(l.place)b+=' You are '+ord(l.place)+' of '+l.of+'.';
  const f=row.data.final;
  if(f&&!f.seen&&f.league===l.league)b+=' '+(f.name||'League '+f.league)+' is over: you finished '+ord(f.place)+'. Open the game to enter '+(f.next?(/^League \d/.test(f.next)?'':'the ')+f.next:'the next league')+'.';
  else if(l.lines&&l.lines[0])b+=' '+l.lines[0];
  return {t:'3nD Basketball · match '+l.match,b:b.slice(0,220),tag:'b3-'+l.league+'-'+l.match};
}
// send one message to every device of one team; returns the addresses that no longer exist
async function pushToTeam(row,msg,vapid){
  const subs=(row.data.push||[]).filter(s=>pushHostOk(s.endpoint));const dead=[];let sent=0;
  for(const s of subs){const st=await sendPush(s,msg,vapid);if(st===404||st===410)dead.push(s.endpoint);else if(st>=200&&st<300)sent++;}
  return {sent,dead,devices:subs.length};
}
// after a match day: tell every manager who asked. Never allowed to disturb the match day itself.
async function notifyResults(store,rows,league,match){
  try{
    const teams=rows.filter(r=>!r.is_house&&r.data.push&&r.data.push.length&&r.data.last&&r.data.last.league===league&&r.data.last.match===match).slice(0,300);   // only teams that played this match
    if(!teams.length)return;
    const vapid=await getVapid(store);if(!vapid)return;
    for(let i=0;i<teams.length;i+=20){
      await Promise.all(teams.slice(i,i+20).map(async t=>{
        try{const msg=resultMessage(t);if(!msg)return;
          const r=await pushToTeam(t,msg,vapid);
          if(r.dead.length){const fresh=await store.teamById(t.id);if(fresh){fresh.data.push=(fresh.data.push||[]).filter(s=>!r.dead.includes(s.endpoint));await store.saveTeam(fresh);}}
        }catch(e){}
      }));
    }
  }catch(e){}
}

// One request from a browser. `req.a` is the action, `req.key` the secret that stands in for an account.
async function handle(store,req,now,hash){
  const a=String(req&&req.a||'');const key=String(req&&req.key||'');
  if(a==='ping'){   // a scheduled job calls this: it keeps the server awake and plays any match that is due
    const lg=await tick(store,now);
    let managers=null,sql=null,db_mb=null;
    try{managers=(await store.tableRows(lg.no)).length;sql=await store.config('sql');const b=store.dbSize?await store.dbSize():null;if(b!==null)db_mb=Math.round(b/1048576*10)/10;}catch(e){}
    return {ok:true,league:lg.no,match_no:lg.match_no,next_match_at:lg.next_match_at,up_to_date:now<lg.next_match_at,build:SERVER_BUILD,name:leagueName(lg.no,lg.next_match_at),matches:leagueLength(lg),swaps:CFG.MAX_SWAPS,managers,sql,db_mb,db_limit_mb:CFG.DB_LIMIT_MB};
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
      return {phase:'draft',now,pool:pool.players.map(ownPlayer),league:leagueInfo(lg)};
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
  // A league that has ended leaves every team outside the next one until its manager enters it.
  const out=row.league_no!==lg.no;
  if(!out){
    // back after a long absence, or the pairing broke: find this manager an opponent
    let paired=!!row.next_opp;
    if(paired){const o=await store.teamById(row.next_opp);paired=!!(o&&o.next_opp===row.id);}
    if(!paired){await store.attach(row.id,now);row=await store.teamByKey(h);}
  }
  const d=row.data;let extra=null,dirty=false;
  if(now-row.last_seen>3600000){row.last_seen=now;dirty=true;}
  if(out&&['talk','teamtalk','plan','vote'].includes(a))return {error:'Your team is not in '+(isSeasonal(lg.no)?'the ':'')+leagueName(lg.no,lg.next_match_at,true)+' yet. Enter the league first.'};
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
  }else if(a==='enter'||a==='swap'){   // enter the league that is running now, changing a player on the way in if the last league just ended ('swap' is what older copies of the game send)
    const fresh=!!(d.final&&!d.final.seen);   // this team finished a league and has not started another since
    if(!out&&!fresh)return a==='enter'?makeView(store,row,lg,now,null):{error:'No swaps now. They open when a league ends.'};
    const outs=Array.isArray(req.outs)?[...new Set(req.outs)]:[],ins=Array.isArray(req.ins)?[...new Set(req.ins)]:[];
    if(outs.length||ins.length){
      if(!fresh)return {error:'No player changes now. They open when a league you played in ends.'};
      if(outs.length>CFG.MAX_SWAPS||outs.length!==ins.length)return {error:'You may change '+(CFG.MAX_SWAPS===1?'one player':'up to '+CFG.MAX_SWAPS+' players')+', one in for each one out.'};
      const agents=d.agents||[];
      if(outs.some(id=>!d.players.some(p=>p.id===id))||ins.some(id=>!agents.some(p=>p.id===id)))return {error:'bad swap'};
      d.players=d.players.filter(p=>!outs.includes(p.id)).concat(agents.filter(p=>ins.includes(p.id)));
    }
    d.agents=[];if(d.final)d.final.seen=true;
    if(out)d.vote=null;
    enforceRule(d,lg.rule);row.last_seen=now;
    if(out){await store.enterLeague(row,lg.no);await store.attach(row.id,now);row=await store.teamByKey(h);}   // into this league from zero, then an opponent
    else await store.saveTeam(row);
    return makeView(store,row,lg,now,{entered:out});
  }else if(a==='round'){           // the match reports of one match day (the latest one if none is named)
    extra={round:await roundView(store,req)};
  }else if(a==='push'){            // this device wants result notifications
    const s=req.sub||{},k=s.keys||{};
    if(typeof s.endpoint!=='string'||s.endpoint.length>600||!pushHostOk(s.endpoint)||typeof k.p256dh!=='string'||typeof k.auth!=='string'||k.p256dh.length>120||k.auth.length>60)return {error:'This browser cannot receive notifications from the game.'};
    try{if(ub64(k.p256dh).length!==65||ub64(k.auth).length<8)throw 0;}catch(e){return {error:'This browser cannot receive notifications from the game.'};}
    d.push=[...(d.push||[]).filter(x=>x.endpoint!==s.endpoint),{endpoint:s.endpoint,p256dh:k.p256dh,auth:k.auth,at:now}].slice(-4);   // up to four devices
    dirty=true;
  }else if(a==='pushoff'){         // stop on this device, or on all of them
    d.push=typeof req.endpoint==='string'?(d.push||[]).filter(x=>x.endpoint!==req.endpoint):[];
    dirty=true;
  }else if(a==='pushtest'){        // send a test notification to this manager's devices
    const vapid=await getVapid(store);if(!vapid||!(d.push||[]).length)return {error:'Notifications are not turned on for this team.'};
    if(now-(d.pushTestAt||0)<20000)return {error:'A test was sent a moment ago.'};
    d.pushTestAt=now;
    const r=await pushToTeam(row,{t:'3nD Basketball',b:'Notifications work. You will get one after each match, with your result.',tag:'b3-test'},vapid);
    if(r.dead.length)d.push=d.push.filter(x=>!r.dead.includes(x.endpoint));
    extra={pushtest:{sent:r.sent,devices:r.devices}};dirty=true;
  }else if(a!=='view')return {error:'unknown action'};
  if(dirty)await store.saveTeam(row);
  return makeView(store,row,lg,now,extra);
}
