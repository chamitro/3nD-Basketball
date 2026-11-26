// 3nD Basketball: the online league. Runs on the server only, on top of engine.js.
// The browser sends choices ("talk to this player: praise", "this is my plan"); everything is decided here.
// `store` is the database (see the bottom of the server function for the real one, the tests use one in memory).
// store.saveTeam writes only if the row has not changed since it was read (it throws 'conflict' otherwise),
// so a request that overlaps a match day can never write old data over the result.

const CFG={
  MATCH_HOUR_UTC:18,      // matches are played at this hour, UTC
  MATCH_DAYS:[0,3,5],     // the seasonal leagues: Sunday, Wednesday and Friday (Harry, 14 Nov 2026: three matches a week in every league)
  TEST_DAYS:[0,3,5],      // the leagues before SEASONS_FROM: Sunday, Wednesday and Friday
  LEAGUE_MATCHES:13,      // length of the leagues before SEASONS_FROM: 13 match days, so that 13 or 14 teams all meet each other once (League 1: Sun 8 Nov - Sun 6 Dec 2026)
  SEASONS_FROM:2,         // from this league number on, a league lasts one season of the year: Winter (Dec-Feb), Spring (Mar-May), Summer (Jun-Aug), Autumn (Sep-Nov)
  MAX_SWAPS:1,            // players a manager may change between leagues
  MID_DAYS:2,MID_SWAPS:2,MID_MIN:20,   // the mid-season window: opens once half the matches of a league of 20 or more are played, stays open for two match days, up to two changes under the window cap (Harry, 12 Nov 2026)
  REDRAFT_AFTER:[1],      // when one of these leagues ends, every team drafts seven new players from fourteen instead of changing one (League 1: the switch to the players with body types, Harry 12 Nov 2026)
  IDLE_DAYS:0,            // 0: an absent manager's team keeps playing with its last line-up and plan until the league ends (Harry, 13 Nov 2026); before, 21 days of silence left a team out until its manager returned
  DB_LIMIT_MB:500,        // the room the free Supabase plan gives the database; `ping` reports how much is used
  HALL_SIZE:50,           // how many teams the all-time list of league winners shows
  HOUSE_NAME:'The House Team',
  LEAGUE_START:{2:Date.UTC(2026,11,11,18,0)},
  FIRST_DRAW:24*3600000,   // a season league's first week is drawn this long before its first match (Harry, 23 Nov 2026); those who enter later take the computer team's place   // a league that starts later than the next match day: the Winter League on Friday 11 December 2026 (Harry, 23 Nov 2026: time for new players to join)
  PO_FROM:2,PO_DAYS:9,PO_MIN:18,   // play-offs from the Winter League on (Harry, 17 Nov 2026): the last nine match days, three weeks of best-of-three series; only in a league of 18 match days or more
};
const DAY_MS=86400000;
const SERVER_BUILD='dev';   // build.py puts a fingerprint of the server code here, and `ping` reports it, so a deployment can be checked from outside

// the match days of league `no` (days of the week, 0 = Sunday)
const midAfter=lg=>Math.floor(leagueLength(lg)/2);   // the mid-season window opens after this match
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
// Every player in the league is one of a kind (Harry, 12 Nov 2026): no two players, on any team or in any draft pool
// still open, share a name. `taken` is every name in use; a pool or a squad is made against it.
async function takenNames(store,withPools){
  const names=new Set();const add=ps=>{for(const p of ps||[])if(p&&p.n)names.add(p.n);};
  for(const t of await store.allTeams()){add(t.data.players);add(t.data.agents);if(t.data.redraft)add(t.data.redraft.pool);if(t.data.mid)add(t.data.mid.agents);}   // the window's free agents too (20 Nov 2026)
  const house=await store.house();if(house)add(house.data.players);
  if(withPools&&store.poolNames)for(const n of await store.poolNames())names.add(n);
  return names;
}
function newPlayers(n,avoid){
  usedNames.clear();for(const x of avoid||[])usedNames.add(x);
  const out=[],ids=new Set();
  for(let i=0;i<n;i++){const p=makePlayer();do{p.id=1+Math.floor(R()*2000000000);}while(ids.has(p.id));ids.add(p.id);out.push(p);}
  return out;
}
// the computer team's seven, like everyone's, fit under the cap: the best seven of a pool that do
function capSeven(pool,cap){const ps=[...pool].sort((a,b)=>rating(b)-rating(a));const out=[];let v=0;
  for(const p of ps){if(out.length<7&&v+valueOf(p)<=cap){out.push(p);v+=valueOf(p);}}
  if(out.length===7)return out;
  const cheap=[...pool].sort((a,b)=>valueOf(a)-valueOf(b)).slice(0,7);return squadValue(cheap)<=cap?cheap:null;}
// a pool of fourteen a manager can always draft from: its cheapest seven leave room under the cap, its dearest seven do not fit
function fairPool(avoid,cap){let pool=null;for(let t=0;t<40;t++){pool=newPlayers(14,avoid);const byV=[...pool].sort((a,b)=>valueOf(a)-valueOf(b));if(squadValue(byV.slice(0,7))<=cap-10&&squadValue(byV.slice(7))>cap)return pool;}return pool;}
function houseSeven(avoid){for(let t=0;t<30;t++){const s=capSeven(newPlayers(14,avoid),CAP);if(s)return s;}return newPlayers(7,avoid);}
const overCap=(ps,cap)=>squadValue(ps)>cap?'Over the cap: this squad is worth '+money(squadValue(ps))+' and the cap is '+money(cap)+'. Let a dearer player go.':null;
// what a manager may see of their own player: everything except the secret soft spot and sore spot
function ownPlayer(p){const q={...p};delete q.love;delete q.hate;delete q.rg;delete q.tough;delete q.frail;q.en=energyOf(p);return q;}   // energy is always sent, also for players from before it existed
// what everybody may see of somebody else's player: looks, character and dots, never mood or trust
function pubPlayer(p){return {id:p.id,n:p.n,age:p.age,h:p.h,bulk:p.bulk,ht:p.ht,bd:p.bd,col:p.col,top:p.top,shape:p.shape,num:p.num,hair:p.hair,beard:p.beard,specs:p.specs,acc:p.acc,socks:p.socks,shoe:p.shoe,cheek:p.cheek,inj:p.inj>0?p.inj:0,sh:p.sh,df:p.df,sp:p.sp,ph:p.ph,eye:p.eye,teeth:p.teeth,mood:'ok',trust:0,tr:{sh:0,df:0,sp:0}};}   // no character (Harry, 22 Nov 2026: another team's characters are not shown; trash talk is a risk)
// a line-up for a squad nobody has set up yet: the three best start, the next two sit on the bench, the best shooter is the star
function firstLineup(d,rule){const avail=rule==='tall_out'?d.players.filter(p=>p.id!==tallestId(d)):d.players;const top=[...avail].sort((a,b)=>rating(b)-rating(a));/* under "tall player out" the tallest sits out, so three others start */d.starters=top.slice(0,3).map(p=>p.id);d.subs=top.slice(3,5).map(p=>p.id);d.ball=top.slice(0,3).sort((a,b)=>b.sh-a.sh)[0].id;}
function cleanName(s){s=String(s||'').replace(/[^\p{L}\p{N} _.\-']/gu,'').replace(/\s+/g,' ').trim().slice(0,22);return s;}
// A team name is on a table everybody sees. With the game public (itch.io, December 2026) the plain insults are refused,
// in English, Greek and Greeklish: every entry as a whole word, the longer ones anywhere in the name (so Dickens, cocktails,
// Scunthorpe and Cumbria pass, fuckers and assholes do not). Accents are dropped before the check.
const normName=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
const BAD_WORDS=['fuck','fucker','fuckers','fucking','fucked','shit','shits','shitty','shithead','shitheads','cunt','cunts','nigger','niggers','nigga','niggas','faggot','faggots','fag','fags',
  'bitch','bitches','dick','dicks','dickhead','pussy','pussies','asshole','assholes','whore','whores','slut','sluts','retard','retards','retarded','nazi','nazis','hitler',
  'rape','rapist','porn','penis','vagina','wank','wanker','wankers','twat','twats','cum',
  'malaka','malakas','malakes','poutana','poutanes','poutanas','gamo','gamw','gamiesai','gamiese','skata','arxidia','arxidi','mouni','mounia','poutsa','poutses','pousti','poustis','poustides','kolos','kwlos',
  'μαλακα','μαλακας','μαλακες','πουτανα','πουτανες','πουτανας','γαμω','γαμιεσαι','γαμησε','σκατα','αρχιδια','αρχιδι','μουνι','μουνια','πουτσα','πουτσες','πουστη','πουστης','πουστηδες','κωλος'].map(normName);
function nameFit(name){
  const words=normName(name).split(/[^\p{L}\p{N}]+/u).filter(Boolean),flat=words.join('');
  return !BAD_WORDS.some(w=>words.includes(w)||(w.length>=5&&flat.includes(w)));
}
function threeRules(not){return RULES.filter(r=>r.k!==not).sort(()=>R()-0.5).slice(0,3).map(r=>r.k);}
const DEF_SHEET={tempo:1,shots:1,def:0,off:0,guard:0,boards:1};

// the window cap at the mid-season window: the lower half of the table as it stands when the window opens gets CAP_BONUS (Harry, 17 Nov 2026)
const midCap=d=>CAP_WINDOW+((d.mid&&d.mid.bonus)||0);
const midOpen=(d,lg)=>!!(d.mid&&d.mid.league===lg.no&&lg.match_no<=d.mid.until&&d.mid.agents);
function newTeamRow(hash,name,players,leagueNo,now,kit){
  const top=[...players].sort((a,b)=>rating(b)-rating(a));
  const data={name,players,starters:top.slice(0,3).map(p=>p.id),subs:top.slice(3,5).map(p=>p.id),
    ball:top.slice(0,3).sort((a,b)=>b.sh-a.sh)[0].id,sheet:{...DEF_SHEET},teamTalked:false,vote:null,last:null,final:null,agents:[],won:0,played:0};
  return {key_hash:hash,name,name_lc:name.toLowerCase(),is_house:false,league_no:leagueNo,w:0,l:0,pf:0,pa:0,pts:0,next_opp:null,last_seen:now,ver:0,pub:{kit:kitOf(kit,name)},data};
}
function newHouseRow(leagueNo,now){
  const t=makeTeam(CFG.HOUSE_NAME,houseSeven(),false);t.skill=0.6;
  const top=[...t.players].sort((a,b)=>rating(b)-rating(a));t.starters=top.slice(0,3).map(p=>p.id);t.subs=top.slice(3,5).map(p=>p.id);t.ball=t.starters[0];
  return {key_hash:'house',name:CFG.HOUSE_NAME,name_lc:CFG.HOUSE_NAME.toLowerCase(),is_house:true,league_no:leagueNo,w:0,l:0,pf:0,pa:0,pts:0,next_opp:null,last_seen:now,ver:0,pub:{kit:randomKit()},data:t};
}
const standing=(a,b)=>b.pts-a.pts||(b.pf-b.pa)-(a.pf-a.pa)||(a.name<b.name?-1:1);
// the table of a league: points in League 1, winning percentage in the season leagues (Harry, 26 Nov 2026)
const tableOf=(lg,rows)=>isSeasonal(lg.no)?rankTeams(rows,(poLen(lg)||{reg:leagueLength(lg)}).reg):[...rows].sort(standing);

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
    for(const j of adj[i]){if(!(free&(1<<j))||used.has(ek(i,j))||(k===0&&noPrev&&order[i]._prev===order[j].id))continue;pairs.push([i,j]);if(matching(free&~(1<<i)&~(1<<j),pairs,k))return true;pairs.pop();}
    return false;
  };
  const rounds=(k,pairs)=>{if(k===1)first=pairs.map(x=>[...x]);if(k===deg)return true;return matching((1<<n)-1,[],k);};
  // the match day being drawn never repeats the last one's pairs if that can be helped (20 Nov 2026: the last two teams
  // left were paired whatever, and at the start of a second round robin they had sometimes just met)
  let noPrev=true;
  for(const np of [true,false]){noPrev=np;used.clear();first=null;budget=200000;try{if(rounds(0,[]))return first.map(([i,j])=>[order[i],order[j]]);}catch(e){}}
  return null;
}
function pairUp(list,house,met,roundsLeft){
  met=met||new Map();const timesMet=(x,y)=>met.get(pairKey(x,y))||0;roundsLeft=roundsLeft||0;
  for(const t of list){t._prev=t.next_opp;t.next_opp=null;}
  house._prev=house.next_opp;house.next_opp=null;
  const order=[...list].sort((a,b)=>standing(a,b));
  if(order.length%2===1)order.push(house);               // the house team takes part only when the number is odd, at the bottom of the table
  if(!order.length){delete house._prev;return;}
  // who meets whom (Harry, 20 Nov 2026): someone you have not played yet, then not the one you just played, and among
  // those pure chance. Until then the closest in the table was preferred, so the top teams kept meeting each other.
  const luck=new Map(),draw=(a,b)=>{const k=pairKey(a.id,b.id);if(!luck.has(k))luck.set(k,R());return luck.get(k);};
  const cost=(a,b)=>timesMet(a.id,b.id)*10+(a._prev===b.id?5:0)+draw(a,b)*0.01;
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
// ───────────────────────── play-offs (Harry, 17 Nov 2026) ─────────────────────────
// The last PO_DAYS match days of a seasonal league are play-offs, one round a week, every series best of three.
// The top eight (Harry, 19 Nov 2026, from a friend's sketch; the Silver Cup is gone): quarter-finals 1 v 8, 4 v 5, 3 v 6,
// 2 v 7, semi-finals (1/8 v 4/5, 3/6 v 2/7), the final. 1st and 2nd get the weakest opponents and cannot meet before the
// final. With fewer teams the bracket shrinks to six (3 v 6 and 4 v 5,
// 1 and 2 have a bye), four (1 v 4, 2 v 3 in week two) or a final (week three). Everyone else, and every team knocked out, has no match (no friendlies since 26 Nov 2026); a team with a bye, or
// whose series of the week is already decided, rests. Seeds are kept in each team's data and pub (`po`), the series are
// worked out from the match records (`detail.po`), so nothing new is stored in the league row.
// The rule of every play-off game is drawn at random (poRandomRule); there is no vote in the play-offs.
const PO_SHAPES={8:[['q1',1,8,0],['q2',4,5,0],['q3',3,6,0],['q4',2,7,0],['s1','q1','q2',1],['s2','q3','q4',1],['f','s1','s2',2]],6:[['a',3,6,0],['b',4,5,0],['s1',1,'a',1],['s2',2,'b',1],['f','s1','s2',2]],4:[['s1',1,4,1],['s2',2,3,1],['f','s1','s2',2]],2:[['f',1,2,2]]};
const PO_CUPS={t:'Play-offs'};
function poLen(lg){if(!isSeasonal(lg.no)||lg.no<CFG.PO_FROM)return null;const len=leagueLength(lg);return len>=CFG.PO_MIN?{len,reg:len-CFG.PO_DAYS}:null;}
const poDay=(P,m)=>P&&m>P.reg?m-P.reg:0;   // 1..9 in the play-offs, 0 before
const poSize=n=>n>=8?8:n>=6?6:n>=4?4:n>=2?2:0;
// the final order of the regular season: points, then the matches among the teams level on points, then +/-, then points scored
function poOrder(teams,results,reg){if(reg!==undefined)return rankTeams(teams,reg,results);   // the season leagues: winning percentage (26 Nov 2026)
  const s=[...teams].sort((a,b)=>b.pts-a.pts),out=[];
  for(let i=0;i<s.length;){let j=i;while(j<s.length&&s[j].pts===s[i].pts)j++;const g=s.slice(i,j);
    if(g.length>1){const ids=new Set(g.map(t=>t.id)),w=new Map();
      for(const m of results)if(ids.has(m.a)&&ids.has(m.b)){const x=m.score_a>m.score_b?m.a:m.b;w.set(x,(w.get(x)||0)+1);}
      g.sort((a,b)=>(w.get(b.id)||0)-(w.get(a.id)||0)||(b.pf-b.pa)-(a.pf-a.pa)||b.pf-a.pf||(a.name<b.name?-1:1));}
    out.push(...g);i=j;}
  return out;
}
// seeds for the teams in that order: [{id, cup:'t'|null, seed, pos}] (cup 's' was the Silver Cup, 17-19 Nov 2026, never played)
function poSeeds(order){
  const ts=poSize(order.length);
  return order.map((t,i)=>({id:t.id,cup:i<ts?'t':null,seed:i<ts?i+1:null,pos:i+1}));
}
const poOf=(t,no)=>{const po=(t.data&&t.data.po)||(t.pub&&t.pub.po);return po&&po.league===no?po:null;};
// the brackets as they stand: {t:{size,series:{key:{k,r,hi,lo,wh,wl,games,win,lose}}}, s:...}; hi/lo are team ids
function poState(teams,results,no){
  const seeds={t:new Map()},seedOf=new Map(),cups={};
  for(const t of teams){const po=poOf(t,no);if(!po||!seeds[po.cup])continue;seeds[po.cup].set(po.seed,t.id);seedOf.set(t.id,po.seed);}
  for(const c of ['t']){const shape=PO_SHAPES[seeds[c].size];if(!shape)continue;const ser={};
    for(const [k,h,l,r] of shape){
      const src=x=>typeof x==='number'?seeds[c].get(x)||null:(ser[x]&&ser[x].win)||null;
      let hi=src(h),lo=src(l);if(hi&&lo&&seedOf.get(lo)<seedOf.get(hi))[hi,lo]=[lo,hi];
      const games=results.filter(m=>m.po&&m.po.c===c&&m.po.s===k).sort((x,y)=>x.match_no-y.match_no)
        .map(m=>({m:m.match_no,a:m.a,b:m.b,sa:m.score_a,sb:m.score_b,rule:m.rule}));
      let wh=0,wl=0;for(const g of games){const w=g.sa>g.sb?g.a:g.b;if(w===hi)wh++;else if(w===lo)wl++;}
      const win=hi&&lo?(wh>=2?hi:wl>=2?lo:null):null;
      ser[k]={k,r,hi,lo,wh,wl,games,win,lose:win?(win===hi?lo:hi):null};}
    cups[c]={size:seeds[c].size,series:ser};}
  return cups;
}
// the series two teams are playing on play-off day `day`, if any: {c, s, g (games played), picker}
function poSeriesOf(cups,day,x,y){
  const r=Math.floor((day-1)/3);
  for(const c of Object.keys(cups))for(const s of Object.values(cups[c].series)){
    if(s.r!==r||s.win||!s.hi||!s.lo)continue;
    if((s.hi===x&&s.lo===y)||(s.hi===y&&s.lo===x)){const g=s.games.length;return {c,s:s.k,g,picker:g===1?s.lo:s.hi,ser:s};}}
  return null;
}
// what a team does on play-off day `day`: 'series' (with the opponent), 'rest' (a bye, or its series of the week is decided) or 'friendly' (no match: out of the brackets or knocked out; the name is kept from when they played friendlies)
function poRole(cups,day,id){
  const r=Math.floor((day-1)/3);
  for(const c of Object.keys(cups)){const ser=Object.values(cups[c].series),mine=ser.filter(s=>s.hi===id||s.lo===id),now=mine.find(s=>s.r===r);
    if(now)return now.win||!now.hi||!now.lo?{role:'rest'}:{role:'series',opp:now.hi===id?now.lo:now.hi,c,s:now.k};
    if(mine.some(s=>s.r>r)&&ser.some(s=>s.r===r))return {role:'rest',bye:true};}   // a bye: this cup plays this week, this team starts later
  return {role:'friendly'};
}
// the rule of a play-off game (Harry, 21 Nov 2026): drawn at random for every game. It is worked out from the league, the
// match day and the series, so it is the same on every request and nothing is stored; managers see it as soon as the pairs
// are made. Until then the higher seed picked games 1 and 3 and the lower seed game 2. Friendlies keep the voted rule.
function poRandomRule(no,match,c,s){let h=2166136261;for(const ch of no+':'+match+':'+c+':'+s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return RULES[h%RULES.length].k;}
// ───────────────────────── the week's fixtures (Harry, 23 Nov 2026, season leagues) ─────────────────────────
// After a Sunday match the next week (Wednesday, Friday, Sunday; the first week of a league is shorter) is drawn for everybody
// at once, by the same draw as every match day (pairUp: teams not met yet, never twice running, otherwise chance), so managers
// see their week ahead. It is kept in each team's pub.fx = {lg, from: first match, opps: [an id, or null for no match]}. A
// manager who joins during the week takes the computer team's place in its fixtures (slot: true); a second one plays the
// computer team. Nobody else's week changes. The play-offs have their bracket instead.
const dowUTC=t=>new Date(t).getUTCDay();
function weekLen(lg,reg){let n=0,t=lg.next_match_at;while(lg.match_no+n<=reg){n++;if(dowUTC(t)===0)break;t=nextMatchTime(t,lg.no);}return n;}
const fxOf=(t,no,m)=>{const f=t&&t.pub&&t.pub.fx;if(!f||f.lg!==no)return undefined;const i=m-f.from;return i>=0&&i<f.opps.length?f.opps[i]:undefined;};   // undefined: no fixture, null: no match
function drawWeek(active,house,met,roundsLeft,K,no,m){
  const all=[...active,house],C=new Map(all.map(t=>[t.id,{id:t.id,name:t.name,pts:t.pts,pf:t.pf,pa:t.pa,next_opp:t.next_opp}]));
  const cl=active.map(t=>C.get(t.id)),hc=C.get(house.id),M=new Map(met),opps=new Map(all.map(t=>[t.id,[]]));
  for(let k=0;k<K;k++){pairUp(cl,hc,M,Math.max(0,roundsLeft-k));
    for(const c of [...cl,hc]){opps.get(c.id).push(c.next_opp||null);if(c.next_opp&&String(c.id)<String(c.next_opp)){const key=pairKey(c.id,c.next_opp);M.set(key,(M.get(key)||0)+1);}}}
  for(const t of all){t.pub={...t.pub,fx:{lg:no,from:m,opps:opps.get(t.id)}};t.next_opp=opps.get(t.id)[0]||null;}
}
function useWeek(active,house,met,no,m){
  const all=[...active,house],byId=new Map(all.map(t=>[t.id,t]));
  const holder=active.find(t=>t.pub&&t.pub.fx&&t.pub.fx.slot&&fxOf(t,no,m)!==undefined)||null;
  const eff=t=>{if(t===house)return holder?undefined:fxOf(house,no,m);const o=fxOf(t,no,m);return o===house.id&&holder?holder.id:o;};
  for(const t of all)t.next_opp=null;
  for(const t of all){if(t.next_opp)continue;const o=eff(t);if(!o)continue;const u=byId.get(o);if(!u||u.next_opp||eff(u)!==t.id)continue;t.next_opp=u.id;u.next_opp=t.id;}
  // newcomers (no fixture this week): the first takes the computer team's place for the rest of the week
  const fresh=active.filter(t=>fxOf(t,no,m)===undefined);
  if(fresh.length&&!holder&&house.next_opp){const x=byId.get(house.next_opp),n=fresh.shift(),hf=house.pub.fx;
    house.next_opp=null;x.next_opp=n.id;n.next_opp=x.id;n.pub={...n.pub,fx:{lg:no,from:hf.from,opps:[...hf.opps],slot:true}};}
  const left=active.filter(t=>!t.next_opp);
  if(left.length&&!house.next_opp)pairUp(left,house,met,0);   // the others (and anyone whose fixture broke) play each other, the last the computer team
  const hf=house.pub&&house.pub.fx;if(hf&&hf.lg===no)for(const t of left)if(t.next_opp===house.id&&fxOf(t,no,m)===undefined)t.pub={...t.pub,fx:{lg:no,from:m,opps:Array(Math.max(1,hf.from+hf.opps.length-m)).fill(house.id)}};
}
// the first week of a season league, drawn once CFG.FIRST_DRAW before its first match for everybody who has entered by then
// (until then managers are paired as they enter); a short lock keeps two requests from drawing at once
async function firstDraw(store,lg,now){
  const house=await store.house();if(!house||(house.pub&&house.pub.fx&&house.pub.fx.lg===lg.no))return;   // drawn already
  if(!store.lockFree||!(await store.lockFree(now)))return;
  const fresh=await store.league();if(fresh.match_no!==1||fresh.no!==lg.no){return;}
  const h=await store.house();if(h.pub&&h.pub.fx&&h.pub.fx.lg===lg.no){await store.commit({league:fresh,teams:[],matches:[],reset:false});return;}
  const active=(await store.allTeams()).filter(t=>t.league_no===lg.no);
  const P=poLen(fresh),reg=P?P.reg:leagueLength(fresh);
  for(const t of [...active,h])t.next_opp=null;   // the pairs made as managers entered do not count
  drawWeek(active,h,new Map(),leagueLength(fresh),weekLen(fresh,reg),lg.no,1);
  await store.commit({league:fresh,teams:[...active,h],matches:[],reset:false});   // writes the week and frees the lock
}
// a manager who has just been given an opponent during a week gets that week too: the computer team's fixtures if they took
// its place, or the computer team for the rest of the week if they play it
async function fxOnAttach(store,row,lg){
  if(!row||!isSeasonal(lg.no)||!row.next_opp||fxOf(row,lg.no,lg.match_no)!==undefined)return row;
  const house=await store.house(),hf=house&&house.pub&&house.pub.fx;if(!hf||hf.lg!==lg.no)return row;
  const end=hf.from+hf.opps.length,m=lg.match_no;if(m>=end)return row;
  if(row.next_opp===house.id)row.pub={...row.pub,fx:{lg:lg.no,from:m,opps:Array(end-m).fill(house.id)}};
  else if(fxOf(house,lg.no,m)===row.next_opp)row.pub={...row.pub,fx:{lg:lg.no,from:hf.from,opps:[...hf.opps],slot:true}};
  else return row;
  try{await store.saveTeam(row);}catch(e){}   // a conflict only means the week is set at the next match day
  return row;
}
// the week as the page shows it: my fixtures and all of the week's matches, with names and dates
function weekView(lg,tbl,row,house){
  const no=lg.no,P=poLen(lg),reg=P?P.reg:null;if(!isSeasonal(no)||!reg||lg.match_no>reg)return null;
  const rows=[...tbl.filter(t=>t.id!==row.id),row];const holder=rows.find(t=>t.pub&&t.pub.fx&&t.pub.fx.lg===no&&t.pub.fx.slot);
  const name=id=>id===(house&&house.id)?(holder?holder.name:'the computer team'):((rows.find(t=>t.id===id)||{}).name||'');
  const f=row.pub&&row.pub.fx;if(!f||f.lg!==no)return null;
  const days=[];let t=lg.next_match_at;for(let m=lg.match_no;m<f.from+f.opps.length;m++){
    const pairs=[];for(const x of rows){if(x===holder)continue;const o=fxOf(x,no,m);if(!o)continue;if(o!==(house&&house.id)&&rows.some(y=>y.id===o)&&String(x.id)>String(o))continue;pairs.push([x.name,name(o)]);}
    days.push({m,at:t,opp:fxOf(row,no,m)?name(fxOf(row,no,m)):null,pairs});t=nextMatchTime(t,no);}
  return {days};
}
// pairs for play-off day `day`: the series of the week; everyone else has no match
function poPair(cups,day,humans,house,met){
  for(const t of humans)t.next_opp=null;
  const byId=new Map(humans.map(t=>[t.id,t])),free=[];
  for(const t of humans){const r=poRole(cups,day,t.id);
    if(r.role==='series'){const o=byId.get(r.opp);if(o){t.next_opp=o.id;o.next_opp=t.id;}}}
  // no friendlies (Harry, 26 Nov 2026): a team outside the brackets, knocked out, with a bye or a decided series has no match and
  // rests (energy back, injuries counting down) until the next league
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
  if(isSeasonal(lg.no)&&lg.match_no===1&&now>=lg.next_match_at-CFG.FIRST_DRAW)await firstDraw(store,lg,now);   // also right before the first match if nobody came by since the draw time
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
  const rule=lg.rule,matches=[],done=new Set(),playedLeague=lg.no,playedMatch=lg.match_no,playedAt=lg.next_match_at;
  // play-offs: the series as they stand before today; teams resting today are not in play but are saved (their players rest)
  const P=poLen(lg),pday=poDay(P,lg.match_no),seedDay=!!P&&lg.match_no===P.reg;
  const poRes=pday>0||seedDay?await store.leagueResults(lg.no):[];let cups=null;
  if(pday>0){for(const t of await store.allTeams())if(t.league_no===lg.no&&!map.has(t.id)){rows.push(t);map.set(t.id,t);t._rest=true;}
    cups=poState(rows.filter(r=>!r.is_house),poRes,lg.no);}
  // the pairings first: a broken one (the opponent was deleted or re-paired in the week) does not cost a match any more:
  // orphans play each other, the last orphan plays the computer team if it is free (13 Nov 2026: Sisa sat out a match
  // after a deleted team's pairing had pointed at them)
  const pairs=[],orphans=[];
  for(const A of rows){
    if(done.has(A.id)||!A.next_opp)continue;
    const B=map.get(A.next_opp);
    if(!B||B.next_opp!==A.id||done.has(B.id)){A.next_opp=null;if(!A.is_house)orphans.push(A);continue;}
    done.add(A.id);done.add(B.id);pairs.push([A,B]);
  }
  while(orphans.length>=2){const A=orphans.shift(),B=orphans.shift();done.add(A.id);done.add(B.id);pairs.push([A,B]);}
  if(orphans.length&&house&&!done.has(house.id)){const A=orphans.shift();done.add(A.id);done.add(house.id);pairs.push([A,house]);}
  for(const [A,B] of pairs){
    // a play-off game is played under its own rule, drawn at random
    const ps=cups?poSeriesOf(cups,pday,A.id,B.id):null;
    const rule=ps?poRandomRule(lg.no,lg.match_no,ps.c,ps.s):lg.rule;
    if(ps){if(!A.is_house)enforceRule(A.data,rule);if(!B.is_house)enforceRule(B.data,rule);}
    if(A.is_house)botPrepare(A.data,B.data,rule,B.pub.ls||null);
    if(B.is_house)botPrepare(B.data,A.data,rule,A.pub.ls||null);
    const ordersOf=T=>{const o=T.data.orders||{};return ORDER_KEYS.some(w=>o[w])?{behind:o.behind||null,close:o.close||null,ahead:o.ahead||null}:null;};
    const before={a:{st:[...A.data.starters],ball:A.data.ball,sheet:{...A.data.sheet},orders:ordersOf(A)},b:{st:[...B.data.starters],ball:B.data.ball,sheet:{...B.data.sheet},orders:ordersOf(B)}};
    // trash talk: the last word before tip-off. Each side's line (if any) lands on the other team's players; the sender is banned next match.
    const wasBanned={a:(A.data.ban||0)>0,b:(B.data.ban||0)>0};
    const trash={a:null,b:null};
    for(const [X,Y,k] of [[A,B,'a'],[B,A,'b']]){const t=X.data.trash;X.data.trash=null;
      if(!t||t.league!==lg.no||t.match!==lg.match_no||t.opp!==Y.id||!TRASH[t.i]||X.is_house)continue;
      const heard=(Y.data.heard||{})[X.id]||0;const fx=trashTeam(Y.data,t.i,Y.data.ball,heard);
      Y.data.heard={...(Y.data.heard||{}),[X.id]:heard+1};
      trash[k]={i:t.i,line:TRASH[t.i].txt,by:X.name,to:Y.name,rattled:fx.rattled,fired:fx.fired};}
    const r=playMatch(A.data,B.data,rule);
    // the report everybody may read: three strong and three weak points of each side (worked out before moods change)
    const reps=new Map([[A,scoutReport(r.a,r.b,rule)],[B,scoutReport(r.b,r.a,rule)]]);
    const sides=[[A,r.a,r.b,B,before.a,before.b],[B,r.b,r.a,A,before.b,before.a]];
    const rec={league_no:lg.no,match_no:lg.match_no,a:A.id,b:B.id,a_name:A.name,b_name:B.name,score_a:r.a.score,score_b:r.b.score,rule,detail:{at:lg.next_match_at,lname:leagueName(lg.no,lg.next_match_at)}};
    if(ps)rec.detail.po={c:ps.c,s:ps.s,g:ps.g};
    for(const [X,xs,ys,Y,mine,theirs] of sides){
      const won=xs.score>ys.score;
      if(!pday){X.pf+=xs.score;X.pa+=ys.score;if(won){X.w++;X.pts+=3;}else X.l++;}   // the table is final after the regular season: play-off games and friendlies do not count in it
      const lines=reportLines(xs,ys,won,rule);
      // in the play-offs: where the series stands after this game, or that it was a friendly
      if(ps){const ser=ps.ser,wid=r.a.score>r.b.score?A.id:B.id,wh=ser.wh+(wid===ser.hi?1:0),wl=ser.wl+(wid===ser.lo?1:0),my=X.id===ser.hi?wh:wl,th=X.id===ser.hi?wl:wh;
        const rd=ps.s==='f'?'final':ps.s[0]==='s'?'semi-final':ps.s[0]==='q'?'quarter-final':'round one';
        lines.unshift(`${PO_CUPS[ps.c]}, ${rd}, game ${ps.g+1}: series ${my}–${th}.`+(my===2?(ps.s==='f'?' YOU ARE THE CHAMPIONS!':' You are through!'):th===2?(ps.s==='f'?' You lost the final.':' You are out.'):''));}
      else if(pday)lines.unshift('A friendly: it does not count in the table.');
      // trash talk, as the manager hears of it (the sender's ban starts now, a ban served this match ends)
      const sent=trash[X===A?'a':'b'],got=trash[X===A?'b':'a'],who=a=>a.length?a.join(', ')+(a.length>1?' were':' was'):'';
      if(got)lines.unshift(`Before the match ${got.by} trash-talked you: "${got.line}" ${got.rattled.length?who(got.rattled)+' rattled. ':''}${got.fired.length?who(got.fired)+' fired up. ':''}${!got.rattled.length&&!got.fired.length?'Nobody cared.':''}`.trim());
      if(sent)lines.unshift(`Your trash talk: "${sent.line}" ${sent.rattled.length?who(sent.rattled)+' rattled. ':''}${sent.fired.length?who(sent.fired)+' fired up. ':''}${!sent.rattled.length&&!sent.fired.length?'Nobody cared. ':''}You are banned for the next match: no talks with your players, no half-time talk.`);
      if(!X.is_house){if(wasBanned[X===A?'a':'b']){X.data.ban=0;X.data.banFor=null;}if(sent){X.data.ban=1;X.data.banFor=Y.name;}}   // the sender is banned for the next match (Harry, 22 Nov 2026: the ban stays)
      // the half-time as everybody may read it: score, the order that fired (with the player's name), what was left for the other cases
      const leftWords=o=>{if(!o)return null;const a=[orderWords(o,X.data),o.talk?'talk: '+TONE_LABEL[o.talk].toLowerCase():''].filter(Boolean);return a.length?a.join(' + '):null;};
      const half=xs.half?{us:xs.half.us,them:xs.half.them,cond:xs.half.cond,order:xs.half.order,who:xs.half.pid?(byId(X.data,xs.half.pid)||{}).n||null:null,talk:xs.half.talk||null,
        left:mine.orders?Object.fromEntries(ORDER_KEYS.map(w=>[w,leftWords(mine.orders[w])])):null}:null;
      let moves=[];
      if(X.is_house)energyAfter(X.data,xs);   // the computer team tires like everyone else
      if(!X.is_house){moves=aftermath(X.data,xs,won,ys.score);weekReset(X.data,false);
        for(const p of X.data.players)if(p.hurt)lines.push(`${p.n} got hurt and limped off in the ${p.hurtWhen}${p.enWas<=2.5?', playing on tired legs':''}: out for ${injDays(p.inj)}.`);
        for(const id of ys.hurt||[]){const q=byId(Y.data,id);if(q)lines.push(`Their ${q.n} limped off injured in the ${ys.st[id].injured}.`);}
        X.data.last={league:lg.no,match:lg.match_no,opp:Y.name,us:xs.score,them:ys.score,won,lines,moves,oppSheet:theirs.sheet,oppKit:kitOf(Y.pub.kit,Y.name),oppHalf:null,half,rule,pros:reps.get(X).pros,cons:reps.get(X).cons,box:boxOf(xs),oppBox:boxOf(ys)};}
      // pub.rep: this team's last match as everybody may see it (shown to its next opponent)
      // pub.sc: this team's league so far in numbers (one small record, updated after each match)
      X.pub={...X.pub,ls:mine.sheet,lw:won,st:mine.st,ball:mine.ball,sc:seasonCard(X.pub.sc,lg.no,xs,ys,won),rep:{league:lg.no,match:lg.match_no,opp:Y.name,us:xs.score,them:ys.score,rule,pros:reps.get(X).pros,cons:reps.get(X).cons,half,trash:sent?sent.line:null}};
      rec.detail[X===A?'a':'b']={kit:kitOf(X.pub.kit,X.name),sheet:mine.sheet,half,trash:sent?{line:sent.line,rattled:sent.rattled,fired:sent.fired}:null,lines,pros:reps.get(X).pros,cons:reps.get(X).cons,box:boxOf(xs)};
    }
    matches.push(rec);
  }
  // a rest day: a bye, or a series already decided this week; the players get back what a match off gives
  for(const t of rows)if(t._rest){delete t._rest;for(const p of t.data.players){p.en=clamp(energyOf(p)+(ENERGY.REST+ENERGY.NIGHT)*ageRec(p),1,4);delete p.hurt;delete p.hurtWhen;if(p.inj>0){p.inj--;if(!p.inj){delete p.inj;p.en=Math.min(energyOf(p),INJ.back);}}}weekReset(t.data,false);t.data.rested={league:lg.no,match:lg.match_no};}
  const poAfter=()=>poState(rows.filter(r=>!r.is_house),[...poRes,...matches.map(m=>({match_no:m.match_no,a:m.a,b:m.b,score_a:m.score_a,score_b:m.score_b,rule:m.rule,po:m.detail.po||null}))],lg.no);
  const humans=rows.filter(r=>!r.is_house);
  // the vote: managers chose the rule for the match after the one just played
  const tally=lg.vote_opts.map(()=>0);
  for(const t of humans){if(Number.isInteger(t.data.vote)&&t.data.vote>=0&&t.data.vote<tally.length)tally[t.data.vote]++;t.data.vote=null;}
  const best=Math.max(...tally);const winners=tally.map((v,i)=>v===best?i:-1).filter(i=>i>=0);
  let newRule=lg.vote_opts[pick(winners)];if(!RULES.some(r=>r.k===newRule))newRule=pick(RULES).k;   // a rule taken out of the draw (26 Nov 2026) is never played again, even if it was voted before
  // the table as it stands now (teams not in play this time keep their points)
  const tbl=tableOf(lg,(await store.tableRows(lg.no)).map(t=>map.has(t.id)?map.get(t.id):t));
  const placeOf=id=>tbl.findIndex(t=>t.id===id)+1;
  for(const t of humans)if(t.data.last&&t.data.last.match===lg.match_no&&t.data.last.league===lg.no){t.data.last.place=placeOf(t.id);t.data.last.of=tbl.length;}
  // the regular season is over: the seeds, from the final order with head-to-head for teams level on points
  if(seedDay){const today=matches.map(m=>({a:m.a,b:m.b,score_a:m.score_a,score_b:m.score_b}));
    const inLg=tbl.filter(t=>map.has(t.id)&&!map.get(t.id).is_house).map(t=>map.get(t.id));
    for(const x of poSeeds(poOrder(inLg,[...poRes,...today],poLen(lg).reg))){const t=map.get(x.id),po={league:lg.no,cup:x.cup,seed:x.seed,pos:x.pos};t.data.po=po;t.pub={...t.pub,po};
      if(t.data.last&&t.data.last.league===lg.no&&t.data.last.match===lg.match_no){t.data.last.po=po;
        const nth=n=>n+(n%10===1&&n%100!==11?'st':n%10===2&&n%100!==12?'nd':n%10===3&&n%100!==13?'rd':'th');
        t.data.last.lines.unshift(`The regular season is over: you finished ${nth(x.pos)} of ${inLg.length}. `+(x.cup?`You are the ${nth(x.seed)} seed in the play-offs`+(x.seed<=2&&inLg.length>=6&&inLg.length<8?', with a bye in week one.':x.seed<=2&&inLg.length>=8?': you meet the '+nth(9-x.seed)+' seed.':'.')+' The brackets are on the Table tab.':'You have no more matches this league: your players rest until the next one. The brackets are on the Table tab.'));}}}
  let reset=false;
  if(isLastMatch(lg.no,lg.match_no,lg.next_match_at)){
    const endedName=leagueName(lg.no,lg.next_match_at),nextName=leagueName(lg.no+1,nextMatchTime(lg.next_match_at,lg.no+1));
    // the league is over: remember how it ended, hand out free agents, start again from zero
    // with play-offs the champion is the winner of the title final (the top of the table if it could not be decided); the final table is the regular season's, head-to-head included
    if(P)tbl.sort((a,b)=>((poOf(a,lg.no)||{}).pos||999)-((poOf(b,lg.no)||{}).pos||999));
    const fin=P?poAfter():null,fw=c=>fin&&fin[c]&&fin[c].series.f?fin[c].series.f.win:null;
    const nameOf=id=>{const t=map.get(id)||tbl.find(x=>x.id===id);return t?t.name:'';};
    const champId=fw('t')||(tbl[0]?tbl[0].id:null);
    const champ=champId?nameOf(champId):'',top=tbl[0]?tbl[0].name:'';
    // managers who played part of this league and then went away get their place recorded too
    const all=(await store.allTeams()).map(t=>map.get(t.id)||t);
    const away=all.filter(t=>!map.has(t.id)&&t.league_no===lg.no&&t.w+t.l>0);
    for(const t of away){rows.push(t);map.set(t.id,t);}
    const redraft=CFG.REDRAFT_AFTER.includes(lg.no);
    // the birthday: when an Autumn League ends (the next is a Winter League) every player turns a year older, and from 29 on
    // may lose a little speed (age, 23 Nov 2026; players born for the first Winter League are not a year older at its start)
    if(isSeasonal(lg.no)&&seasonOf(nextMatchTime(lg.next_match_at,lg.no+1)).i===0&&!redraft){
      for(const t of new Set([...all,...rows]))for(const p of ((t.data&&t.data.players)||[]))birthday(p);}
    const taken=await takenNames(store,true);const fresh=(n,avoid)=>{const ps=n===14?fairPool([...taken,...(avoid||[])],CAP):newPlayers(n,[...taken,...(avoid||[])]);for(const p of ps)taken.add(p.n);return ps;};   // new players never repeat a name in the league; a pool of fourteen is always draftable under the cap
    for(const t of [...humans,...away]){
      const place=placeOf(t.id);
      const title=P?(t.id===champId?'champion':null):null;
      t.data.final={league:lg.no,name:endedName,next:nextName,place,of:tbl.length,champion:champ,top,title,seen:false};
      t.data.played=(t.data.played||0)+1;if(t.id===champId)t.data.won=(t.data.won||0)+1;
      t.data.history=[...(t.data.history||[]),{league:lg.no,name:endedName,place,of:tbl.length,w:t.w,l:t.l,pts:t.pts,champion:champ,title,ended:now}].slice(-80);
      t.data.agents=redraft?[]:fresh(7);
      for(const p of t.data.players){delete p.inj;delete p.hurt;delete p.injN;p.en=4;delete p.enWas;}   // the break between leagues heals everyone, restores every player's energy (Harry, 26 Nov 2026) and starts the count of injuries again
    }
    // A fresh draft: every team (also one that never played in this league) picks seven new players from fourteen on
    // its way into the next league. The old squad stays until then; the computer team simply gets new players.
    if(redraft)for(const t of [...all,...rows.filter(t=>t.is_house)]){   // `all` is every manager's team; the computer team is among the rows in play
      if(t.is_house){const pool=fresh(14);t.data.players=capSeven(pool,CAP)||pool.slice(0,7);firstLineup(t.data);t.data.orders=null;continue;}
      if(!map.has(t.id)){rows.push(t);map.set(t.id,t);}
      t.data.redraft={after:lg.no,pool:fresh(14)};
    }
    // the wage cap: the lower half of the table gets a little extra room for the next league, the rest none
    for(const t of [...humans,...away]){const place=placeOf(t.id);t.data.capBonus=place>Math.ceil(tbl.length/2)?CAP_BONUS:0;}
    // the all-time list: how many leagues each team has won, of how many it finished
    const hall=all.filter(t=>(t.data.played||0)>0).map(t=>({id:t.id,name:t.name,was:(t.data.formerly||[]).slice(-1)[0]||null,won:t.data.won||0,played:t.data.played||0}))   // `was`: the name before a rename, so a title won under it is recognised
      .sort((a,b)=>b.won-a.won||a.played-b.played||(a.name<b.name?-1:1)).slice(0,CFG.HALL_SIZE);
    lg.final={no:lg.no,name:endedName,champion:champ,top,table:tbl.slice(0,10).map(t=>({name:t.name,w:t.w,l:t.l,pts:t.pts})),hall};
    // Everyone goes back to zero, and nobody is in the next league yet: a team is in it once its manager enters it.
    // (league_no of a manager's team is the last league it entered; only the house team moves on by itself)
    for(const t of rows){t.w=t.l=t.pf=t.pa=t.pts=0;t.pub={...t.pub,lw:null};if(t.is_house)t.league_no=lg.no+1;}
    reset=true;lg.no++;lg.match_no=1;
  }else lg.match_no++;
  // the mid-season window: once half the matches are played every team in the league gets seven free agents for MID_DAYS match days
  if(!reset&&leagueLength(lg)>=CFG.MID_MIN){const midAt=midAfter(lg);
    if(lg.match_no===midAt+1){const taken=await takenNames(store,true);
      for(const t of humans)if(t.league_no===lg.no){const ps=newPlayers(7,[...taken]);for(const p of ps)taken.add(p.n);t.data.mid={league:lg.no,until:midAt+CFG.MID_DAYS,agents:ps,used:0,bonus:placeOf(t.id)>Math.ceil(tbl.length/2)?CAP_BONUS:0};
        if(t.data.last&&t.data.last.league===lg.no&&t.data.last.match===lg.match_no-1)t.data.last.lines.unshift(`The mid-season window is open until match ${midAt+CFG.MID_DAYS} is played: up to ${CFG.MID_SWAPS} changes from seven free agents, under a window cap of $${CAP_WINDOW+t.data.mid.bonus}M${t.data.mid.bonus?' (extra room: you are in the lower half of the table)':''}. It is in the locker room.`);}}
    if(lg.match_no>midAt+CFG.MID_DAYS)for(const t of humans)delete t.data.mid;
  }
  lg.rule=newRule;lg.vote_opts=!reset&&P&&lg.match_no+1>P.reg?[]:threeRules(newRule);   // no vote for a play-off day: every play-off game has its own rule drawn at random (26 Nov 2026)
  lg.next_match_at=nextMatchTime(lg.next_match_at,lg.no);lg.busy_until=null;   // lg.no is already the next league's number if one just ended
  if(reset&&CFG.LEAGUE_START[lg.no]&&CFG.LEAGUE_START[lg.no]>lg.next_match_at)lg.next_match_at=CFG.LEAGUE_START[lg.no];   // a set start date for the new league
  // next pairings, among the managers who are still around
  if(reset){for(const t of rows)t.next_opp=null;}   // the new league starts empty
  else{
    const active=CFG.IDLE_DAYS>0?humans.filter(t=>t.last_seen>=now-CFG.IDLE_DAYS*DAY_MS):humans.slice();   // everybody in the league plays every match day
    for(const t of humans)if(!active.includes(t))t.next_opp=null;
    const nd=poDay(P,lg.match_no);
    if(nd>0)poPair(poAfter(),nd,active,house,await meetings(store,lg.no,matches));
    else{const met=await meetings(store,lg.no,matches),m=lg.match_no,reg=P?P.reg:leagueLength(lg);
      if(isSeasonal(lg.no)&&m<=reg){   // the week's fixtures: drawn after a Sunday match (or when nobody has any), then played as drawn
        const start=m===1||dowUTC(playedAt)===0||active.every(t=>fxOf(t,lg.no,m)===undefined);
        if(start)drawWeek(active,house,met,leagueLength(lg)-m+1,weekLen(lg,reg),lg.no,m);else useWeek(active,house,met,lg.no,m);}
      else pairUp(active,house,met,leagueLength(lg)-m+1);}
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
  // playing time: minutes of 40 for each of the five named players, 120 in all; null = the coach decides; absent = unchanged
  let mins=data.mins||null;
  if(req.mins!==undefined){
    if(req.mins===null)mins=null;
    else{if(typeof req.mins!=='object')return 'bad minutes';if(st.length!==3||sb.length!==2)return 'Name three starters and two substitutes before sharing out the minutes.';
      mins={};let sum=0;for(const id of [...st,...sb]){const v=req.mins[id];if(!Number.isInteger(v)||v<0||v>MINS.game||v%MINS.step)return 'bad minutes';mins[id]=v;sum+=v;}
      if(sum!==MINS.total)return 'Give twelve quarters in all: three players on the court for the whole match.';}}
  // half-time orders: one per case, each an order key, "star" with one of the manager's own players
  let orders=data.orders||null;
  if(req.orders!==undefined){
    if(req.orders===null)orders={behind:null,close:null,ahead:null};
    else{if(typeof req.orders!=='object')return 'bad orders';orders={};
      for(const w of ORDER_KEYS){const o=oneOrder(req.orders[w]);if(o==null){orders[w]=null;continue;}   // a page not yet reloaded may still send the two-change format of 17-18 Nov 2026
        if(typeof o!=='object')return 'bad orders';
        // a banned coach is not in the locker room: the orders are taken, a tone is not (whatever tone was set before the ban stays and comes back after it)
        const talk=(data.ban||0)>0?((((data.orders||{})[w])||{}).talk||null):(o.talk==null?null:o.talk);if(talk!==null&&!TONES.includes(talk))return 'bad orders';
        if(o.k==null){orders[w]=talk?{k:null,talk}:null;continue;}
        if(!orderOf(o.k))return 'bad orders';
        if(o.k==='star'){if(!ids.has(o.pid)||o.pid===out)return 'bad orders';orders[w]={k:'star',pid:o.pid,talk};}else orders[w]={k:o.k,talk};}}
  }
  data.starters=st;data.subs=sb;data.ball=ball;data.sheet=sh;if(orders)data.orders=orders;data.mins=mins;cleanMins(data);
  return null;
}

// the play-offs as the page shows them: the dates, the brackets with every game, and what this team does next
async function poView(store,lg,tbl,row){
  const P=poLen(lg);if(!P)return {info:null,me:null};
  const day=poDay(P,lg.match_no);let at=lg.next_match_at;for(let m=lg.match_no;m<=P.reg;m++)at=nextMatchTime(at,lg.no);
  const info={reg:P.reg,len:P.len,day,startAt:day>0?null:at,cups:null};
  if(!tbl.some(t=>poOf(t,lg.no)))return {info,me:null};
  const cups=poState(tbl,await store.leagueResults(lg.no),lg.no);
  const side=id=>{const t=tbl.find(x=>x.id===id);if(!t)return null;const po=poOf(t,lg.no);return {id,name:t.name,kit:kitOf(t.pub.kit,t.name),seed:po?po.seed:null};};
  info.cups=Object.entries(cups).map(([c,cu])=>({c,name:PO_CUPS[c],size:cu.size,series:Object.values(cu.series).map(s=>({k:s.k,r:s.r,hi:side(s.hi),lo:side(s.lo),wh:s.wh,wl:s.wl,win:s.win,
    games:s.games.map(g=>({m:g.m,hi:g.a===s.hi?g.sa:g.sb,lo:g.a===s.hi?g.sb:g.sa,rule:g.rule}))}))}));
  const po=poOf(row,lg.no);let me=po?{cup:po.cup,seed:po.seed,pos:po.pos}:{};
  if(day>0){const role=poRole(cups,day,row.id);me={...me,role:role.role,bye:!!role.bye};
    if(role.role==='series'&&row.next_opp===role.opp){const ps=poSeriesOf(cups,day,row.id,role.opp);
      me={...me,c:ps.c,s:ps.s,g:ps.g,rule:poRandomRule(lg.no,lg.match_no,ps.c,ps.s),random:true};}}
  return {info,me};
}
async function makeView(store,row,lg,now,extra){
  const vapid=await getVapid(store);
  let tbl=tableOf(lg,await store.tableRows(lg.no));   // only the teams that entered this league
  const pv=await poView(store,lg,tbl,row);
  if(pv.info&&pv.info.cups)tbl=[...tbl].sort((a,b)=>((poOf(a,lg.no)||{}).pos||999)-((poOf(b,lg.no)||{}).pos||999));   // after the regular season: the final order, head-to-head included
  let opp=null;
  if(row.next_opp){const o=await store.teamById(row.next_opp);
    if(o){const top=[...o.data.players].sort((a,b)=>rating(b)-rating(a)).slice(0,3).map(p=>p.id);
      const st=(o.pub.st||[]).filter(id=>o.data.players.some(p=>p.id===id));
      opp={id:o.id,name:o.name,kit:kitOf(o.pub.kit,o.name),sv:squadValue(o.data.players),house:o.is_house,w:o.w,l:o.l,pf:o.pf,pa:o.pa,pts:o.pts,players:o.data.players.map(pubPlayer),
        starters:st.length===3?st:top,ball:o.pub.ball&&st.includes(o.pub.ball)?o.pub.ball:null,ls:o.pub.ls||null,rep:o.pub.rep||null,sc:o.pub.sc&&o.pub.sc.lg===lg.no?o.pub.sc:null};}}
  const d=row.data;
  return {phase:'week',now,
    league:{...leagueInfo(lg),vote_opts:lg.vote_opts,final:lg.final,po:pv.info},
    me:{id:row.id,name:row.name,kit:kitOf(row.pub.kit,row.name),redraft:d.redraft?d.redraft.pool.map(ownPlayer):null,sv:squadValue(d.players),cap:capOf(d),capW:midOpen(d,lg)?midCap(d):capOf(d,true),mid:midOpen(d,lg)?{until:d.mid.until,left:CFG.MID_SWAPS-d.mid.used,agents:d.mid.agents.map(ownPlayer)}:null,out:row.league_no!==lg.no&&!tbl.some(t=>t.id===row.id),w:row.w,l:row.l,pf:row.pf,pa:row.pa,pts:row.pts,players:d.players.map(ownPlayer),starters:d.starters,subs:d.subs,ball:d.ball,mins:d.mins||null,
      sheet:d.sheet,orders:d.orders||{behind:null,close:null,ahead:null},ban:d.ban||0,banFor:d.banFor||null,trash:d.trash&&d.trash.league===lg.no&&d.trash.match===lg.match_no&&d.trash.opp===row.next_opp?d.trash.i:null,teamTalked:!!d.teamTalked,vote:d.vote,last:d.last,final:d.final,agents:(d.agents||[]).map(ownPlayer),won:d.won||0,played:d.played||0,history:d.history||[],push:(d.push||[]).length,po:pv.me,rested:d.rested&&d.rested.league===lg.no?d.rested.match:null},
    push_key:vapid?vapid.pub:null,
    opp,week:weekView(lg,tbl,row,await store.house()),table:tbl.slice(0,300).map(t=>({id:t.id,name:t.name,kit:kitOf(t.pub.kit,t.name),sv:t.pub.sv||null,w:t.w,l:t.l,pf:t.pf,pa:t.pa,pts:t.pts,ls:t.pub.ls||null,lw:t.pub.lw,po:poOf(t,lg.no)})),teams:tbl.length,...(extra||{})};
}

// ───────────────────────── match reports ─────────────────────────
// One match day as everybody may read it: every score, each side's plan, three strong and three weak points.
// What a manager was told in private about their own match (the "lines") is never part of it.
const ROUND_MAX=60;   // matches sent for one match day
// one team's season: every match it played in the running league, with its side of each report (the season view, 13 Nov 2026)
async function teamView(store,lg,req){
  const id=req.id;if(typeof id!=='string'&&typeof id!=='number')return {error:'bad team'};
  const t=await store.teamById(id);if(!t||(t.league_no!==lg.no&&!t.is_house))return {error:'No such team in this league.'};
  const side=d=>({kit:(d&&d.kit)||null,sheet:(d&&d.sheet)||null,half:(d&&d.half)||null,trash:(d&&d.trash)||null,pros:(d&&d.pros)||[],cons:(d&&d.cons)||[],box:(d&&d.box)||null});
  const rows=await store.teamMatches(lg.no,t.id);
  const matches=rows.map(m=>{const mine=m.a===t.id;const d=(m.detail||{});return {match:m.match_no,opp:mine?m.b_name:m.a_name,oppId:mine?m.b:m.a,us:mine?m.score_a:m.score_b,them:mine?m.score_b:m.score_a,rule:m.rule,side:side(mine?d.a:d.b),theirs:{sheet:((mine?d.b:d.a)||{}).sheet||null,kit:((mine?d.b:d.a)||{}).kit||null}};});
  return {id:t.id,name:t.name,kit:kitOf(t.pub.kit,t.name),house:t.is_house,w:t.w,l:t.l,pf:t.pf,pa:t.pa,sv:squadValue(t.data.players),sc:t.pub.sc&&t.pub.sc.lg===lg.no?t.pub.sc:null,league:lg.no,lname:leagueName(lg.no,lg.next_match_at),matches};
}
async function roundView(store,req){
  let L=Number.isInteger(req.league)&&req.league>0?req.league:null,M=Number.isInteger(req.match)&&req.match>0?req.match:null;
  if(L===null||M===null){const last=await store.roundNear(null,null,-1);if(!last)return {none:true};L=last.league_no;M=last.match_no;}
  const rows=await store.roundMatches(L,M,ROUND_MAX+1);
  if(!rows.length)return {none:true,league:L,match:M};
  const pos=x=>x?{league:x.league_no,match:x.match_no}:null;
  const side=d=>({kit:(d&&d.kit)||null,sheet:(d&&d.sheet)||null,half:(d&&d.half)||null,trash:(d&&d.trash)||null,pros:(d&&d.pros)||[],cons:(d&&d.cons)||[],box:(d&&d.box)||null});
  const d0=rows[0].detail||{};
  const plain=rows.find(m=>!(m.detail&&m.detail.po))||rows[0];   // on a play-off day the series have their own rules: the day's rule is the friendlies'
  return {league:L,match:M,name:d0.lname||'League '+L,rule:plain.rule,at:d0.at||null,more:rows.length>ROUND_MAX,
    prev:pos(await store.roundNear(L,M,-1)),next:pos(await store.roundNear(L,M,1)),
    matches:rows.slice(0,ROUND_MAX).map(m=>({a:m.a,b:m.b,an:m.a_name,bn:m.b_name,sa:m.score_a,sb:m.score_b,rule:m.rule,po:(m.detail&&m.detail.po)||null,ra:side((m.detail||{}).a),rb:side((m.detail||{}).b)}))};
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
  try{return await handle2(store,req,a,h,now,hash);}
  catch(e){if(e&&e.message==='conflict')return {busy:true};throw e;}
}
async function handle2(store,req,a,h,now,hash){   // `hash` is needed again for the connection pool (a missing parameter here broke every new manager's draft on 14-15 Nov 2026: "hash is not defined"; the suites hid it with a global of the same name, now called `sha`)
  const lg=await tick(store,now);
  // a match day is being played by another request right now: touch nothing, the browser asks again in a moment
  if(now>=lg.next_match_at)return {busy:true};
  let row=await store.teamByKey(h);
  if(!row){
    if(a==='view'){
      // fourteen players are offered once; the manager picks seven of those and cannot ask for others
      let pool=await store.pool(h);
      if(!pool){
        // the same connection keeps the same fourteen until somebody joins from it: a new browser or a cleared one
        // sees what the first one saw (Harry, 14 Nov 2026: refreshing for better players is unfair)
        const ipHash=req._ip?await hash('ip:'+req._ip):null;const shared=ipHash?await store.pool(ipHash):null;
        if(shared&&Array.isArray(shared.players)&&shared.players.length===14)pool={players:shared.players,rerolls:0};
        else{pool={players:fairPool([...await takenNames(store,true)],CAP),rerolls:0};if(ipHash)await store.savePool(ipHash,pool);}
        await store.savePool(h,pool);}
      return {phase:'draft',now,pool:pool.players.map(ownPlayer),league:leagueInfo(lg)};
    }
    if(a==='join'){
      const pool=await store.pool(h);if(!pool)return {error:'no players to pick from'};
      const picks=Array.isArray(req.picks)?[...new Set(req.picks)]:[];
      const mine=pool.players.filter(p=>picks.includes(p.id));
      if(picks.length!==7||mine.length!==7)return {error:'Pick exactly seven players.'};
      const name=cleanName(req.name);if(name.length<2)return {error:'Give your team a name.'};
      if(!nameFit(name))return {error:'That name is not fit for the table. Try another.'};
      {const e=overCap(mine,CAP);if(e)return {error:e};}
      if(name.toLowerCase()===CFG.HOUSE_NAME.toLowerCase()||await store.nameTaken(name.toLowerCase()))return {error:'That team name is taken. Try another.'};
      // a player already taken by a team that joined in the meantime (two people on one connection see the same fourteen)
      // becomes a different player: a fresh name, a fresh face and outfit, a fresh favourite and hated talk; the dots,
      // body and character stay, so the price the manager drafted under the cap stays (Harry, 20 Nov 2026: no twins).
      // The other open pools do not count here, they were made to avoid this one.
      {const taken=await takenNames(store,false);for(const p of mine)if(taken.has(p.n)){usedNames.clear();for(const x of taken)usedNames.add(x);for(const q of mine)usedNames.add(q.n);p.n=makeName();taken.add(p.n);newLooks(p);quirks(p);}}
      const fresh=newTeamRow(h,name,mine,lg.no,now,req.kit);enforceRule(fresh.data,lg.rule);fresh.pub.sv=squadValue(mine);
      try{row=await store.insertTeam(fresh);}
      catch(e){   // the same manager joining twice at once (two taps, two devices), or two managers taking one name at once
        row=await store.teamByKey(h);
        if(!row){if(await store.nameTaken(name.toLowerCase()))return {error:'That team name is taken. Try another.'};throw e;}
      }
      if(!(poDay(poLen(lg),lg.match_no)>0)){await store.attach(row.id,now);}await store.dropPool(h);if(req._ip)await store.dropPool(await hash('ip:'+req._ip));   // the next browser on that connection gets a fresh pool; in the play-offs a newcomer has no match (no friendlies)
      row=await fxOnAttach(store,await store.teamByKey(h),lg);
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
    // in the play-offs a team without a series game (a bye, a decided series, out of the brackets, knocked out) rests: it is not given the computer team
    if(!paired){const day=poDay(poLen(lg),lg.match_no);
      const rests=day>0&&poRole(poState(await store.tableRows(lg.no),await store.leagueResults(lg.no),lg.no),day,row.id).role!=='series';   // no friendlies (26 Nov 2026): in the play-offs only a team with a series game gets an opponent
      if(!rests){await store.attach(row.id,now);row=await fxOnAttach(store,await store.teamByKey(h),lg);}}
  }
  const d=row.data;let extra=null,dirty=false;
  if(now-row.last_seen>3600000){row.last_seen=now;dirty=true;}
  if(out&&['talk','teamtalk','plan','vote'].includes(a))return {error:'Your team is not in '+(isSeasonal(lg.no)?'the ':'')+leagueName(lg.no,lg.next_match_at,true)+' yet. Enter the league first.'};
  // a banned coach is kept away from the players for one match: no talks, no team talk, no half-time talk, no trash talk (the plan is set as usual)
  const bannedMsg=()=>'You are banned for this match'+(d.banFor?' for trash-talking '+d.banFor:'')+': no talks with your players, no team talk, no half-time talk, no trash talk. The plan, the line-up and the orders are yours as usual.';
  if((d.ban||0)>0&&['talk','teamtalk','trash'].includes(a))return {error:bannedMsg()};
  if(a==='trash'){   // the last word before tip-off, sent to the next opponent; i=null takes it back
    if(out)return {error:'Your team is not in the league yet.'};
    if(req.i===null||req.i===undefined){d.trash=null;dirty=true;}
    else{if(!Number.isInteger(req.i)||!TRASH[req.i])return {error:'bad line'};if(!row.next_opp)return {error:'No opponent yet.'};
      d.trash={league:lg.no,match:lg.match_no,opp:row.next_opp,i:req.i};dirty=true;}
  }else if(a==='talk'){
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
  }else if(a==='porule'){   // older pages may still ask: the rule of a play-off game is drawn at random since 21 Nov 2026
    return {error:'In the play-offs the rule of every game is drawn at random.'};
  }else if(a==='mid'){   // the mid-season window: up to MID_SWAPS changes in all, one free agent in for each player out, under the window cap
    if(!midOpen(d,lg))return {error:'The mid-season window is not open.'};
    const outs=Array.isArray(req.outs)?[...new Set(req.outs)]:[],ins=Array.isArray(req.ins)?[...new Set(req.ins)]:[];
    if(!outs.length||outs.length!==ins.length)return {error:'One free agent in for each player out.'};
    const left=CFG.MID_SWAPS-d.mid.used;if(outs.length>left)return {error:left>0?'You may change '+left+' more player'+(left===1?'':'s')+' in this window.':'You have made your two changes in this window.'};
    if(outs.some(id=>!d.players.some(p=>p.id===id))||ins.some(id=>!d.mid.agents.some(p=>p.id===id)))return {error:'bad swap'};
    const after=d.players.filter(p=>!outs.includes(p.id)).concat(d.mid.agents.filter(p=>ins.includes(p.id)));
    {const e=overCap(after,midCap(d));if(e)return {error:e};}
    d.players=after;d.mid.agents=d.mid.agents.filter(p=>!ins.includes(p.id));d.mid.used+=outs.length;
    // the line-up: whoever left is replaced by the best of the rest, so the team is never short
    enforceRule(d,lg.rule);const avail=rule=>d.players.filter(p=>!(rule==='tall_out'&&tallestId(d)===p.id));
    for(const p of [...avail(lg.rule)].sort((a,b)=>rating(b)-rating(a))){if(d.starters.length>=3)break;if(!d.starters.includes(p.id)&&!d.subs.includes(p.id))d.starters.push(p.id);}
    for(const p of [...avail(lg.rule)].sort((a,b)=>rating(b)-rating(a))){if(d.subs.length>=2)break;if(!d.starters.includes(p.id)&&!d.subs.includes(p.id))d.subs.push(p.id);}
    if(!d.ball||!d.starters.includes(d.ball))d.ball=d.starters.slice().map(id=>byId(d,id)).sort((a,b)=>b.sh-a.sh)[0].id;
    cleanMins(d);row.pub={...row.pub,sv:squadValue(d.players)};dirty=true;
  }else if(a==='kit'){   // the team's two colours and its badge; may be changed at any time, it changes nothing in a match
    const k=cleanKit(req.kit);if(!k)return {error:'Pick two different colours and a badge.'};
    row.pub={...row.pub,kit:k};dirty=true;
  }else if(a==='enter'||a==='swap'){   // enter the league that is running now, changing a player on the way in if the last league just ended ('swap' is what older copies of the game send)
    const fresh=!!(d.final&&!d.final.seen);   // this team finished a league and has not started another since
    if(!out&&!fresh)return a==='enter'?makeView(store,row,lg,now,null):{error:'No swaps now. They open when a league ends.'};
    const outs=Array.isArray(req.outs)?[...new Set(req.outs)]:[],ins=Array.isArray(req.ins)?[...new Set(req.ins)]:[];
    if(d.redraft){   // the fresh draft: seven of the fourteen new players replace the whole squad
      const picks=Array.isArray(req.picks)?[...new Set(req.picks)]:[];const mine=d.redraft.pool.filter(p=>picks.includes(p.id));
      if(picks.length!==7||mine.length!==7)return {error:'Pick exactly seven of the new players. (If you see no new players, update the game first.)'};
      {const e=overCap(mine,capOf(d));if(e)return {error:e};}
      // a fresh start: a new name too if the manager wants one (Harry, 23 Nov 2026), checked as for a new team; only on the way
      // into a league, where the name is written with the entry
      if(typeof req.name==='string'&&out){const name=cleanName(req.name);
        if(name&&name!==row.name){if(name.length<2)return {error:'Give your team a name.'};
          if(!nameFit(name))return {error:'That name is not fit for the table. Try another.'};
          const lc=name.toLowerCase();if(lc===CFG.HOUSE_NAME.toLowerCase()||(lc!==row.name_lc&&await store.nameTaken(lc)))return {error:'That team name is taken. Try another.'};
          d.formerly=[...(d.formerly||[]),row.name].slice(-5);row.name=name;row.name_lc=lc;}}
      d.players=mine;firstLineup(d,lg.rule);d.sheet={...DEF_SHEET,...(d.sheet||{})};d.orders=null;d.teamTalked=false;d.heard={};delete d.redraft;
      const k=cleanKit(req.kit);if(k)row.pub={...row.pub,kit:k};
    }else if(outs.length||ins.length){
      if(!fresh)return {error:'No player changes now. They open when a league you played in ends.'};
      if(outs.length>CFG.MAX_SWAPS||outs.length!==ins.length)return {error:'You may change '+(CFG.MAX_SWAPS===1?'one player':'up to '+CFG.MAX_SWAPS+' players')+', one in for each one out.'};
      const agents=d.agents||[];
      if(outs.some(id=>!d.players.some(p=>p.id===id))||ins.some(id=>!agents.some(p=>p.id===id)))return {error:'bad swap'};
      {const after=d.players.filter(p=>!outs.includes(p.id)).concat(agents.filter(p=>ins.includes(p.id)));const e=overCap(after,capOf(d,true));if(e)return {error:e};}   // the window cap
      d.players=d.players.filter(p=>!outs.includes(p.id)).concat(agents.filter(p=>ins.includes(p.id)));
    }
    d.agents=[];if(d.final)d.final.seen=true;row.pub={...row.pub,sv:squadValue(d.players)};
    if(out)d.vote=null;
    enforceRule(d,lg.rule);row.last_seen=now;
    if(out){try{await store.enterLeague(row,lg.no);}catch(e){if(/duplicate|unique|23505/i.test(String(e&&e.message)))return {error:'That team name is taken. Try another.'};throw e;}
      if(!(poDay(poLen(lg),lg.match_no)>0)){await store.attach(row.id,now);row=await fxOnAttach(store,await store.teamByKey(h),lg);}}   // into this league from zero, then an opponent (and its week); in the play-offs no match (no friendlies, 26 Nov 2026)
    else await store.saveTeam(row);
    return makeView(store,row,lg,now,{entered:out});
  }else if(a==='round'){           // the match reports of one match day (the latest one if none is named)
    extra={round:await roundView(store,req)};
  }else if(a==='team'){            // one team's season: all its matches of this league
    extra={team:await teamView(store,lg,req)};
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
