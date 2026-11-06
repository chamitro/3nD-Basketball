// @ts-nocheck
// 3nD Basketball server function. BUILT FILE: do not edit here, edit the parts and run build.py.

// ======================= engine.js =======================
// 3nD Basketball: the rules of the game. No screen code in here.
// This one file is loaded by the page (practice mode and drawing) and is copied into the server function,
// so a talk or a match gives the same result wherever it runs.
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
function playMatch(A,B,ruleKey){
  const rule=ruleKey;
  const mk=T=>{
    let avail=T.players;if(rule==='tall_out'){const t=tallestId(T);avail=avail.filter(p=>p.id!==t);}
    const court=T.starters.map(id=>avail.find(p=>p.id===id)).filter(Boolean);
    const rest=avail.filter(p=>!court.includes(p)).sort((a,b)=>rating(b)-rating(a));
    while(court.length<3&&rest.length)court.push(rest.shift());
    const bench=(T.subs||[]).map(id=>avail.find(p=>p.id===id)).filter(p=>p&&!court.includes(p)).slice(0,2);
    const st={};for(const p of avail)st[p.id]={pts:0,fga:0,fgm:0,a3:0,m3:0,to:0,free:0,bonus:0,bench:!T.starters.includes(p.id),f:0.3*tiredOf(p),min:0,dbl:0,dblM:0,shad:0,shadM:0};
    return {T,court,bench,st,score:0,steals:0,oreb:0,fast:0,rb:0,openA:0,openM:0,playQ:0,playN:0};
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
    let pTO=0.10+0.06*(shooter.h-0.5)+fx[1]+(ds.def===2?0.07:0)-(noRun?0:0.02*nrm(shooter.sp)*sMul);
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
  return L;
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

// ======================= push.js =======================
// 3nD Basketball: result notifications (Web Push). Runs on the server only.
// Phones accept a notification only if it is encrypted for that one device (RFC 8291) and signed by this
// server's own key (VAPID, RFC 8292). Both are done here with the built-in crypto, no library.
const b64u=buf=>{let s='';for(const x of new Uint8Array(buf))s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const ub64=str=>{let s=String(str).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a;};
const cat=(...xs)=>{const o=new Uint8Array(xs.reduce((n,x)=>n+x.length,0));let i=0;for(const x of xs){o.set(x,i);i+=x.length;}return o;};
const utf8=s=>new TextEncoder().encode(s);
async function hkdf(salt,ikm,info,len){const k=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,len*8));}

// Encrypt one message for one device. `fixed` is only for checking against the published test values.
async function pushEncrypt(plain,p256dh,auth,fixed){
  const ua=ub64(p256dh),authSecret=ub64(auth);
  const uaKey=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
  let asPriv,asPub;
  if(fixed){asPriv=await crypto.subtle.importKey('jwk',fixed.jwk,{name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);asPub=fixed.pub;}
  else{const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);asPriv=kp.privateKey;asPub=new Uint8Array(await crypto.subtle.exportKey('raw',kp.publicKey));}
  const ecdh=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:uaKey},asPriv,256));
  const ikm=await hkdf(authSecret,ecdh,cat(utf8('WebPush: info\0'),ua,asPub),32);
  const salt=fixed?fixed.salt:crypto.getRandomValues(new Uint8Array(16));
  const cek=await hkdf(salt,ikm,utf8('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hkdf(salt,ikm,utf8('Content-Encoding: nonce\0'),12);
  const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,cat(utf8(plain),new Uint8Array([2]))));
  return cat(salt,new Uint8Array([0,0,16,0,asPub.length]),asPub,ct);
}
// this server's signing key: made once, kept in the database
async function newVapid(){
  const kp=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',kp.privateKey);
  return {jwk:{kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y,d:jwk.d},pub:b64u(await crypto.subtle.exportKey('raw',kp.publicKey))};
}
async function vapidHeader(endpoint,vapid,nowMs){
  const head=b64u(utf8(JSON.stringify({typ:'JWT',alg:'ES256'})));
  const body=b64u(utf8(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor((nowMs||Date.now())/1000)+12*3600,sub:'https://chamitro.github.io/3nD-Basketball/'})));
  const key=await crypto.subtle.importKey('jwk',vapid.jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,utf8(head+'.'+body));
  return 'vapid t='+head+'.'+body+'.'+b64u(sig)+', k='+vapid.pub;
}
// Notifications may only be sent to the real notification services of the browser makers, never to an address a visitor made up.
const PUSH_HOSTS=['fcm.googleapis.com','.push.services.mozilla.com','.notify.windows.com','.push.apple.com'];
function pushHostOk(endpoint){
  try{const u=new URL(endpoint);if(u.protocol!=='https:')return false;return PUSH_HOSTS.some(h=>h[0]==='.'?u.hostname.endsWith(h):u.hostname===h);}catch(e){return false;}
}
// returns the HTTP status of the notification service (201 = accepted, 404/410 = this device is gone), 0 = no answer
async function sendPush(sub,payload,vapid){
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),6000);
  try{
    const body=await pushEncrypt(JSON.stringify(payload),sub.p256dh,sub.auth);
    const r=await fetch(sub.endpoint,{method:'POST',signal:ctl.signal,body,
      headers:{'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:'86400',Urgency:'normal',Authorization:await vapidHeader(sub.endpoint,vapid)}});
    return r.status;
  }catch(e){return 0;}
  finally{clearTimeout(timer);}
}

// ======================= server.js =======================
// 3nD Basketball: the online league. Runs on the server only, on top of engine.js.
// The browser sends choices ("talk to this player: praise", "this is my plan"); everything is decided here.
// `store` is the database (see the bottom of the server function for the real one, the tests use one in memory).
// store.saveTeam writes only if the row has not changed since it was read (it throws 'conflict' otherwise),
// so a request that overlaps a match day can never write old data over the result.

const CFG={
  MATCH_HOUR_UTC:18,      // matches are played at this hour, UTC
  MATCH_DAYS:[0,3],       // Sunday and Wednesday
  LEAGUE_MATCHES:8,       // length of the leagues before SEASONS_FROM: the first league is a one-month test (two matches a week for four weeks)
  SEASONS_FROM:2,         // from this league number on, a league lasts one season of the year: Winter (Dec-Feb), Spring (Mar-May), Summer (Jun-Aug), Autumn (Sep-Nov)
  MAX_SWAPS:1,            // players a manager may change between leagues
  IDLE_DAYS:21,           // a manager who has not opened the game for this long is left out until they return
  HALL_SIZE:50,           // how many teams the all-time list of league winners shows
  HOUSE_NAME:'The House Team',
};
const DAY_MS=86400000;
const SERVER_BUILD='95faa2da';   // build.py puts a fingerprint of the server code here, and `ping` reports it, so a deployment can be checked from outside

// the next Wednesday or Sunday at the match hour, strictly after the given moment
function nextMatchTime(afterMs){
  const d=new Date(afterMs);const t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),CFG.MATCH_HOUR_UTC);
  for(let i=0;i<9;i++){const c=t+i*DAY_MS;if(c>afterMs&&CFG.MATCH_DAYS.includes(new Date(c).getUTCDay()))return c;}
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
  return seasonKey(nextMatchTime(at))!==seasonKey(at);
}
// how many matches the running league has in all
function leagueLength(lg){
  if(!isSeasonal(lg.no))return CFG.LEAGUE_MATCHES;
  let n=lg.match_no,t=lg.next_match_at;
  for(let k=0;k<80&&!isLastMatch(lg.no,n,t);k++){t=nextMatchTime(t);n++;}
  return n;
}
// the name of league `no`, one of whose matches is played at `at`: "Winter League 2026/27", "Spring League 2027"; before the seasons "League 1"
function leagueName(no,at,short){
  if(!isSeasonal(no))return 'League '+no;
  const s=seasonOf(at),nm=SEASON_NAMES[s.i]+' League';
  return short?nm:nm+' '+(s.i===0?s.y+'/'+String((s.y+1)%100).padStart(2,'0'):s.y);
}
// what the browser is told about the running league
function leagueInfo(lg){return {no:lg.no,name:leagueName(lg.no,lg.next_match_at),short:leagueName(lg.no,lg.next_match_at,true),match_no:lg.match_no,of:leagueLength(lg),next_match_at:lg.next_match_at,rule:lg.rule};}
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
  const rule=lg.rule,matches=[],done=new Set(),playedLeague=lg.no,playedMatch=lg.match_no;
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
      if(X.is_house)energyAfter(X.data,xs);   // the computer team tires like everyone else
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
  const tbl=(await store.tableRows(lg.no)).map(t=>map.has(t.id)?map.get(t.id):t).sort(standing);
  const placeOf=id=>tbl.findIndex(t=>t.id===id)+1;
  for(const t of humans)if(t.data.last&&t.data.last.match===lg.match_no&&t.data.last.league===lg.no){t.data.last.place=placeOf(t.id);t.data.last.of=tbl.length;}
  let reset=false;
  if(isLastMatch(lg.no,lg.match_no,lg.next_match_at)){
    const endedName=leagueName(lg.no,lg.next_match_at),nextName=leagueName(lg.no+1,nextMatchTime(lg.next_match_at));
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
  lg.next_match_at=nextMatchTime(lg.next_match_at);lg.busy_until=null;
  // next pairings, among the managers who are still around
  if(reset){for(const t of rows)t.next_opp=null;}   // the new league starts empty
  else{
    const active=humans.filter(t=>t.last_seen>=now-CFG.IDLE_DAYS*DAY_MS);
    for(const t of humans)if(!active.includes(t))t.next_opp=null;
    pairUp(active,house);
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
  data.starters=st;data.subs=sb;data.ball=ball;data.sheet=sh;
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
        starters:st.length===3?st:top,ball:o.pub.ball&&st.includes(o.pub.ball)?o.pub.ball:null,ls:o.pub.ls||null};}}
  const d=row.data;
  return {phase:'week',now,
    league:{...leagueInfo(lg),vote_opts:lg.vote_opts,final:lg.final},
    me:{id:row.id,name:row.name,out:row.league_no!==lg.no&&!tbl.some(t=>t.id===row.id),w:row.w,l:row.l,pf:row.pf,pa:row.pa,pts:row.pts,players:d.players.map(ownPlayer),starters:d.starters,subs:d.subs,ball:d.ball,
      sheet:d.sheet,teamTalked:!!d.teamTalked,vote:d.vote,last:d.last,final:d.final,agents:(d.agents||[]).map(ownPlayer),won:d.won||0,played:d.played||0,history:d.history||[],push:(d.push||[]).length},
    push_key:vapid?vapid.pub:null,
    opp,table:tbl.slice(0,300).map(t=>({id:t.id,name:t.name,w:t.w,l:t.l,pf:t.pf,pa:t.pa,pts:t.pts,ls:t.pub.ls||null,lw:t.pub.lw})),teams:tbl.length,...(extra||{})};
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
    let managers=null,sql=null;try{managers=(await store.tableRows(lg.no)).length;sql=await store.config('sql');}catch(e){}
    return {ok:true,league:lg.no,match_no:lg.match_no,next_match_at:lg.next_match_at,up_to_date:now<lg.next_match_at,build:SERVER_BUILD,name:leagueName(lg.no,lg.next_match_at),matches:leagueLength(lg),swaps:CFG.MAX_SWAPS,managers,sql};
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

// ======================= store_rest.js =======================
// 3nD Basketball: the real database behind the online league (Supabase tables, reached over its REST interface).
function restStore(base,keys,prefix){
  if(prefix===undefined)prefix='/rest/v1/';
  let ki=0;
  async function q(path,opt){
    opt=opt||{};
    for(let attempt=0;attempt<keys.length;attempt++){
      const key=keys[ki];
      const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
      if(opt.prefer)headers.Prefer=opt.prefer;
      const r=await fetch(base+prefix+path,{method:opt.method||'GET',headers,body:opt.body===undefined?undefined:JSON.stringify(opt.body)});
      if((r.status===401||r.status===403)&&keys.length>1&&attempt<keys.length-1){ki=(ki+1)%keys.length;continue;}
      const t=await r.text();
      if(!r.ok)throw new Error('database '+r.status+': '+t.slice(0,300));
      return t?JSON.parse(t):null;
    }
    throw new Error('database refused the server key');
  }
  const one=async path=>{const a=await q(path);return (a&&a[0])||null;};
  const TEAM='id,key_hash,name,name_lc,is_house,league_no,w,l,pf,pa,pts,next_opp,last_seen,ver,pub,data';
  const pages=async(path,size)=>{const out=[];for(let off=0;;off+=size){const a=await q(path+'&limit='+size+'&offset='+off);out.push(...a);if(a.length<size)break;}return out;};
  return {
    league:()=>one('b3_league?id=eq.1'),
    saveLeague:lg=>q('b3_league?on_conflict=id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:lg}),
    house:()=>one('b3_teams?is_house=is.true&select='+TEAM+'&limit=1'),
    teamByKey:h=>one('b3_teams?key_hash=eq.'+h+'&select='+TEAM),
    teamById:id=>one('b3_teams?id=eq.'+id+'&select='+TEAM),
    teamsInPlay:()=>pages('b3_teams?or=(next_opp.not.is.null,is_house.is.true)&select='+TEAM+'&order=id',500),
    allTeams:()=>pages('b3_teams?is_house=is.false&select='+TEAM+'&order=id',500),
    tableRows:no=>pages('b3_teams?is_house=is.false&league_no=eq.'+(+no)+'&select=id,name,w,l,pf,pa,pts,pub&order=pts.desc,id',1000),   // the teams that entered league `no`
    insertTeam:async row=>(await q('b3_teams?select='+TEAM,{method:'POST',prefer:'return=representation',body:row}))[0],
    saveTeam:async row=>{
      const a=await q('b3_teams?id=eq.'+row.id+'&ver=eq.'+row.ver+'&select=id',{method:'PATCH',prefer:'return=representation',
        body:{last_seen:row.last_seen,data:row.data,ver:row.ver+1}});   // who meets whom is never written from here
      if(!a||!a.length)throw new Error('conflict');
      row.ver++;
    },
    // a team enters league `no`: from zero, together with whatever else changed on the way in
    enterLeague:async(row,no)=>{
      const a=await q('b3_teams?id=eq.'+row.id+'&ver=eq.'+row.ver+'&is_house=is.false&select=id',{method:'PATCH',prefer:'return=representation',
        body:{league_no:no,w:0,l:0,pf:0,pa:0,pts:0,last_seen:row.last_seen,data:row.data,ver:row.ver+1}});
      if(!a||!a.length)throw new Error('conflict');
      row.ver++;row.league_no=no;
    },
    // small settings kept by the server itself (table b3_config). If the table is missing these simply fail and the caller copes.
    config:async key=>{const row=await one('b3_config?key=eq.'+encodeURIComponent(key)+'&select=value');return row?row.value:null;},
    setConfig:(key,value)=>q('b3_config?on_conflict=key',{method:'POST',prefer:'resolution=ignore-duplicates,return=minimal',body:{key,value}}),
    attach:async(id,now)=>{
      try{await q('rpc/b3_attach',{method:'POST',body:{p_id:id,p_now:now}});}
      catch(e){if(String(e.message).includes('b3_busy'))throw new Error('conflict');throw e;}
    },
    nameTaken:async lc=>!!(await one('b3_teams?name_lc=eq.'+encodeURIComponent(lc)+'&select=id')),
    pool:h=>one('b3_pools?key_hash=eq.'+h+'&select=players,rerolls'),
    savePool:(h,p)=>q('b3_pools?on_conflict=key_hash',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{key_hash:h,players:p.players,rerolls:p.rerolls}}),
    dropPool:h=>q('b3_pools?key_hash=eq.'+h,{method:'DELETE',prefer:'return=minimal'}),
    lock:async now=>{
      const a=await q('b3_league?id=eq.1&next_match_at=lte.'+now+'&or=(busy_until.is.null,busy_until.lt.'+now+')&select=id',
        {method:'PATCH',prefer:'return=representation',body:{busy_until:now+60000}});
      return !!(a&&a.length);
    },
    commit:({league,teams,matches,reset})=>q('rpc/b3_commit',{method:'POST',body:{
      p_league:league,
      p_teams:teams.map(t=>({id:t.id,w:t.w,l:t.l,pf:t.pf,pa:t.pa,pts:t.pts,league_no:t.league_no,next_opp:t.next_opp,pub:t.pub,data:t.data})),
      p_matches:matches,p_reset:!!reset}}),
  };
}

// ======================= serve_deno.js =======================
// 3nD Basketball: the server function itself. Answers one browser request at a time.
function serverKeys(){
  const keys=[];
  try{const j=Deno.env.get('SUPABASE_SECRET_KEYS');if(j){const o=JSON.parse(j);const v=o.default||Object.values(o)[0];if(v)keys.push(String(v));}}catch(_e){}
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(legacy)keys.push(legacy);
  return keys;
}
async function sha256hex(s){
  const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const STORE=restStore(Deno.env.get('SUPABASE_URL'),serverKeys());
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
  let out;
  try{
    const body=await req.json();
    out=await handle(STORE,body,Date.now(),sha256hex);
  }catch(e){
    console.error(e);
    out={error:'The server had a problem: '+String(e&&e.message||e).slice(0,200)};
  }
  return new Response(JSON.stringify(out),{headers:{...CORS,'Content-Type':'application/json'}});
});
