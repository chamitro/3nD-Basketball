// 3nD Basketball: the rules of the game. No screen code in here.
// This one file is loaded by the page (practice mode and drawing) and is copied into the server function,
// so a talk or a match gives the same result wherever it runs.
'use strict';
const R=()=>Math.random();
const pick=a=>a[Math.floor(R()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const ord=n=>n+(['st','nd','rd'][n-1]||'th');
const SYL=['bo','mi','ra','te','ku','zi','lo','pa','nu','gri','fla','sno','wib','dub','zog','pim','tok','mog','bel','faz','yub','nib','ruk','sha','vee','oz','kip','dax','lum','wug'];
const usedNames=new Set();
function makeName(){for(let t=0;t<80;t++){let n=pick(SYL)+pick(SYL);if(R()<0.2)n+=pick(SYL);n=n[0].toUpperCase()+n.slice(1);if(n.length<=7&&!usedNames.has(n)){usedNames.add(n);return n;}}return 'Zed'+Math.floor(R()*99);}
const TEAM_NAMES=['The Lanterns','Greyhound Row','Salt Street','Old Mill','Pickle Yard','The Wet Socks','Bin Lids United','Noodle Arms','Friday Leftovers','The Slow Clappers','Moon Boots','Soggy Biscuits','Elbow Room','The Loud Sneezers','Third Floor Flat'];

// ───────────────────────── temperaments ─────────────────────────
// reply: [line, mood after, trust change]
const TONES=['praise','comfort','challenge','demand','shout','joke','honest','calm','space'];
const TONE_LABEL={praise:'Praise',comfort:'Comfort',challenge:'Challenge',demand:'Demand more',shout:'Shout',joke:'Joke',honest:'Be honest',calm:'Calm down',space:'Give space'};
const TONE_SAY={praise:'You were brilliant out there.',comfort:'It is all right. I believe in you.',challenge:'Prove to me you belong on that court.',demand:'I expect more. Do your job.',shout:'WHAT WAS THAT?!',joke:'Did you leave your hands at home?',honest:'Straight talk. Here is where you stand.',calm:'Breathe. No pressure this week.',space:'I will leave you be.'};
// reply: [line, mood after, trust change]. The same words land differently on each character.
const TEMPS={
  showoff:{r:{
    praise:['Say it again. Slower.','happy',1],comfort:['I do not need a hug. I need the BALL.','ok',0],challenge:['Watch me. No really, WATCH me.','happy',1],demand:['Fine. But the ball comes to ME.','ok',0],shout:['Then find another superstar!','angry',-2],joke:['Are you laughing at ME?','angry',-1],honest:['I was NOT bad. The others were bad.','sad',-1],calm:['I am calm. I am ALWAYS calm.','ok',0],space:['You are... ignoring me?','sad',-1]}},
  worrier:{r:{
    praise:['Now I have to live up to that...','nervous',0],comfort:['Thanks. I needed that.','happy',1],challenge:['What if I cannot?','nervous',-1],demand:['Okay. Okay. Okay. I can do that.','ok',0],shout:['...','sad',-1],joke:['Are you... making fun of me?','nervous',-1],honest:['I would rather know. Thank you.','cool',1],calm:['In... out... okay. Okay.','cool',1],space:['Did I do something wrong?','nervous',0]}},
  veteran:{r:{
    praise:['Do not butter me up.','angry',-1],comfort:['I am not a child.','sad',-1],challenge:['Hm. All right. One more time.','cool',1],demand:['Fair.','cool',1],shout:['I have been shouted at by better.','ok',0],joke:['Heh. Not bad.','ok',0],honest:['Good. That I can work with.','happy',2],calm:['I was calm before you were born.','ok',0],space:['Finally. Peace.','ok',1]}},
  hothead:{r:{
    praise:['Damn right.','ok',0],comfort:['...Fine. FINE. Thanks.','cool',1],challenge:['You think I CANNOT?!','angry',-1],demand:['Do NOT tell me what to do!','angry',-1],shout:['Say that again and I WALK!','angry',-2],joke:['HA! All right, all right.','happy',1],honest:['So I am the problem?!','angry',-1],calm:['...Breathing. I am breathing.','cool',1],space:['Good. I need to punch a pillow.','cool',0]}},
  joker:{r:{
    praise:['I know. I am adorable.','happy',1],comfort:['Aw, coach! Hug?','happy',1],challenge:['Is this the serious bit?','ok',0],demand:['Where did the fun go?','sad',-1],shout:['...okay.','sad',-1],joke:['That one was actually good!','happy',2],honest:['Huh. Did not expect that.','ok',0],calm:['Calm is SO boring.','sad',0],space:['But who will laugh at my jokes?','sad',-1]}},
  loner:{r:{
    praise:['Stop. Everyone is looking.','nervous',-1],comfort:['Are we done?','ok',0],challenge:['Fine.','cool',1],demand:['Understood.','cool',1],shout:['Noted.','sad',-2],joke:['...','ok',0],honest:['Thank you for not wasting my time.','happy',2],calm:['I am never anything else.','ok',0],space:['Thank you.','happy',2]}},
  pleaser:{r:{
    praise:['You really mean it?!','happy',2],comfort:['You are the best coach ever!','happy',1],challenge:['I will try! But what if I let you down?','nervous',0],demand:['Yes coach! Sorry coach! Sorry!','nervous',0],shout:['*sniff*','sad',-2],joke:['Hahaha! Good one, coach!','happy',1],honest:['Do you... still like me?','nervous',0],calm:['Okay. If you say so. Okay.','cool',1],space:['Did I upset you?','sad',-1]}},
  fighter:{r:{
    praise:['Do not go soft on me.','sad',-1],comfort:['Do I look like I need a blanket?','sad',-1],challenge:['OH, IS THAT SO?! WATCH ME!','angry',1],demand:['Now we are talking.','cool',1],shout:['FINALLY, some passion!','angry',1],joke:['Funny. Real funny.','ok',0],honest:['Good. Straight at me. I like it.','happy',1],calm:['You are putting my fire out.','sad',-1],space:['Suit yourself.','ok',0]}},
  easygoing:{r:{
    praise:['Cheers, coach.','ok',0],comfort:['I am good, honestly.','ok',0],challenge:['Sure, why not.','ok',0],demand:['Whoa. Bit intense, coach.','nervous',0],shout:['Deep breath, coach. It is only a game.','ok',0],joke:['Ha! Nice one.','happy',1],honest:['Fair enough.','cool',1],calm:['Already there.','ok',0],space:['Cool. See you Sunday.','ok',0]}},
};
// what the manager is told about each character: a name, a colour, one line
const CHAR={
  showoff:['Proud','#ffd43b','Lives for praise and a stage. Cannot take a joke.'],
  worrier:['Worrier','#a5d8ff','Easily rattled. Even praise can weigh on them.'],
  veteran:['Old hand','#d0bfff','Seen it all. Flattery annoys them.'],
  hothead:['Hot-tempered','#ffa8a8','Blows up when pushed. A laugh cools them down.'],
  joker:['Joker','#b2f2bb','Runs on laughs. Wilts when things get serious.'],
  loner:['Loner','#ced4da','Wants few words. Hates attention.'],
  pleaser:['People-pleaser','#fcc2d7','Desperate to be liked. Pressure makes them anxious.'],
  fighter:['Fighter','#ffc078','Runs on anger. Kindness puts the fire out.'],
  easygoing:['Easy-going','#96f2d7','Hard to upset, hard to fire up.'],
};
const LOVE_LINES=['That... actually got through to me.','Huh. Nobody ever says that to me.','I needed to hear exactly that.'];
const HATE_LINES=['Never say that to me again.','Not that. Anything but that.','That is the one thing I cannot stand.'];
const chip=p=>`<span class="chr" style="background:${CHAR[p.temp][1]}">${CHAR[p.temp][0]}</span>`;
// every minion also has a personal soft spot and a sore spot on top of their character
function quirks(p){const t=[...TONES].sort(()=>R()-0.5);p.love=t[0];p.hate=t[1];p.notes=p.notes||{};}
const TEMPKEYS=Object.keys(TEMPS);
const WORD={happy:'buzzing',ok:'fine',angry:'fuming',sad:'sulking',nervous:'anxious',cool:'locked in'};
// mood -> [shooting, turnover, obey, defence]
const MOODFX={happy:[0.06,0,1,0],cool:[0.02,-0.03,1,0.03],ok:[0,0,0.95,0],nervous:[-0.04,0.05,0.9,0],sad:[-0.08,0,0.8,-0.04],angry:[-0.03,0.03,0.55,0.05]};

// ───────────────────────── rules of the week ─────────────────────────
const RULES=[
  {k:'attack',txt:"Attackers' week: Attack counts double!",why:'Helps teams full of attackers. Defence counts half. Start your best shooters.'},
  {k:'defence',txt:"Defenders' week: every steal is a point!",why:'Helps defensive teams. Defence counts double, and a press that works is gold.'},
  {k:'speed',txt:"Runners' week: fast breaks score three!",why:'Helps quick teams. Speed counts double and the faster three break away all game.'},
  {k:'tiny_court',txt:'The court is the size of a rug!',why:'Helps tall teams. Height decides everything, speed counts for nothing.'},
  {k:'low_ceiling',txt:'The ceiling is very low!',why:'Helps small teams. Tall players have to duck and shoot worse.'},
  {k:'three5',txt:'Long shots count FIVE!',why:'Helps outside shooters. A zone defence gets punished.'},
  {k:'paint',txt:'Close shots count three, long shots only two!',why:'Helps tall teams that play inside. A zone protects the hoop.'},
  {k:'bench',txt:'Bench week: substitutes score double!',why:'Helps deep squads. Who you name as substitute matters most.'},
  {k:'iron',txt:'Iron legs: no substitutions!',why:'Your three starters play every minute. Slow tempo saves legs, a press burns them.'},
  {k:'slippery',txt:'The ball is buttered!',why:'Twice the fumbles. Helps pressing teams and calm heads.'},
  {k:'hotheads',txt:'Furious players score +1!',why:'Helps a team with angry players. Do you dare make someone fume?'},
  {k:'party',txt:'Happy players score +1!',why:'Helps a happy locker room. Your talks are worth points this week.'},
  {k:'first11',txt:'First to eleven wins!',why:'Short game. Helps a fast tempo and a strong first three.'},
  {k:'tall_out',txt:'The tallest player sits out!',why:'Hurts teams built around one giant. Yours cannot play, theirs neither.'},
  {k:'no_dribble',txt:'No dribbling. Passes only!',why:'Speed is useless. Players who ignore the plan ruin everything, so trust matters.'},
];
const ruleOf=k=>RULES.find(r=>r.k===k);

// ───────────────────────── players & teams ─────────────────────────
const COLS=['#ff7aa8','#6ec6ff','#f4a259','#ef6f6c','#8ce99a','#b197fc','#63e6be','#ffd43b','#74c0fc','#a9e34b','#da77f2','#ffa8a8','#66d9e8','#ff8787','#ffc078','#96f2d7'];
const TOPS=['bun','band','cap','horns','antenna','mohawk','tuft','propeller','cone','duck','sprout','crown','pan'];
const SHAPES=['pill','pill','pear','bean'];
let NEXT_ID=1;
function makePlayer(){const q=makePlayer0();quirks(q);return q;}
function makePlayer0(){
  const temp=pick(TEMPKEYS);const h=R();
  let sh,df,sp,tries=0;do{sh=1+Math.floor(R()*4);df=1+Math.floor(R()*4);sp=1+Math.floor(R()*4);tries++;}while((sh+df+sp<6||sh+df+sp>9)&&tries<50);
  return {id:NEXT_ID++,n:makeName(),temp,h,bulk:clamp(h*0.6+R()*0.5,0,1),col:pick(COLS),top:pick(TOPS),shape:pick(SHAPES),num:1+Math.floor(R()*98),
    sh,df,sp,mood:'ok',trust:0,talked:false,ph:R()*10,eye:R()*0.3-0.15,teeth:R()<0.35,x:null,tr:{sh:0,df:0,sp:0},idle:0,notes:{},en:4};
}
const rating=p=>p.sh*1.2+p.df+p.sp*0.6+p.h*1.5;
// Energy runs from 4 (fresh) down to 1 (worn out). Playing costs it, a match off gives it back.
const energyOf=p=>p.en===undefined?4:p.en;
const tiredOf=p=>(4-energyOf(p))/3;      // 0 = fresh, 1 = worn out
const ENERGY={COST:1.0,REST:1.5,PART_REST:0.5};   // a whole match played; a whole match off; the bench time of someone who played part of it
const STATNAME={sh:'attack',df:'defence',sp:'speed'};
const nrm=v=>(v-2.5)/1.5; // a stat of 1..4 as -1..1
// nudge a stat; returns +1/-1 when a whole dot is gained or lost
function bump(p,k,d){const before=Math.round(p[k]);p[k]=clamp(p[k]+d,1,4);p.tr[k]+=d;const after=Math.round(p[k]);return after>before?1:after<before?-1:0;}
function makeTeam(name,players,human){return {name,players,starters:[],subs:[],ball:null,sheet:{tempo:1,shots:1,def:0,off:0,guard:0,boards:1},w:0,l:0,pf:0,pa:0,human:!!human,skill:0.25+0.75*R(),style:{tempo:Math.floor(R()*3),shots:Math.floor(R()*3),def:Math.floor(R()*3),off:Math.floor(R()*3),guard:Math.floor(R()*3),boards:Math.floor(R()*3)},lastSheet:null,lastDay:''};}
const byId=(team,id)=>team.players.find(p=>p.id===id);
function tallestId(team){return team.players.reduce((a,b)=>a.h>b.h?a:b).id;}
function enforceRule(team,rule){
  if(rule==='tall_out'){const t=tallestId(team);team.starters=team.starters.filter(id=>id!==t);team.subs=team.subs.filter(id=>id!==t);if(team.ball===t)team.ball=null;}
  team.starters=team.starters.filter(id=>byId(team,id));
  team.subs=team.subs.filter(id=>byId(team,id)&&!team.starters.includes(id)).slice(0,2);
  if(team.ball&&!team.starters.includes(team.ball))team.ball=null;
}
function weekReset(team,first){for(const p of team.players){p.talked=false;p.lastRes='';if(!first&&R()<0.3&&p.mood!=='ok'&&!p.ignored)p.mood='ok';}team.teamTalked=false;}

// ───────────────────────── bots ─────────────────────────
function botPrepare(team,opp,rule,oppLast){
  const sk=team.skill===undefined?0.5:team.skill;
  for(const p of team.players){
    if(R()<0.6)p.mood=R()<0.3+0.65*sk?pick(['happy','happy','cool','cool','ok']):pick(['ok','ok','nervous','sad','angry']);
    if(R()<0.3)p.trust=clamp(p.trust+(R()<0.25+0.6*sk?1:-1),-2,2);
    if(R()<0.35){const k=pick(['sh','df','sp']);p[k]=clamp(p[k]+(R()<(0.25+0.55*sk)*clamp((4-p[k])/1.5,0.15,1)?0.15:-0.1),1,4);}
  }
  const sheet={...team.style};
  const r=rule,wise=()=>R()<0.5+0.5*sk;
  if(r==='attack'){if(wise())sheet.tempo=2;if(wise()&&sheet.shots===0)sheet.shots=1;}
  if(r==='defence'&&wise())sheet.def=2;
  if(r==='speed'&&wise())sheet.tempo=2;
  if(r==='paint'&&wise())sheet.shots=0;
  if(r==='iron'){if(wise())sheet.tempo=0;if(wise()&&sheet.def===2)sheet.def=0;}
  if(r==='three5'){if(wise())sheet.shots=2;if(wise())sheet.def=0;}
  if(r==='moving_hoop'||r==='tiny_court'){if(wise())sheet.shots=0;}
  if(r==='tiny_court'&&wise())sheet.tempo=0;
  if(r==='slippery'&&wise())sheet.def=2;
  if(r==='first11'&&wise())sheet.tempo=2;
  if(r==='no_dribble'&&wise())sheet.tempo=0;
  if(r==='low_ceiling'&&wise())sheet.shots=2;
  let avail=team.players;if(r==='tall_out'){const t=tallestId(team);avail=avail.filter(p=>p.id!==t);}
  const score=p=>-1.3*(4-energyOf(p))+rating(p)+(r==='attack'?p.sh:0)+(r==='defence'?p.df:0)+(r==='speed'?p.sp:0)+(r==='paint'?p.h*2:0)+(r==='tiny_court'?p.h*2:0)-(r==='low_ceiling'?p.h*1.5:0)+(p.mood==='sad'||p.mood==='nervous'?-1:0)+(p.mood==='happy'?0.5:0)+(r==='hotheads'&&p.mood==='angry'?1.5:0)+(r==='party'&&p.mood==='happy'?1.5:0);
  const ranked=[...avail].sort((a,b)=>score(b)-score(a));const top=ranked.slice(0,3);
  team.starters=top.map(p=>p.id);team.subs=ranked.slice(3,5).map(p=>p.id);team.ball=[...top].sort((a,b)=>b.sh-a.sh)[0].id;
  // the newer dials: fit them to the players' state and to what the opponent showed last Sunday
  const star=byId(team,team.ball),ro=top.reduce((x,p)=>x+MOODFX[p.mood][2]+0.08*p.trust,0)/3;
  const ls=oppLast||null;
  if(wise()){
    if(sheet.off===1&&(star.mood==='nervous'||star.mood==='sad'||star.sh<2.5))sheet.off=0;
    if(sheet.off===2&&ro<0.95)sheet.off=0;
    if(sheet.off===0&&ro>=1.04)sheet.off=2;
    if(sheet.off!==1&&star.sh>=3.5&&(star.mood==='happy'||star.mood==='cool'))sheet.off=1;
  }
  if(ls){
    if(wise())sheet.guard=ls.off===1?2:(ls.off===0&&sheet.guard===2?0:sheet.guard);
    if(wise()&&ls.guard===2&&sheet.off===1)sheet.off=0;
    if(wise()&&ls.def===1&&sheet.shots===0)sheet.shots=1;
    if(ls.off===2&&sheet.def!==2&&r!=='iron'&&R()<0.5*sk)sheet.def=2;
  }
  if(opp&&wise()){
    const ot=[...opp.players].sort((a,b)=>rating(b)-rating(a)).slice(0,3);const av=(a,f)=>a.reduce((x,p)=>x+f(p),0)/a.length;
    if(av(ot,p=>p.sp)>av(top,p=>p.sp)&&ls&&ls.tempo===2)sheet.boards=0;
    else if(av(top,p=>p.h)>av(ot,p=>p.h)+0.12)sheet.boards=2;
    else if(sheet.boards===2&&av(ot,p=>p.sp)>av(top,p=>p.sp))sheet.boards=1;
    else if(sheet.boards===0&&av(ot,p=>p.sp)<=av(top,p=>p.sp))sheet.boards=1;
    if(sheet.tempo===2&&av(ot,p=>p.sp)>=av(top,p=>p.sp)&&r!=='first11'&&r!=='attack')sheet.tempo=1;
  }
  if(sheet.off===2&&sheet.tempo===2&&wise())sheet.tempo=1;
  if(r==='tiny_court'||r==='no_dribble'){if(sheet.boards===0&&wise())sheet.boards=1;}
  team.sheet=sheet;
}

// ───────────────────────── the match ─────────────────────────
function obey(p){return clamp(MOODFX[p.mood][2]+0.08*p.trust,0.2,1);}
const PRESS_MID={h:0.5,sp:0,tired:0.15};   // an average ball handler: height, speed (as -1..1) and tiredness
function playMatch(A,B,ruleKey){
  const rule=ruleKey;
  const mk=T=>{
    let avail=T.players;if(rule==='tall_out'){const t=tallestId(T);avail=avail.filter(p=>p.id!==t);}
    const court=T.starters.map(id=>avail.find(p=>p.id===id)).filter(Boolean);
    // a manager who named nobody is punished: the three weakest players start (a line-up cut short by the rule of the
    // week is still filled with the best of the rest)
    const noLineup=!(T.starters||[]).length;
    const rest=avail.filter(p=>!court.includes(p)).sort((a,b)=>noLineup?rating(a)-rating(b):rating(b)-rating(a));
    while(court.length<3&&rest.length)court.push(rest.shift());
    const bench=(T.subs||[]).map(id=>avail.find(p=>p.id===id)).filter(p=>p&&!court.includes(p)).slice(0,2);
    const st={};for(const p of avail)st[p.id]={pts:0,fga:0,fgm:0,a3:0,m3:0,to:0,free:0,bonus:0,bench:!court.includes(p),f:0.3*tiredOf(p),min:0,dbl:0,dblM:0,shad:0,shadM:0};
    return {T,court,bench,st,noLineup,score:0,steals:0,oreb:0,fast:0,rb:0,openA:0,openM:0,playQ:0,playN:0};
  };
  const a=mk(A),b=mk(B);
  const P=rule==='first11'?60:Math.round(([15,19,23][A.sheet.tempo]+[15,19,23][B.sheet.tempo])/2);
  const noRun=rule==='no_dribble'||rule==='tiny_court';
  const hMul=rule==='tiny_court'?3.5:rule==='paint'?1.8:1;
  const aMul=rule==='attack'?2:1,dMul=rule==='attack'?0.5:rule==='defence'?2:1,sMul=rule==='speed'?2:1;
  const avg=(arr,f)=>arr.reduce((s,p)=>s+f(p),0)/arr.length;
  const rawObey=p=>MOODFX[p.mood][2]+0.08*p.trust;
  const stopperOf=X=>[...X.court].sort((p,q)=>q.df-p.df)[0];
  function possession(O,D,late,second){
    const os=O.T.sheet,ds=D.T.sheet;
    const star=O.court.find(p=>p.id===O.T.ball)||null;
    const focus=star||[...O.court].sort((p,q)=>q.sh-p.sh)[0]; // the one the defence worries about
    // who shoots
    let shooter=null,hog=false;
    for(const p of [...O.court].sort(()=>R()-0.5)){if(R()>obey(p)&&R()<0.5){shooter=p;hog=true;break;}}
    if(!shooter){
      if(star&&R()<(late?0.6:[0,0.55,0.3][os.off]))shooter=star;
      else{const w=O.court.map(p=>p.sh+0.5);let x=R()*w.reduce((s,v)=>s+v,0);for(let i=0;i<w.length;i++){x-=w[i];if(x<=0){shooter=O.court[i];break;}}shooter=shooter||O.court[0];}
    }
    const sst=O.st[shooter.id];if(hog)sst.free++;
    const fx=MOODFX[shooter.mood],m=shooter.mood;
    const isF=shooter===focus,dbl=ds.guard===2,shadow=ds.guard===1;
    // turnover
    // A press works best on those who handle the ball badly anyway: the tall, the slow and the tired. Against quick,
    // small, fresh players it wins little. `loose` is about -1..1 and close to zero for an average player, so a press
    // is worth the same as before on average. A team's ball losses in its match reports therefore say how to play it.
    const loose=1.4*(shooter.h-PRESS_MID.h)-0.5*(nrm(shooter.sp)-PRESS_MID.sp)+0.6*(tiredOf(shooter)-PRESS_MID.tired);
    let pTO=0.10+0.06*(shooter.h-0.5)+fx[1]+(ds.def===2?clamp(0.07+0.08*loose,0.01,0.17):0)-(noRun?0:0.02*nrm(shooter.sp)*sMul);
    if(ds.def===2)for(const d of D.court)pTO+=d.mood==='angry'?0.025:d.mood==='sad'?-0.025:0; // the furious hound the ball, the sulking jog
    pTO+=0.04*tiredOf(shooter);
    if(os.tempo===2&&m==='nervous')pTO+=0.05;
    if(ds.def===2&&m==='nervous')pTO+=0.03;
    if(dbl&&isF)pTO+=0.03;
    if(rule==='slippery')pTO*=2;if(rule==='no_dribble')pTO*=1.4;
    if(R()<pTO){sst.to++;if(ds.def===2||rule==='defence')D.steals++;if(rule==='defence'){D.score++;D.rb++;}return;}
    let q=0;if(ds.def===2)q+=0.035+0.012*D.court.filter(d=>d.mood==='sad').length; // broke the press
    if(os.tempo===0)q+=m==='nervous'?0.04:-0.015; // a slow attack meets a set defence
    if(os.tempo===2)q+=m==='happy'?0.03:m==='sad'?-0.06:0;
    // how the attack is run
    if(hog)q-=(rule==='no_dribble'?0.16:0.08);
    else if(os.off===0)q+=0.03;
    else if(os.off===2){const pq=clamp(0.7*(avg(O.court,rawObey)-0.93),-0.15,0.09)+(os.tempo===2?-0.04:os.tempo===0?0.02:0)-(ds.def===2?0.05:0);q+=pq;O.playQ+=pq;O.playN++;}
    else if(shooter===star)q+=0.02+(m==='happy'||m==='cool'?0.08:m==='nervous'?-0.11:m==='sad'?-0.09:m==='angry'&&shooter.temp!=='fighter'?-0.06:0);
    else q+=0.03;
    // fast break
    let forceInside=false;
    const spAdv=avg(O.court,p=>p.sp-tiredOf(p))-avg(D.court,p=>p.sp-tiredOf(p));   // tired legs do not run
    let pFB=0;
    if(!noRun&&!second){
      if(spAdv>0)pFB=(os.tempo===2?0.20:0)+(rule==='speed'?0.16:0)+(ds.boards===2?0.25:0); // crash against a quicker team and they are gone
      else if(spAdv>-0.4&&ds.boards===2)pFB=0.06;
      pFB+=0.03*D.court.filter(d=>d.mood==='sad').length-(ds.boards===0?0.20:0)-(ds.tempo===0?0.08:0); // getting back, or slowing the game, takes the running out of them
    }
    if(R()<pFB){q+=0.20;forceInside=true;O.fast++;}
    // who guards him
    const stp=shadow&&!forceInside?stopperOf(D):null;
    let def;if(stp){if(isF)def=stp;else{const o=D.court.filter(d=>d!==stp);def=o.length?pick(o):stp;}}else def=pick(D.court);
    const dfx=MOODFX[def.mood];
    const three=!forceInside&&R()<[0.15,0.4,0.65][os.shots]+(shooter.sh>=3.5?0.05:0);
    const zoneIn=ds.def===1?(def.mood==='angry'?0:def.mood==='cool'?-0.12:-0.10):0;const dW=ds.def===1?0.4:1; // a furious defender wanders out of the zone; a zone hides weak defenders and wastes strong ones
    let pm;
    if(three){pm=0.33+0.085*nrm(shooter.sh)*aMul-0.04*nrm(def.df)*dMul*dW+(ds.def===1?0.08:ds.def===0?-0.03:0);}
    else{pm=0.52+0.03*nrm(shooter.sh)*aMul+0.13*(shooter.h-def.h)*hMul-0.05*nrm(def.df)*dMul*dW+zoneIn;}
    if(rule==='low_ceiling')pm-=0.32*Math.max(0,shooter.h-0.2);
    pm+=-0.07*tiredOf(shooter)+0.05*tiredOf(def);
    pm+=(q+fx[0]-dfx[3]-0.12*sst.f+0.08*D.st[def.id].f)*(three?0.67:1); // a long shot is worth more, so the same edge moves it less
    let tag=0;
    if(!forceInside){
      if(shadow){if(isF){pm+=-0.04-0.04*nrm(def.df)+(def.mood==='cool'?-0.05:def.mood==='angry'&&def.temp!=='fighter'?0.09:def.mood==='sad'?0.07:0);tag=1;sst.shad++;}else pm+=0.03;}
      if(dbl){if(isF){pm-=0.14;tag=2;sst.dbl++;}else{pm+=[0.17,0.06,0.11][os.off];tag=3;O.openA++;}} // a sharing team finds the open man, a star-ball team does not
    }
    if(shooter.temp==='fighter'&&shooter.mood==='angry')pm+=0.11;
    if(late){if(shooter.mood==='happy'||shooter.mood==='cool')pm+=0.04;if(shooter.mood==='nervous')pm-=0.08;}
    sst.fga++;if(three)sst.a3++;
    if(R()<clamp(pm,0.05,0.9)){
      let pts=three?(rule==='three5'?5:rule==='paint'?2:3):(rule==='paint'?3:2);
      if(rule==='three5'&&three)O.rb+=2;if(rule==='paint'&&!three)O.rb+=1;
      if(rule==='speed'&&forceInside){pts=3;O.rb+=1;}
      if(rule==='hotheads'&&shooter.mood==='angry'){pts++;sst.bonus++;O.rb++;}
      if(rule==='party'&&shooter.mood==='happy'){pts++;sst.bonus++;O.rb++;}
      if(rule==='bench'&&sst.bench){O.rb+=pts;pts*=2;}
      sst.fgm++;if(three)sst.m3++;sst.pts+=pts;O.score+=pts;
      if(tag===1)sst.shadM++;if(tag===2)sst.dblM++;if(tag===3)O.openM++;
    }else if(!second){
      const hAdv=avg(O.court,p=>p.h)-avg(D.court,p=>p.h);
      const pr=0.22+0.13*hAdv*hMul+(os.boards===2?0.10+0.20*hAdv:os.boards===0?-0.07:0)+0.03*(O.court.filter(p=>p.mood==='angry').length-O.court.filter(p=>p.mood==='sad').length);
      if(R()<clamp(pr,0.03,0.6)){O.oreb++;possession(O,D,late,true);}
    }
  }
  function tire(X){const sh=X.T.sheet;const stp=sh.guard===1?stopperOf(X):null;
    for(const p of X.court){X.st[p.id].min++;X.st[p.id].f=Math.min(1,X.st[p.id].f+0.011+(sh.tempo===2?0.009:sh.tempo===0?-0.003:0)+(sh.def===2?0.011:0)+(sh.boards===2?0.005:0)+(sh.off===1&&p.id===X.T.ball?0.008:0)+(p===stp?0.008:0));}}
  function subs(X){for(const p of X.bench)X.st[p.id].f=Math.max(0,X.st[p.id].f-0.25);
    if(!X.bench.length)return;
    const tired=[...X.court].sort((p,q)=>X.st[q.id].f-X.st[p.id].f)[0];
    const fresh=[...X.bench].sort((p,q)=>(X.st[p.id].min-X.st[q.id].min)||(X.st[p.id].f-X.st[q.id].f))[0];
    if(tired&&fresh&&X.st[fresh.id].f<X.st[tired.id].f-0.07){X.court[X.court.indexOf(tired)]=fresh;X.bench[X.bench.indexOf(fresh)]=tired;}}
  for(let i=0;i<P;i++){
    const late=i>=P*0.8&&Math.abs(a.score-b.score)<=5;
    possession(a,b,late);tire(a);
    if(rule==='first11'&&a.score>=11)break;
    possession(b,a,late);tire(b);
    if(rule==='first11'&&b.score>=11)break;
    if(rule!=='first11'&&rule!=='iron'&&(i+1)%Math.ceil(P/4)===0&&i<P-1){subs(a);subs(b);}
    if(rule==='first11'&&(i+1)%5===0){subs(a);subs(b);}
  }
  let guard=0;while(a.score===b.score&&guard++<40){possession(a,b,true);if(a.score!==b.score)break;possession(b,a,true);}
  if(a.score===b.score)a.score++;
  return {a,b};
}
function reportLines(X,Y,won,rule){
  // X = our side, Y = theirs. Returns up to two short cause lines.
  const L=[];const ps=X.T.players.filter(p=>X.st[p.id]);
  const st=p=>X.st[p.id];
  const top=[...ps].sort((p,q)=>st(q).pts-st(p).pts)[0];
  const cold=[...ps].filter(p=>st(p).fga>=5&&st(p).fgm/st(p).fga<0.3).sort((p,q)=>st(q).fga-st(p).fga)[0];
  const hog=[...ps].filter(p=>st(p).free>=3).sort((p,q)=>st(q).free-st(p).free)[0];
  const benchHero=[...ps].filter(p=>st(p).bench&&st(p).pts>=6).sort((p,q)=>st(q).pts-st(p).pts)[0];
  const my3=ps.reduce((s,p)=>s+st(p).m3,0);
  const their3=Y.T.players.filter(p=>Y.st[p.id]).reduce((s,p)=>s+Y.st[p.id].m3,0);
  const tiredAvg=X.court.reduce((s,p)=>s+st(p).f,0)/X.court.length;
  const bonus=ps.reduce((s,p)=>s+st(p).bonus,0);
  const moodWhy=p=>p.mood==='sad'?'still sulking':p.mood==='nervous'?'a bundle of nerves':p.mood==='angry'&&p.temp!=='fighter'?'too angry to think':st(p).f>0.6?'running on fumes':'ice cold';
  const good=[],bad=[];
  if(top&&st(top).pts>=7)good.push([st(top).pts,`${top.n}${top.mood==='happy'?', buzzing,':top.mood==='cool'?', locked in,':top.mood==='angry'&&top.temp==='fighter'?', furious and loving it,':''} scored ${st(top).pts}.`]);
  if(benchHero&&benchHero!==top)good.push([st(benchHero).pts+2,`${benchHero.n} came off the bench with ${st(benchHero).pts}.`]);
  if(X.T.sheet.def===2&&X.steals>=4)good.push([X.steals+2,`Your press stole the ball ${X.steals} times.`]);
  if(Y.T.sheet.def===1&&my3>=4)good.push([my3+1,`Their zone left your shooters open outside.`]);
  if(X.oreb-Y.oreb>=3)good.push([X.oreb-Y.oreb+2,`You grabbed ${X.oreb} second chances under the hoop.`]);
  if(X.fast>=3)good.push([X.fast+1,`Your fast breaks outran them ${X.fast} times.`]);
  if(X.rb-Y.rb>=3)good.push([X.rb-Y.rb+5,`The rule was worth ${X.rb} points to you and ${Y.rb} to them.`]);
  if(Y.rb-X.rb>=3)bad.push([Y.rb-X.rb+5,`The rule was worth ${Y.rb} points to them and only ${X.rb} to you.`]);
  const LU={attack:[p=>p.sh,'attackers','Attack counted double'],defence:[p=>p.df,'defenders','Defence counted double'],speed:[p=>p.sp,'runners','Speed counted double'],tiny_court:[p=>p.h*4,'giants','height ruled'],low_ceiling:[p=>-p.h*4,'small ones','tall players had to duck']}[rule];
  if(LU){const sum=Z=>Z.T.starters.map(id=>Z.T.players.find(p=>p.id===id)).filter(Boolean).reduce((a,p)=>a+LU[0](p),0);const d=sum(X)-sum(Y);
    if(d>=1.2)good.push([d*3+4,`You started the better ${LU[1]} in a week when ${LU[2]}.`]);
    if(d<=-1.2)bad.push([-d*3+4,`They started the better ${LU[1]} in a week when ${LU[2]}.`]);}
  // the newer dials
  const xs=X.T.sheet,ys=Y.T.sheet;
  const foc=Z=>Z.T.players.find(p=>p.id===Z.T.ball&&Z.st[p.id])||[...Z.court].sort((p,q)=>q.sh-p.sh)[0];
  const mf=foc(X),yf=foc(Y),ms=X.st[mf.id],yst=Y.st[yf.id];
  if(ys.guard===2&&ms.dbl>=4&&ms.dblM/ms.dbl<0.34)bad.push([ms.dbl+5,`They double-teamed ${mf.n}: ${ms.dblM} of ${ms.dbl}.${xs.off===1?' Star ball walked straight into it.':''}`]);
  if(ys.guard===2&&X.openM>=4)good.push([X.openM+3,`Their double team on ${mf.n} left your others open for ${X.openM} easy ones.`]);
  if(ys.guard===1&&ms.shad>=4&&ms.shadM/ms.shad<0.3)bad.push([ms.shad+4,`Their best defender shadowed ${mf.n} all game: ${ms.shadM} of ${ms.shad}.`]);
  if(xs.guard===2&&yst.dbl>=4&&yst.dblM/yst.dbl<0.34)good.push([yst.dbl+5,`Your double team smothered ${yf.n}: ${yst.dblM} of ${yst.dbl}.`]);
  if(xs.guard===2&&Y.openM>=4)bad.push([Y.openM+4,`Your double team on ${yf.n} left the others open: ${Y.openM} easy baskets.${ys.off===0?' They share the ball.':''}`]);
  const stopper=[...X.court].sort((p,q)=>q.df-p.df)[0];
  if(xs.guard===1&&yst.shad>=4&&yst.shadM/yst.shad<0.3)good.push([yst.shad+4,`${stopper.n} shadowed ${yf.n} out of the game: ${yst.shadM} of ${yst.shad}.`]);
  if(xs.guard===1&&yst.shad>=4&&yst.shadM/yst.shad>=0.6)bad.push([yst.shad+3,`${yf.n} scored over ${stopper.n}${stopper.mood==='angry'?', too furious to guard cleanly,':stopper.mood==='sad'?', who was sulking,':''} all afternoon.`]);
  if(xs.off===2&&X.playN>=6){const pq=X.playQ/X.playN;const worst=[...X.court].sort((p,q)=>(MOODFX[p.mood][2]+0.08*p.trust)-(MOODFX[q.mood][2]+0.08*q.trust))[0];
    if(pq>=0.035)good.push([9,'Your set plays ran like clockwork. They trust you.']);
    if(pq<=-0.035)bad.push([10,xs.tempo===2&&pq>-0.07?'Set plays at a fast tempo: nobody had time to run them.':`Your set plays fell apart: ${worst.n} ${worst.mood==='angry'?'was too angry to follow them':worst.mood==='sad'?'was sulking and forgot them':'does not trust you enough'}.`]);}
  if(xs.off===1&&ms.fga>=6&&ms.fgm/ms.fga<0.3&&(mf.mood==='nervous'||mf.mood==='sad'))bad.push([ms.fga+5,`Everything went through ${mf.n}, ${mf.mood==='nervous'?'who froze under the weight of it':'who was sulking'}: ${ms.fgm} of ${ms.fga}.`]);
  if(Y.fast>=3)bad.push([Y.fast+3,xs.boards===2?`You sent everyone to the hoop and they ran past you ${Y.fast} times.`:`They outran you on ${Y.fast} fast breaks.${xs.boards!==0?' Nobody got back.':''}`]);
  if(xs.boards===2&&X.oreb>=4&&X.oreb-Y.oreb>=2)good.push([X.oreb+3,`Crashing the hoop won you ${X.oreb} second shots.`]);
  if(xs.boards===0&&ys.tempo===2&&Y.fast<=1)good.push([5,'You got back early and their fast game had nowhere to run.']);
  if(cold)bad.push([st(cold).fga+3,`${cold.n}, ${moodWhy(cold)}, missed ${st(cold).fga-st(cold).fgm} of ${st(cold).fga}.`]);
  if(hog)bad.push([st(hog).free+4,`${hog.n} ignored the plan and kept shooting.`]);
  if(Y.T.sheet.def===2&&Y.steals>=4)bad.push([Y.steals+2,`Their press took the ball off you ${Y.steals} times.`]);
  if(X.T.sheet.def===1&&their3>=4)bad.push([their3+2,`Your zone left their shooters open: ${their3} long ones went in.`]);
  if(tiredAvg>0.62)bad.push([6,`${X.T.sheet.def===2?'The press':X.T.sheet.tempo===2?'Fast tempo':'A long game'} wore your players out by the end.`]);
  if(Y.oreb-X.oreb>=3)bad.push([Y.oreb-X.oreb+2,xs.boards===0?`You got back early and left them the rebounds: ${Y.oreb} second shots.`:`They owned the rebounds: ${Y.oreb} second shots.`]);
  const tos=ps.reduce((s,p)=>s+st(p).to,0);if(tos>=6&&!(Y.T.sheet.def===2&&Y.steals>=4))bad.push([tos,`You fumbled the ball away ${tos} times.`]);
  good.sort((x,y)=>y[0]-x[0]);bad.sort((x,y)=>y[0]-x[0]);
  if(won){if(good[0])L.push(good[0][1]);if(good[1])L.push(good[1][1]);else if(bad[0])L.push('Even so: '+bad[0][1]);}
  else{if(bad[0])L.push(bad[0][1]);if(bad[1])L.push(bad[1][1]);else if(good[0])L.push('Still: '+good[0][1]);}
  if(!L.length)L.push(won?'A scrappy win. Nothing pretty about it.':'Close, but they wanted it more.');
  if(X.noLineup){L.unshift(`You named no starters, so your three weakest players started: ${X.court.map(p=>p.n).join(', ')}.`);L.length=Math.min(L.length,2);}
  return L;
}
// ───────────────────────── the match report everybody can read ─────────────────────────
// Three strong points and three weak points of one side in one match. X = that side, Y = the other.
// It is public, so it says only what a spectator could see on the court: no moods, no trust, no secrets.
// Every candidate gets a score (above zero: strong point, below zero: weak point), scaled so that 1 is
// "clearly better than a usual match" (the usual numbers were measured over thousands of matches).
function scoutReport(X,Y,rule){
  const ps=X.T.players.filter(p=>X.st[p.id]),st=p=>X.st[p.id];
  const sum=f=>ps.reduce((s,p)=>s+f(st(p)),0),osum=f=>Y.T.players.filter(p=>Y.st[p.id]).reduce((s,p)=>s+f(Y.st[p.id]),0);
  const C=[],add=(score,text)=>{if(isFinite(score)&&score!==0)C.push([score,text]);};
  const xs=X.T.sheet,ys=Y.T.sheet,them=Y.T.name,times=n=>n===1?'once':n===2?'twice':n+' times';
  const fga=sum(z=>z.fga),fgm=sum(z=>z.fgm),a3=sum(z=>z.a3),m3=sum(z=>z.m3),a2=fga-a3,m2=fgm-m3,to=sum(z=>z.to);
  const ofga=osum(z=>z.fga),ofgm=osum(z=>z.fgm),o3=osum(z=>z.m3);
  // shooting
  if(a2>=3){const v=(m2/a2-0.51)/0.185*(a2>=5?1:0.5);add(v,v>0?`Close to the hoop: made ${m2} of ${a2}.`:`Close to the hoop: only ${m2} of ${a2}.`);}
  if(a3>=3){const v=(m3/a3-0.36)/0.18*(a3>=5?1:0.5);add(v,v>0?`From long range: made ${m3} of ${a3}.`:`From long range: only ${m3} of ${a3}.`);}
  // looking after the ball
  if(to<=1)add(0.9,to?'Lost the ball only once.':'Never lost the ball.');
  else if(to>=5)add(-(to-3.3)/2.2,`Lost the ball ${to} times${ys.def===2?' against the press':''}.`);
  else if(to===2)add(0.3,'Lost the ball only twice.');
  else if(to===4)add(-0.25,`Lost the ball 4 times${ys.def===2?' against the press':''}.`);
  // rebounds
  {const d=X.oreb-Y.oreb;if(d>=2)add(d/2.26,`Won the rebounds: ${X.oreb} second shots to ${Y.oreb}.`);if(d<=-2)add(d/2.26,`Lost the rebounds: ${X.oreb} second shot${X.oreb===1?'':'s'} to ${Y.oreb}.`);
    if(d===1)add(0.25,`Just ahead on the rebounds: ${X.oreb} second shot${X.oreb===1?'':'s'} to ${Y.oreb}.`);if(d===-1)add(-0.25,`Just behind on the rebounds: ${X.oreb} second shot${X.oreb===1?'':'s'} to ${Y.oreb}.`);}
  // running
  if(X.fast>=3)add(0.5+0.25*X.fast,`Ran ${X.fast} fast breaks.`);
  if(Y.fast>=3)add(-(0.5+0.25*Y.fast),`Was outrun on ${Y.fast} fast breaks${xs.boards===2?' after sending everyone to the hoop':''}.`);
  if(Y.fast===0&&ys.tempo===2&&rule!=='no_dribble'&&rule!=='tiny_court')add(0.7,`Got back in time: ${them} played fast and never got a fast break.`);
  // who scored
  const top=[...ps].sort((p,q)=>st(q).pts-st(p).pts)[0];
  if(top&&st(top).pts>=7)add((st(top).pts-6)/4,`${top.n} scored ${st(top).pts} (${st(top).fgm} of ${st(top).fga} shots).`);
  else if(top&&st(top).pts>=4)add(0.15,`${top.n} led the scoring with ${st(top).pts}.`);
  const cold=[...ps].filter(p=>st(p).fga>=5&&st(p).fgm/st(p).fga<0.3).sort((p,q)=>st(q).fga-st(p).fga)[0];
  if(cold)add(-(0.4+0.18*(st(cold).fga-st(cold).fgm)),`${cold.n} missed ${st(cold).fga-st(cold).fgm} of ${st(cold).fga} shots.`);
  if(!cold){const off=[...ps].filter(p=>st(p).fga>=3&&st(p).fgm/st(p).fga<=0.34).sort((p,q)=>st(p).fgm/st(p).fga-st(q).fgm/st(q).fga||st(q).fga-st(p).fga)[0];
    if(off)add(-0.2,`${off.n} made ${st(off).fgm} of ${st(off).fga} shots.`);}
  const scorers=ps.filter(p=>st(p).pts>=5).length;
  if(scorers>=3)add(0.5+0.35*(scorers-3),`${scorers===3?'Three':scorers===4?'Four':'Five'} players scored 5 or more.`);
  const hungry=[...ps].sort((p,q)=>st(q).fga-st(p).fga)[0];
  if(hungry&&fga>=12&&st(hungry).fga/fga>=0.5&&scorers<3)add(-(0.45+2*(st(hungry).fga/fga-0.5)),`${hungry.n} took ${st(hungry).fga} of the team's ${fga} shots.`);
  // the substitutes
  const cameOn=ps.filter(p=>st(p).bench&&st(p).min>0),benchPts=cameOn.reduce((s,p)=>s+st(p).pts,0);
  if(cameOn.length&&benchPts>=7)add((benchPts-4)/5,`The substitutes scored ${benchPts}.`);
  else if(cameOn.length&&benchPts>=4)add(0.2,`The substitutes scored ${benchPts}.`);
  else if(cameOn.length&&benchPts>0)add(-0.15,`The substitutes scored only ${benchPts}.`);
  if(cameOn.length&&benchPts===0)add(-0.55,'The substitutes scored nothing.');
  // legs
  const tired=X.court.reduce((s,p)=>s+st(p).f,0)/X.court.length;
  if(tired>=0.3)add(-(0.3+(tired-0.18)/0.1*0.45),`Tired at the end${xs.def===2?' from pressing':xs.tempo===2?' from the fast tempo':!cameOn.length?', with no substitute used':''}.`);
  // defence
  if(ofga>=8){const v=-(ofgm/ofga-0.454)/0.153;add(v,v>0?`Defence held ${them} to ${ofgm} of ${ofga} shots.`:`Defence let ${them} make ${ofgm} of ${ofga} shots.`);}
  if(xs.def===2){if(X.steals>=4)add(0.4+0.2*X.steals,`The press won the ball ${X.steals} times.`);else if(X.steals<=1)add(-0.6,`The press won the ball ${X.steals?'only once':'not even once'}.`);}
  if(xs.def===1&&o3>=4)add(-(0.3+0.2*o3),`The zone left shooters open: ${o3} long shots went in.`);
  // the star and the special guard on a star
  const foc=Z=>Z.T.players.find(p=>p.id===Z.T.ball&&Z.st[p.id])||[...Z.court].sort((p,q)=>q.sh-p.sh)[0];
  const mf=foc(X),yf=foc(Y),ms=X.st[mf.id],yst=Y.st[yf.id],stopper=[...X.court].sort((p,q)=>q.df-p.df)[0];
  if(ys.guard===2&&ms.dbl>=4&&ms.dblM/ms.dbl<0.34)add(-(0.6+0.12*ms.dbl),`${mf.n} was double-teamed and made ${ms.dblM} of ${ms.dbl}.`);
  if(ys.guard===2&&X.openM>=4)add(0.4+0.15*X.openM,`Beat the double team on ${mf.n}: ${X.openM} open baskets for the others.`);
  if(ys.guard===1&&ms.shad>=4&&ms.shadM/ms.shad<0.3)add(-(0.6+0.1*ms.shad),`${mf.n} was shadowed out of the game: ${ms.shadM} of ${ms.shad}.`);
  if(ys.guard===1&&ms.shad>=4&&ms.shadM/ms.shad>=0.6)add(0.6+0.1*ms.shad,`${mf.n} scored over the shadow: ${ms.shadM} of ${ms.shad}.`);
  if(xs.guard===2&&yst.dbl>=4&&yst.dblM/yst.dbl<0.34)add(0.6+0.12*yst.dbl,`The double team held ${yf.n} to ${yst.dblM} of ${yst.dbl}.`);
  if(xs.guard===2&&Y.openM>=4)add(-(0.4+0.15*Y.openM),`The double team on ${yf.n} left ${Y.openM} open baskets.`);
  if(xs.guard===1&&yst.shad>=4&&yst.shadM/yst.shad<0.3)add(0.6+0.1*yst.shad,`${stopper.n} shadowed ${yf.n}: ${yst.shadM} of ${yst.shad}.`);
  if(xs.guard===1&&yst.shad>=4&&yst.shadM/yst.shad>=0.6)add(-(0.6+0.1*yst.shad),`${yf.n} scored over ${stopper.n}'s shadow: ${yst.shadM} of ${yst.shad}.`);
  // sticking to the plan
  const solo=[...ps].filter(p=>st(p).free>=3).sort((p,q)=>st(q).free-st(p).free)[0];
  if(solo)add(-(0.5+0.15*st(solo).free),`${solo.n} ignored the plan and went alone ${times(st(solo).free)}.`);
  if(xs.off===2&&X.playN>=6){const pq=X.playQ/X.playN;if(pq>=0.035)add(1,'The set plays worked.');if(pq<=-0.035)add(-1.1,xs.tempo===2?'Set plays at a fast tempo: they broke down.':'The set plays broke down.');}
  // the rule of the match
  {const d=X.rb-Y.rb;if(d>=3)add(0.5+d/5,`Got ${X.rb} points out of the rule, ${them} ${Y.rb}.`);if(d<=-3)add(-(0.5-d/5),`Got ${X.rb} point${X.rb===1?'':'s'} out of the rule, ${them} ${Y.rb}.`);}
  // size and speed of the players who were on the floor
  {const av=(Z,f)=>Z.court.reduce((s,p)=>s+f(p),0)/Z.court.length,dh=av(X,p=>p.h)-av(Y,p=>p.h),ds=av(X,p=>p.sp)-av(Y,p=>p.sp);
    if(Math.abs(dh)>=0.07)add(dh/0.23*0.6,dh>0?`The taller team on the floor.`:`The smaller team on the floor.`);
    if(Math.abs(ds)>=0.3)add(ds/0.88*0.6,ds>0?`The quicker team on the floor.`:`The slower team on the floor.`);}
  // the score itself, when little else stands out
  {const v=(X.score-19)/8;if(rule!=='first11'&&Math.abs(v)>=0.5)add(v*0.3,v>0?`Scored ${X.score} points.`:`Scored only ${X.score} points.`);}
  {const d=fga-ofga;if(d>=2)add(0.1,`Got more shots away than ${them}: ${fga} to ${ofga}.`);if(d<=-2)add(-0.1,`Got fewer shots away than ${them}: ${fga} to ${ofga}.`);
    const oto=osum(z=>z.to);if(to<oto&&to>1)add(0.08,`Lost the ball less often than ${them}: ${to} to ${oto}.`);if(to>oto&&to<5&&to!==4)add(-0.08,`Lost the ball more often than ${them}: ${to} to ${oto}.`);}
  if(X.noLineup)add(-9,'Nobody set the line-up: the three weakest players started.');
  const pros=C.filter(c=>c[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,3).map(c=>c[1]);
  const cons=C.filter(c=>c[0]<0).sort((a,b)=>a[0]-b[0]).slice(0,3).map(c=>c[1]);
  return {pros,cons};
}
// A team's league so far, in numbers, for everybody to read: what it did in all its matches of this league added up.
// It is one small record per team that is updated after each match, so it does not grow as the league goes on.
// prev = the record so far (or one from an older league, which is dropped), X = this team's side of the match, Y = the other.
function seasonCard(prev,leagueNo,X,Y,won){
  const z=()=>[0,0,0];
  const c=prev&&prev.lg===leagueNo&&prev.n>0?JSON.parse(JSON.stringify(prev)):
    {lg:leagueNo,n:0,w:0,to:0,pn:0,pto:0,a2:0,m2:0,a3:0,m3:0,oa2:0,om2:0,oa3:0,om3:0,sec:0,osec:0,fb:0,ofb:0,tired:0,hog:0,dn:0,db:0,dbm:0,opn:0,sn:0,sh:0,shm:0,t:z(),s:z(),d:z(),o:z(),g:z(),b:z()};
  const S=Z=>Z.T.players.filter(p=>Z.st[p.id]).map(p=>Z.st[p.id]),sum=(a,f)=>a.reduce((s,v)=>s+f(v),0);
  const xs=S(X),ys=S(Y),sh=X.T.sheet,os=Y.T.sheet;
  const fga=sum(xs,v=>v.fga),a3=sum(xs,v=>v.a3),m3=sum(xs,v=>v.m3),fgm=sum(xs,v=>v.fgm),to=sum(xs,v=>v.to);
  const ofga=sum(ys,v=>v.fga),oa3=sum(ys,v=>v.a3),om3=sum(ys,v=>v.m3),ofgm=sum(ys,v=>v.fgm);
  c.n++;if(won)c.w++;
  c.to+=to;if(os.def===2){c.pn++;c.pto+=to;}                                   // ball losses, and those against a press
  c.a2+=fga-a3;c.m2+=fgm-m3;c.a3+=a3;c.m3+=m3;                                 // own shooting, close and long
  c.oa2+=ofga-oa3;c.om2+=ofgm-om3;c.oa3+=oa3;c.om3+=om3;                       // what opponents shot against them
  c.sec+=X.oreb;c.osec+=Y.oreb;c.fb+=X.fast;c.ofb+=Y.fast;                     // second shots and fast breaks, for and against
  if(X.court.reduce((s,p)=>s+X.st[p.id].f,0)/X.court.length>=0.3)c.tired++;    // matches finished on tired legs
  if(fga>0)c.hog=Math.round((c.hog+Math.max(...xs.map(v=>v.fga))/fga)*1000)/1000;   // how much of the shooting one player does
  const star=X.T.players.find(p=>p.id===X.T.ball&&X.st[p.id])||[...X.court].sort((p,q)=>q.sh-p.sh)[0],ss=X.st[star.id];
  if(os.guard===2){c.dn++;c.db+=ss.dbl;c.dbm+=ss.dblM;c.opn+=X.openM;}         // when their star was double-teamed
  if(os.guard===1){c.sn++;c.sh+=ss.shad;c.shm+=ss.shadM;}                      // when their star was shadowed
  c.t[sh.tempo]++;c.s[sh.shots]++;c.d[sh.def]++;c.o[sh.off||0]++;c.g[sh.guard||0]++;c.b[sh.boards===undefined?1:sh.boards]++;   // the plans they chose
  return c;
}
function roundPairs(n,k){const a=[...Array(n).keys()];const rest=a.slice(1);for(let i=0;i<k;i++)rest.unshift(rest.pop());const arr=[0,...rest];const out=[];for(let i=0;i<n/2;i++)out.push([arr[i],arr[n-1-i]]);return out;}

// ───────────────────────── talking ─────────────────────────
function react(p,tone,strength){
  let r=TEMPS[p.temp].r[tone];
  if(tone===p.love)r=[pick(LOVE_LINES),'happy',1];
  else if(tone===p.hate)r=[pick(HATE_LINES),(p.temp==='hothead'||p.temp==='showoff')?'angry':'sad',-1];
  else if(tone==='calm'&&p.temp==='hothead'&&p.mood!=='angry')r=['I AM CALM!!','angry',-1];
  if(tone!==p.love&&tone!==p.hate&&tone==='praise'&&p.cold&&['veteran','loner','hothead','fighter'].includes(p.temp))r=['After THAT game? Do not.','ok',-1];
  if(tone==='shout'&&p.mood==='sad'&&p.temp!=='fighter')r=[r[0],r[1]==='angry'?'angry':'sad',Math.min(r[2],-2)];
  if(strength>=1){if(p.lastTone===tone)r=[pick(['You said that last time, coach.','Yes, yes. Heard it.','Is this the same speech?']),'ok',0];p.lastTone=tone;}
  const before=p.mood;
  if(strength>=1||R()<0.6){p.mood=r[1];}
  const dt=strength>=1?r[2]:(Math.abs(r[2])>=2?Math.sign(r[2]):0);
  p.trust=clamp(p.trust+dt,-2,2);
  p.fx=null;
  if(p.mood===r[1]&&(p.mood!==before||strength>=1)){const k=strength>=1?1:0.5;
    const FX={happy:['sh',0.2],cool:['df',0.2],nervous:['sh',-0.2],sad:['sp',-0.2],angry:p.temp==='fighter'?['sh',0.2]:['df',-0.2]}[r[1]];
    if(FX){bump(p,FX[0],FX[1]*k);p.fx=FX;}}
  return r;
}
// one private talk with one player
function talkTo(p,tone){
  const repeat=p.lastTone===tone;
  const r=react(p,tone,1);p.talked=true;
  p.lastRes=`<b style="color:${p.fx?(p.fx[1]>0?'#2f9e44':'#e03131'):'#6b6477'}">${p.n} is ${WORD[p.mood]}${p.fx?': '+STATNAME[p.fx[0]]+' went '+(p.fx[1]>0?'up':'down')+' a little':repeat?': you said the same last time':''}.</b>`;
  if(!repeat){const bad=r[1]==='sad'||r[1]==='nervous'||(r[1]==='angry'&&p.temp!=='fighter')||r[2]<0;const good=!bad&&(r[1]==='happy'||r[1]==='cool'||r[1]==='angry'||r[2]>0);p.notes[tone]=bad?'bad':good?'good':'meh';}
  return r;
}
// one talk to the whole team, at half strength
function teamTalkTo(team,tone){
  const liked=[],hated=[],changed=[];
  for(const p of team.players){const before=p.mood;react(p,tone,0.5);if(p.mood!==before){changed.push(p.id);if(p.mood==='happy'||p.mood==='cool')liked.push(p.n);if(p.mood==='sad'||p.mood==='angry'||p.mood==='nervous')hated.push(p.n);}}
  team.teamTalked=true;
  return {liked,hated,changed,msg:`${liked.length?liked.join(', ')+' liked that. ':''}${hated.length?hated.join(', ')+' did not.':''}${!liked.length&&!hated.length?'They shuffle their feet. Nothing much changes.':''}`};
}
// What a match costs in energy and what a match off gives back. X is the team's side of playMatch's result.
// A fast tempo, a press and crashing the hoop cost more; a slow tempo costs less.
function energyAfter(team,X){
  const tot=Math.max(1,...Object.values(X.st).map(z=>z.min));const sh=team.sheet||{};
  const hard=1+(sh.tempo===2?0.2:sh.tempo===0?-0.15:0)+(sh.def===2?0.2:0)+(sh.boards===2?0.08:0);
  for(const p of team.players){
    const s=X.st[p.id],share=s?s.min/tot:0;
    p.enWas=energyOf(p);
    p.en=clamp(p.enWas-ENERGY.COST*hard*share+(share>0?ENERGY.PART_REST*(1-share):ENERGY.REST),1,4);
  }
}
// how many matches of silence each character puts up with before feeling ignored (a loner never minds)
const QUIET_LIMIT={showoff:2,pleaser:2,joker:2,worrier:2,hothead:2,veteran:3,fighter:3,easygoing:4,loner:999};
// how a match leaves one team: moods, then form (stats drift). X is that team's side of playMatch's result.
function aftermath(team,X,won,conceded){
  const moves=[],usage={};
  const tot=Math.max(0,...Object.values(X.st).map(z=>z.min));
  for(const p of team.players){const s=X.st[p.id];if(s)usage[p.id]={pts:s.pts,fga:s.fga,fgm:s.fgm,min:s.min,tot};}
  energyAfter(team,X);
  const wins=won?1:0;
  const best=team.players.filter(p=>usage[p.id]).sort((p,q)=>usage[q.id].pts-usage[p.id].pts)[0];
  for(const p of team.players){
    const u=usage[p.id],started=team.starters.includes(p.id);const before=p.mood;
    p.cold=!!(u&&u.fga>=4&&u.fgm/u.fga<0.25);
    if(p===best&&u.pts>=7)p.mood='happy';
    else if(u&&u.fga>=5&&u.fgm/u.fga<0.25)p.mood=(p.temp==='hothead'||p.temp==='fighter')?'angry':(p.temp==='veteran'||p.temp==='loner'||p.temp==='easygoing')?'ok':'nervous';
    else if(!started&&p.temp==='showoff'){p.mood='sad';p.trust=clamp(p.trust-1,-2,2);}
    else if(wins===1&&R()<0.4&&p.mood!=='angry')p.mood=p.mood==='sad'?'ok':'happy';
    else if(wins===0&&R()<0.5)p.mood=p.temp==='hothead'?'angry':p.temp==='worrier'||p.temp==='pleaser'?'nervous':p.mood;
    // left out completely: some take it personally
    const played=u&&u.min>0;
    if(!played&&p.enWas<3.5){/* a tired player is glad of the rest */}
    else if(!played){
      p.idle=(p.idle||0)+1;
      if(R()<(p.idle>=2?0.8:0.35)){
        if(p.temp==='showoff'||p.temp==='hothead'||p.temp==='fighter'){p.mood='angry';p.trust=clamp(p.trust-1,-2,2);}
        else if(p.temp==='pleaser'||p.temp==='worrier'||p.temp==='joker'){p.mood='sad';}
        else if(p.idle>=2&&p.temp!=='easygoing'){p.mood='sad';p.trust=clamp(p.trust-1,-2,2);}
      }
    }else p.idle=0;
    if(p.mood!==before)moves.push(`${p.n} is ${WORD[p.mood]}${!played?' about not playing':''}`);
  }
  // worn out and still made to play: most turn sour, and at rock bottom they stop trusting the coach
  for(const p of team.players){
    const u=usage[p.id];if(!(u&&u.min>0))continue;
    if(p.en<=1.5){
      const sour=p.temp==='hothead'||p.temp==='showoff'||p.temp==='fighter'||p.temp==='veteran'?'angry':p.temp==='loner'||p.temp==='easygoing'?null:'sad';
      for(let i=moves.length-1;i>=0;i--)if(moves[i].startsWith(p.n+' is '))moves.splice(i,1);
      if(sour&&R()<0.75){p.mood=sour;moves.push(`${p.n} is ${WORD[sour]}: worn out from playing match after match`);}
      else moves.push(`${p.n} is worn out`);
      if(p.en<=1.05&&p.temp!=='easygoing')p.trust=clamp(p.trust-1,-2,2);
    }else if(p.en<=2.5&&p.enWas>2.5)moves.push(`${p.n} is getting tired`);
  }
  // silence: a player the coach does not talk to starts to feel ignored. A talk to the whole team counts for half.
  for(const p of team.players){
    p.quiet=p.talked?0:(p.quiet||0)+(team.teamTalked?0.5:1);
    p.ignored=p.quiet>=QUIET_LIMIT[p.temp];
    if(p.ignored){
      p.mood=(p.temp==='showoff'||p.temp==='hothead')?'angry':'sad';p.trust=clamp(p.trust-1,-2,2);
      const n=Math.floor(p.quiet);
      for(let i=moves.length-1;i>=0;i--)if(moves[i].startsWith(p.n+' is '))moves.splice(i,1);
      moves.push(`${p.n} is ${WORD[p.mood]}: you have not talked to them for ${n} match${n===1?'':'es'}`);
    }
  }
  // form: stats drift with mood and with how the match went
  const ups=[];
  for(const p of team.players){
    p.tr={sh:0,df:0,sp:0};
    const u=usage[p.id];const played=u&&u.min>0;const ch=[];
    const m=p.mood;
    if(m==='happy')ch.push(['sh',0.08]);if(m==='cool')ch.push(['df',0.08]);
    if(m==='sad'||m==='nervous')ch.push(['sh',-0.1]);if(m==='angry')ch.push(p.temp==='fighter'?['sh',0.08]:['df',-0.1]);
    if(played){
      if(u.fga>=4&&u.fgm/u.fga>=0.5)ch.push(['sh',0.2]);
      if(u.fga>=4&&u.fgm/u.fga<0.25&&p.temp!=='veteran')ch.push(['sh',-0.15]);
      if(u.min>=u.tot*0.6)ch.push(['sp',0.1]);
      if(u.min>=u.tot*0.5&&conceded<=17)ch.push(['df',0.15]);
      if(u.min>=u.tot*0.5&&conceded>=26)ch.push(['df',-0.1]);
    }else if(!(p.enWas<3.5)){ch.push(['sp',-0.12]);ch.push(['sh',-0.06]);}   // sitting out when fresh costs form; a needed rest does not
    for(const [k,d] of ch){const r=bump(p,k,d);if(r>0)ups.push(`${p.n}'s ${STATNAME[k]} went up`);if(r<0)ups.push(`${p.n}'s ${STATNAME[k]} went down`);}
  }
  for(const x of ups)moves.push(x);
  return moves;
}
function sheetWords(s){return [['slow','steady','fast'][s.tempo],['inside','mixed','outside'][s.shots],['share','star ball','set plays'][s.off||0],['man','zone','press'][s.def],['','shadow','double'][s.guard||0],['get back','','crash'][s.boards===undefined?1:s.boards]].filter(Boolean).join(' · ');}
