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
// Names (Harry, 19 Nov 2026, Winter League): a funny first name and a funny surname (basketball puns until 20 Nov 2026: not liked), and often (20%, Harry 20 Nov 2026;
// 3% before) a legend, a spoof of a film character (92 of them), each at most once in a league. Film characters only, never real people. Letters,
// spaces and hyphens only (an apostrophe can break the page). The gym shows the short form (`shortName`). Players from
// before keep their old one-word names (SYL, kept for them).
const FIRST=['Biff','Noodle','Gus','Pickles','Dorian','Waldo','Tibbs','Moxie','Sully','Ziggy','Bubba','Fergus','Mabel','Otis','Pip',
  'Rufus','Bertie','Clem','Doris','Fifi','Gertie','Hank','Iggy','Lulu','Mungo','Nell','Ozzie','Percy','Rocco','Stan',
  'Vinnie','Wanda','Chuck','Dudley','Edna','Floyd','Gladys','Hector','Jasper','Lenny','Nigel','Olive','Reggie','Sid','Trudy',
  'Wilbur','Crumpet','Muffin','Taco','Pudding','Biscuit','Sprout','Waffles','Nugget','Bean','Dotty','Fizz','Gumbo','Tater','Yolanda'];
const LAST=['Snodgrass','Wobbles','Puddlefoot','Bumblesby','Noodleman','Picklesby','Waddleton','Wigglesby','Butterfoot','Pumpkinson',
  'McWobble','Fizzwick','Gobbleton','Snorkel','Puddingham','Muddlesby','Grumbleton','Bottomley','Sniffles','Wonkers',
  'Doodle','Fumbleton','Twiddle','Crumbsby','Jellybean','Pillowfort','Moonsock','Wafflesby','Toadley','Bogsworth',
  'Plopsby','Squishy','Burpington','Snoozle','Tumbleweed','Gigglesby','Hiccupson','Sockless','Bananas','Fiddlewick',
  'Honkwell','Quackers','Mumbles','Scramble','Bumbleford','Parsnip','Turnipseed','Spudsworth','Cabbage','Noodlehead',
  'Fuzzbucket','Lollipop','Kerfuffle','Hullabaloo','Brouhaha','Malarkey','Shenanigan','Rigmarole','Gobbledy','Dumpling'];
const LEGENDS=[['Donnie Darkio','Darkio'],['Donnie Dunko','Dunko'],['Dunk Skywalker','Skywalker'],['Hoop Solo','Solo'],['Darth Dribbler','Darth'],
  ['Forrest Dunk','Forrest'],['Rocky Rebound','Rocky'],['Indiana Hoops','Indiana'],['Marty McDunk','McDunk'],['Jack Sparrowball','Sparrowball'],
  ['Ferris Brickler','Ferris'],['Obi-Wan Swishobi','Obi-Wan'],['Hoopy Gilmore','Gilmore'],['Napoleon Dunkamite','Napoleon'],['Edward Swishorhands','Edward'],
  ['Jason Bounce','Bounce'],['Ace Rimtura','Ace'],['Austin Powerdunk','Austin'],['Sherlock Hoops','Sherlock'],['Harry Potshot','Potshot'],
  ['Gandalf the Swish','Gandalf'],['Frodo Bagshots','Frodo'],['Optimus Dunk','Optimus'],['James Bondball','Bondball'],['Jeffrey Lebounce','Lebounce'],
  ['Neo Dunkerson','Neo'],['The Dunkinator','Dunkinator'],['Maximus Rebound','Maximus'],['John Rimbo','Rimbo'],['Max Madball','Madball'],
  ['Chewbounce','Chewbounce'],['Master Hooda','Hooda'],['Princess Layup','Layup'],['Lando Calrimshot','Lando'],['Kylo Rebound','Kylo'],
  ['Jabba the Hoop','Jabba'],['Legolas Longshot','Legolas'],['Aragorn Alleyoop','Aragorn'],['Samwise Swishgee','Samwise'],['Bilbo Bankshot','Bilbo'],
  ['Hermione Grandunk','Hermione'],['Albus Dunkledore','Dunkledore'],['Severus Swipe','Severus'],['Hagrid Hooper','Hagrid'],['Bruce Wayneball','Wayneball'],
  ['Clark Kentshot','Kentshot'],['Peter Parkhoop','Parkhoop'],['Tony Starkdunk','Starkdunk'],['Thor Odunkson','Odunkson'],['Loki Layup','Loki'],
  ['Doc Brownball','Doc'],['Vito Dunkleone','Dunkleone'],['Maverick Swish','Maverick'],['Captain Hookshot','Hookshot'],['Shreck Rebound','Shreck'],
  ['Buzz Rimyear','Rimyear'],['Sheriff Woodball','Woodball'],['Simba Swish','Simba'],['Mufasa Dunk','Mufasa'],['Aladdunk','Aladdunk'],
  ['Genie Jumpshot','Genie'],['Peter Panball','Panball'],['Elsa Freezethrow','Elsa'],['Olaf Snowdunk','Olaf'],['Morpheus Rebound','Morpheus'],
  ['Agent Swishmith','Swishmith'],['Trinity Treys','Trinity'],['The Predunktor','Predunktor'],['Dunkzilla','Dunkzilla'],['King Konk','Konk'],
  ['ET Phonehoop','Phonehoop'],['John McSlam','McSlam'],['Vincent Vegadunk','Vegadunk'],['Dorothy Dunk','Dorothy'],['Scarecrow Swish','Scarecrow'],
  ['Willy Wonkashot','Wonkashot'],['Mary Hoppins','Hoppins'],['Jack Dunkson','Dunkson'],['William Wallball','Wallball'],['Count Dunkula','Dunkula'],
  ['Captain Kirkshot','Kirkshot'],['Mister Spockball','Spockball'],['Kung Fu Pandunk','Pandunk'],['Katniss Everdunk','Everdunk'],['Mrs Doubtswish','Doubtswish'],
  ['Frankendunk','Frankendunk'],['Jaws Rebound','Jaws'],['Smeagol Swish','Smeagol'],['Goose Bounce','Goose'],['Daniel Layusso','Layusso'],
  ['Ron Weaslam','Weaslam'],['The Ghostblocker','Ghostblock']];
const LEGEND_ODDS=0.2,RECENT_LAST=[];
function makeName(){
  if(R()<LEGEND_ODDS){const free=LEGENDS.filter(l=>!usedNames.has(l[0]));if(free.length){const n=pick(free)[0];usedNames.add(n);return n;}}
  for(let t=0;t<200;t++){const l=pick(LAST);if(t<60&&RECENT_LAST.includes(l))continue;const n=pick(FIRST)+' '+l;if(!usedNames.has(n)){usedNames.add(n);RECENT_LAST.push(l);if(RECENT_LAST.length>12)RECENT_LAST.shift();return n;}}   // no surname twice among the last twelve: a pool of fourteen is mixed
  for(let t=0;t<80;t++){let n=pick(SYL)+pick(SYL)+pick(SYL);n=n[0].toUpperCase()+n.slice(1);if(!usedNames.has(n)){usedNames.add(n);return n;}}   // all 3600 taken: the old kind
  return 'Zed '+Math.floor(R()*9999);}
const isLegend=n=>LEGENDS.some(l=>l[0]===n);
const shortName=n=>{const l=LEGENDS.find(x=>x[0]===n);if(l)return l[1];const i=String(n).indexOf(' ');return i<0?n:n.slice(i+1);};   // the gym's name tag
const TEAM_NAMES=['The Lanterns','Greyhound Row','Salt Street','Old Mill','Pickle Yard','The Wet Socks','Bin Lids United','Noodle Arms','Friday Leftovers','The Slow Clappers','Moon Boots','Soggy Biscuits','Elbow Room','The Loud Sneezers','Third Floor Flat'];

// ───────────────────────── temperaments ─────────────────────────
// reply: [line, mood after, trust change]
const TONES=['praise','comfort','challenge','demand','shout','joke','honest','calm','space'];
const TONE_LABEL={praise:'Praise',comfort:'Comfort',challenge:'Challenge',demand:'Demand more',shout:'Shout',joke:'Joke',honest:'Be honest',calm:'Calm down',space:'Give space'};
const TONE_SAY={praise:'You were brilliant out there.',comfort:'It is all right. I believe in you.',challenge:'Prove to me you belong on that court.',demand:'I expect more. Do your job.',shout:'WHAT WAS THAT?!',joke:'Did you leave your hands at home?',honest:'Straight talk. Here is where you stand.',calm:'Breathe. No pressure this week.',space:'I will leave you be.'};
// reply: [line, mood after, trust change]. The same words land differently on each character.
const TEMPS={
  showoff:{r:{
    praise:['Say it again. Slower.','happy',1],comfort:['I do not need a hug. I need the BALL.','ok',0],challenge:['Watch me. No really, WATCH me.','happy',1],demand:['Fine. But the ball comes to ME.','ok',0],shout:['Then find another superstar!','angry',-2],joke:['Are you laughing at ME?','angry',-1],honest:['I was NOT bad. The others were bad.','angry',-1],calm:['I am calm. I am ALWAYS calm.','ok',0],space:['You are... ignoring me?','sad',-1]}},
  worrier:{r:{
    praise:['Now I have to live up to that...','nervous',0],comfort:['Thanks. I needed that.','happy',1],challenge:['What if I cannot?','nervous',-1],demand:['Okay. Okay. Okay. I can do that.','nervous',0],shout:['...','sad',-1],joke:['Are you... making fun of me?','nervous',-1],honest:['I would rather know. Thank you.','cool',1],calm:['In... out... okay. Okay.','cool',1],space:['Did I do something wrong?','nervous',0]}},
  veteran:{r:{
    praise:['Do not butter me up.','ok',-1],comfort:['I am not a child.','ok',-1],challenge:['Hm. All right. One more time.','cool',1],demand:['Fair.','cool',1],shout:['I have been shouted at by better.','ok',0],joke:['Heh. Not bad.','ok',0],honest:['Good. That I can work with.','happy',2],calm:['I was calm before you were born.','ok',0],space:['Finally. Peace.','ok',1]}},
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
    praise:['Cheers, coach.','ok',0],comfort:['I am good, honestly.','ok',0],challenge:['Sure, why not.','ok',0],demand:['Whoa. Bit intense, coach.','ok',0],shout:['Deep breath, coach. It is only a game.','ok',0],joke:['Ha! Nice one.','happy',1],honest:['Fair enough.','cool',1],calm:['Already there.','ok',0],space:['Cool. See you Sunday.','ok',0]}},
};
// what the manager is told about each character: a name, a colour, one line
const CHAR={
  showoff:['Proud','#ffd43b','Lives for praise and a stage, rises to the big moment. Cannot take a joke or criticism.'],
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
const MOODFX={happy:[0.042,0,1,0],cool:[0.014,-0.03,1,0.03],ok:[0,0,0.95,0],nervous:[-0.028,0.05,0.9,0],sad:[-0.056,0,0.8,-0.04],angry:[-0.021,0.03,0.55,0.05]};   // shooting effects were 0.06/0.02/-0.04/-0.08/-0.03 until 9 Nov 2026 (30% less now, so that the dots count for more)

// ───────────────────────── rules of the week ─────────────────────────
const RULES=[
  {k:'attack',txt:"Attackers' week: Attack counts double!",why:'Helps teams full of attackers. Defence counts half. Start your best shooters.'},
  {k:'defence',txt:"Defenders' week: every steal is a point!",why:'Helps defensive teams. Defence counts double, and a press that works is gold.'},
  {k:'speed',txt:"Runners' week: fast breaks score three!",why:'Helps quick teams. Speed counts double and the faster three break away all game.'},
  {k:'tiny_court',txt:'The court is the size of a rug!',why:'Helps tall teams. Height decides everything, speed counts for nothing.'},
  {k:'low_ceiling',txt:'The ceiling is very low!',why:'Helps small teams. Tall players have to duck and shoot worse.'},
  {k:'three5',txt:'Long shots count FIVE!',why:'Helps outside shooters. A zone defence gets punished.'},
  {k:'bench',txt:'Bench week: substitutes score double!',why:'Helps deep squads. Who you name as substitute matters most.'},
  {k:'slippery',txt:'The ball is buttered!',why:'Twice the fumbles. Helps pressing teams and calm heads.'},
  {k:'hotheads',txt:'Furious players score +1!',why:'Helps a team with angry players. Do you dare make someone fume?'},
  {k:'party',txt:'Happy players score +1!',why:'Helps a happy locker room. Your talks are worth points this week.'},
  {k:'no_dribble',txt:'No dribbling. Passes only!',why:'Speed is useless. Players who ignore the plan ruin everything, so trust matters.'},
  {k:'oldhands',txt:"Old hands' night: players aged 30 or more score +1!",why:'Helps a squad with experience. Start your veterans.'},
  {k:'heavy',txt:"Heavyweights' night: fat players score +1!",why:'Helps the big bodies. Start your heaviest players.'},
  {k:'rookies',txt:"Rookies' night: players aged 23 or younger score +1!",why:'Helps a young squad. Start your rookies.'},
  {k:'rebounds',txt:'Rebound frenzy: every offensive rebound is a point!',why:'Helps tall and heavy teams. Crash the boards.'},
  {k:'freshlegs',txt:'Fresh legs night: rested players score +1!',why:'Helps the team that rested its players: +1 a basket for anyone with at least three and a half energy dots before the match.'},
  {k:'underdog',txt:'Underdog week: the team lower in the table starts 5 points up!',why:'Helps the underdog. Lower winning percentage, five points before tip-off.'},
];
// rules taken out of the draw (Harry, 26 Nov 2026, Winter League): "Close shots count three" made the most blowouts and was a
// second rule for tall teams; "The tallest player sits out" changed nothing measurable; "Iron legs" and "First to eleven" do not
// use the playing-time plan (a manager's minutes were ignored without a word). Kept here so that a league already
// playing under one of them still finds it.
const RETIRED_RULES=[
  {k:'iron',txt:'Iron legs: no substitutions!',why:'Your three starters play every minute. Slow tempo saves legs, a press burns them.'},
  {k:'first11',txt:'First to eleven wins!',why:'Short game. Helps a fast tempo and a strong first three.'},
  {k:'paint',txt:'Close shots count three, long shots only two!',why:'Helps tall teams that play inside. A zone protects the hoop.'},
  {k:'tall_out',txt:'The tallest player sits out!',why:'Hurts teams built around one giant. Yours cannot play, theirs neither.'},
];
const ruleOf=k=>RULES.find(r=>r.k===k)||RETIRED_RULES.find(r=>r.k===k);
// how strong two rules are (26 Nov 2026: both kept their promise too weakly; tuned on 3000 matches each)
const RULE_FX={lowCeil:1.1,lowFrom:0.42,five:0.12,fiveTake:0.25,reb:0.5,rebFat:0.05,freshFrom:3.5,head:5};   // reb, rebFat: under Rebound frenzy height and weight win more of the rebounds
// ───────────────────────── half-time orders ─────────────────────────
// The manager leaves one order for each way the first half can end. At half-time the engine looks at the score and
// the second half is played with the changed plan. Every order has its cost from the ordinary rules (a press tires,
// fresh legs are weaker legs...). "First to eleven" has no half-time, so no orders there.
const ORDERS=[
  {k:'press',txt:'Press them',why:'The defence becomes a press: steals the ball from tall, slow or tired players, tires your own legs.'},
  {k:'zone',txt:'Drop into a zone',why:'Guards the hoop and hides weak defenders; leaves long shots open and gives up second shots, since nobody boxes out.'},
  {k:'slow',txt:'Slow the game down',why:'Fewer possessions for both teams and legs are saved. Protects a lead, kills your own comeback.'},
  {k:'fast',txt:'Speed the game up',why:'More possessions for both teams and fast breaks if you are quicker. Tires the legs.'},
  {k:'outside',txt:'Shoot from outside',why:'Long shots for three. Attack dots decide, a zone leaves them open.'},
  {k:'fresh',txt:'Fresh legs',why:'Both substitutes come on for the two most tired players on the court.'},
  {k:'star',txt:'Everything through one player',why:'Star ball for the second half, to the player you name; from the bench they come on. Pays for a player who is buzzing or locked in, sinks a cold, anxious or sulking one.'},
];
const ORDER_WHEN={behind:'If we are behind at half-time',close:'If it is close at half-time',ahead:'If we are ahead at half-time'};
// The half-time talk: one tone, said to the whole team in the locker room. Each character reacts as it always does
// (moods only: no trust and no form change at half-time). A sharp talk also lifts the whole second half a little,
// as a 304-game study of half-time speeches found, but shouting overshoots: it lifts less and makes the wrong players fume.
const TALK_SHARP={honest:1,challenge:1,demand:1,shout:2};
const TALK_WORD={praise:'praised them',comfort:'comforted them',challenge:'challenged them',demand:'demanded more',shout:'shouted at them',joke:'cracked a joke',honest:'gave it to them straight',calm:'calmed them down',space:'left them alone'};
// Trash talk (Harry, 25 Nov 2026): three lines. Each rattles three characters and fires up one; the three "rattles" lists do not
// overlap, so every character has exactly one weak line and none is immune. The other team's characters are hidden, so each line is
// a one-in-three gamble; the ban (no talks to your own players in the next match) is the price. Until 25 Nov 2026 the four lines
// were talk tones read through each character's reactions. Only the players named for the match hear it; a team that has heard
// the same manager before is harder to rattle; the sender is banned for the next match: no talks with their players, no team talk,
// no half-time talk, no trash talk (the plan is set as usual).
const TRASH=[
  {txt:'Hope you are ready for the big stage: everyone will be watching.',at:'team',kind:'pressure',
   fx:{worrier:'nervous',pleaser:'nervous',loner:'sad',showoff:'happy'}},
  {txt:'Relax. Nobody expects anything from you.',at:'team',kind:'dismissal',
   fx:{fighter:'sad',veteran:'angry',easygoing:'sad',worrier:'cool'}},
  {txt:'We have watched your matches. We laughed.',at:'team',kind:'mockery',
   fx:{showoff:'sad',hothead:'angry',joker:'sad',fighter:'angry'}},
];
const TRASH_REACH={team:0.7,star:0.95,others:0.3},TRASH_FIRE=0.28;   // firing up about two times in ten (0.4 until 23 Nov 2026: the four lines lost about 0.1 of a win per use; now a random line now and then is even over a season, +0.1 +-0.35)   // a line at the team reaches each named player seven times in ten (an opponent's words land
// at 70% of the coach's own, Alex); a line at the star reaches the star almost surely and the others three times in ten
const trashGood=(m,t)=>m==='happy'||m==='cool'||(m==='angry'&&t==='fighter');   // fired up; sad, nervous and (for all but fighters) angry are rattled
const trashMood=(l,p)=>l.fx?(l.fx[p.temp]||null):(l.tone==='calm'&&p.temp==='hothead'&&p.mood!=='angry')?'angry':(TEMPS[p.temp]&&TEMPS[p.temp].r[l.tone]?TEMPS[p.temp].r[l.tone][1]:null);   // as replyTo: "calm down" to a hot-tempered player who is not fuming makes him fume (a new reader of the help found the line did the opposite, 23 Nov 2026)
// apply one trash line to a team; `heard` = how often this team has heard that manager before. Returns who was rattled and who was fired up.
function trashTeam(team,line,starId,heard){
  const rattled=[],fired=[];const l=TRASH[line];if(!l)return {rattled,fired};
  // only the players named for the match hear it (Harry, 22 Nov 2026: it used to land on players who did not even play)
  const named=new Set([...(team.starters||[]),...(team.subs||[])]);const ps=named.size?team.players.filter(p=>named.has(p.id)):team.players;
  for(const p of ps){
    const mood=trashMood(l,p);if(!mood||mood==='ok'||p.mood===mood)continue;
    const up=trashGood(mood,p.temp),isStar=p.id===starId;
    const reach=l.at==='star'?(isStar?TRASH_REACH.star:TRASH_REACH.others):TRASH_REACH.team;
    // an opponent's words rattle more easily than they inspire: firing up 0.4 as often as rattling (23 Nov 2026, measured over
    // whole leagues with the ban: a random line now and then comes out even over a season; the protection for well-run
    // teams of 22 Nov is not needed with tones and the ban, and made every line a loss)
    const chance=Math.min(0.95,(up?reach*TRASH_FIRE:reach/(1+(heard||0)))*ageImp(p));   // the young are moved more, the old less   // a team that has heard it before is harder to rattle
    if(R()>=chance)continue;
    p.mood=mood;(up?fired:rattled).push(p.n);
  }
  return {rattled,fired};
}
const TALK_REACH=0.45;   // chance that a player is moved by the half-time talk (a short moment in a locker room; 0.6 made "be honest" worth +5 points when close)
const TALK_LIFT=[0,0.02,0.008];   // shot quality for the rest of the match, by sharpness (0.03 made "be honest" worth +5 points of win chance when close: too much of a default)
const ORDER_KEYS=['behind','close','ahead'];
const ORDER_MARGIN=8;   // behind or ahead from this many points on (5 with the ten-minute match, Harry, 9 Nov 2026; 8 since the twenty-minute match, 14 Nov 2026); anything less than that apart is "close"
// A match is twenty minutes of three-on-three: about 38 possessions a side (30 slow, 46 fast), twice the ten-minute
// match of before (Harry, 14 Nov 2026: scores were too small for the friends). In-match tiring per possession is halved
// to keep a whole match worth the same.
const POSS=[30,38,46],POSS_SCALE=0.5;
// Comebacks (Harry, 19 Nov 2026: "around 15-20%", for a really good team whose manager gives good orders). A team behind
// at half-time plays the second half with urgency while it is still behind, if its manager left an order for that case
// (not "slow", which gives up the chase), worth more the better its players are than the leader's. A team ahead at
// half-time eases off while it is still ahead, half as much if its manager left an order to keep it busy. Before this,
// 5% of teams behind by 8+ won; now about 14%, 21% from 8-11 down, 25-30% for a stronger team with a fitting order.
const CB={ease:0.06,push:0.14};
const orderOf=k=>ORDERS.find(o=>o.k===k);
// From 17 to 18 Nov 2026 the half-time card took up to two changes per case, {ch:{dial:value},free,star,talk}; Harry's friends
// found it too complicated, so it is one order per case again. An order saved in that format becomes one order: the player
// named for everything through, else the first dial change that is one of the orders (press, zone, slow, fast, outside).
const HALF_DIAL={press:['def',2],zone:['def',1],slow:['tempo',0],fast:['tempo',2],outside:['shots',2]};
const oneOrder=x=>{if(!x||typeof x!=='object'||x.k!==undefined||(x.ch===undefined&&x.star===undefined&&x.free===undefined))return x;
  const talk=x.talk||null;if(x.star!=null)return {k:'star',pid:x.star,talk};
  const ch=x.ch&&typeof x.ch==='object'?x.ch:{};for(const k of Object.keys(HALF_DIAL))if(ch[HALF_DIAL[k][0]]===HALF_DIAL[k][1])return {k,talk};
  return talk?{k:null,talk}:null;};
// orders as stored on a team: {behind:{k,pid}|null, close:..., ahead:...}; anything unknown is dropped
// The double team is a bet, not a wall (Harry, 17-18 Nov 2026): on every doubled shot the star may beat it. A star in good
// condition (attack dots most, a little speed; buzzing or locked in; fresh) and clearly better than the two who double him
// (the two best defenders on the court: their defence dots, tiredness and moods) beats it more often. There is no order
// for it: it just happens, or not.
const BEAT={base:0.43,sh:0.18,sp:0.05,fit:0.30,mood:{happy:0.15,cool:0.12,ok:0,nervous:-0.12,sad:-0.15,angry:0},
  df:0.12,dfit:0.25,dmood:{happy:-0.03,cool:-0.06,ok:0,nervous:0.05,sad:0.05,angry:0.03}};   // base 0.34 in the ten-minute match; the twenty-minute match doubles the doubled shots, so the star beats it more often here
const stateBonus=(T,p)=>(T.mood[p.mood]||0)+(p.temp==='fighter'&&p.mood==='angry'?0.12:0);
const dblPair=D=>[...D.court].sort((a,b)=>b.df-a.df).slice(0,2);
const dblHold=D=>{const d=D?dblPair(D):[];if(!d.length)return 0;
  return d.reduce((s,q)=>s+BEAT.df*nrm(q.df)-BEAT.dfit*((D.st&&D.st[q.id]?D.st[q.id].f:0.3*tiredOf(q)))-(BEAT.dmood[q.mood]||0),0)/d.length;};
const beatChance=(p,f,D)=>clamp(BEAT.base+stateBonus(BEAT,p)+BEAT.sh*nrm(p.sh)+BEAT.sp*nrm(p.sp)-BEAT.fit*(f||0)-dblHold(D),0.05,0.8);
function cleanOrders(team,rule){
  const o=team.orders&&typeof team.orders==='object'?team.orders:{};const out={};
  for(const w of ORDER_KEYS){const x=oneOrder(o[w]);const talk=x&&TONES.includes(x.talk)?x.talk:null;
    if(!x||!orderOf(x.k)){out[w]=talk?{k:null,talk}:null;continue;}
    if(x.k==='star'){const p=byId(team,x.pid);if(!p||(rule==='tall_out'&&tallestId(team)===p.id)){out[w]=talk?{k:null,talk}:null;continue;}out[w]={k:'star',pid:p.id,talk};}
    else out[w]={k:x.k,talk};}
  team.orders=out;return out;
}
const orderWords=(o,team)=>!o||!o.k?'':orderOf(o.k).txt+(o.k==='star'&&team&&byId(team,o.pid)?' ('+byId(team,o.pid).n+')':'');

// ───────────────────────── players & teams ─────────────────────────
const COLS=['#ff7aa8','#6ec6ff','#f4a259','#ef6f6c','#8ce99a','#b197fc','#63e6be','#ffd43b','#74c0fc','#a9e34b','#da77f2','#ffa8a8','#66d9e8','#ff8787','#ffc078','#96f2d7',
  '#f6c9a0','#e0a878','#c68642','#9c6b43','#7a5236','#d0bfff','#b2f2bb','#ffe3a3','#c5d0e6','#f1aeb5','#9bd4c8','#e8d5b0'];   // the last twelve (skin and pastel tones) came with the players update of the Winter League 2026/27
const TOPS=['bun','band','cap','horns','antenna','mohawk','tuft','propeller','cone','duck','sprout','crown','pan',
  'afro','spikes','ponytail','flat','beanie','curls','visor','bald','bow','feather','sidepart'];
const SHAPES=['pill','pill','pear','bean'];
// Looks that came with the players update: hair colour, beard, glasses, sweatbands, socks, shoes, cheeks. Numbers into
// these lists are kept with the player; the page draws them (toon in index.html).
const HAIRS=['#2b2233','#5c3a21','#a0522d','#e8b04a','#d9480f','#f1f3f5','#ff6fb5','#3bc9db'];
const BEARDS=['none','moustache','goatee','beard','stubble'];
const SPECS=['none','glasses','shades','goggles'];
const ACCS=['none','headband','wristbands','both'];
const SOCKS=['none','short','high','striped'];
const SHOES=['#ffffff','#2b2233','#ff6b6b','#ffd43b','#4dabf7','#69db7c'];
const CHEEKS=['none','freckles','blush','plaster','mole'];
// Body types (Harry, 12 Nov 2026): four heights by three builds, drawn so that they can be seen, and they matter.
//   height (`ht`): tall players tire faster and tend to be slow, tiny ones tire slower and tend to be quick
//   build (`bd`): fat players tire faster but rebound better and are tougher to score on close to the hoop; slim ones tire slower
// `h` (0..1, used by every height rule of the match) and `bulk` (0..1, the drawing) follow from them.
// Players from before the update have no `ht`/`bd`: for them nothing changes (TIRE 1, no fat rules).
const HEIGHTS=['tiny','medium','tall','very tall'],BUILDS=['slim','normal','fat'];
const HT_ODDS=[0.2,0.35,0.3,0.15],BD_ODDS=[0.3,0.45,0.25];
const HT_H=[0.08,0.38,0.68,0.94],BD_BULK=[0.08,0.5,0.95];
// Set against real basketball (12 Nov 2026): bigs are 6-12% taller and 17-25% heavier than guards, have a 21-26% lower
// aerobic capacity and slower repeated sprints, and play about a quarter fewer minutes (EuroLeague centres ~21 of 40,
// guards ~28); guards cover almost twice the high-intensity distance. So a typical big tires about a quarter faster than
// a typical guard, the extremes (very tall and fat against tiny and slim) not quite twice as fast; the height-speed link
// is a tendency of a dot, weight slows a little as well; height and weight both win rebounds.
const SP_SHIFT=[0.6,0,0.3,0.6],BD_SP=[0.2,0,0.4];   // chance that the body moves the speed by a dot: tiny and slim up, tall, very tall and fat down
const TIRE_HT=[0.9,1,1.1,1.2],TIRE_BD=[0.9,1,1.2];   // how fast a body tires, in a match and from match to match: 0.81 (tiny, slim) to 1.44 (very tall, fat)
const FAT={reb:0.5,team:0.03,inside:0.04};
const TALL3=[0,0,0.03,0.06];   // what a long shot loses by height: real centres shoot worse from range than guards (Harry, 12 Nov 2026)
const tall3=p=>p.ht===undefined?0:TALL3[p.ht];
// Range (Harry, 19 Nov 2026): a touch from outside that a player is born with or not, hidden; found out from the 3s in the
// box scores. Most small players have it, few tall ones, very few very tall ones, so a giant who scores from outside is
// rare and a real find. With range a long shot is a little better whatever the height; without it the tall shoot worse
// and the very tall much worse. It does not change a player's value. Players from before it (no `rg`) keep TALL3.
const RANGE_ODDS=[0.6,0.4,0.15,0.05],RANGE={yes:0.03,no:[0,0,0.04,0.08]};
const range3=p=>p.ht===undefined?-tall3(p):p.rg===undefined?-tall3(p):p.rg?RANGE.yes:-RANGE.no[p.ht];   // what height and range add to a long shot
// ───────────────────────── the wage cap ─────────────────────────
// Every team has the same cap (Harry, 12 Nov 2026). A player's value comes from the dots they were drafted with (attack
// most, then defence, then speed), their height and build, and a little from character; never from mood or form. The
// cap binds every time a squad changes: the draft, the one change between leagues, the mid-season window. The lower half
// of a table gets a little extra room for the next league. Values are shown as millions.
const CAP=125,CAP_WINDOW=125,CAP_BONUS=8;   // the same line at the windows (Harry, 13 Nov 2026: "make the market cap 125M");   // measured 12 Nov 2026: at 125 the free best seven of a pool fit in 3% of pools and a drafter gives up about one good player's worth to fit; at 130 it was 11% and little sacrifice (Harry: too easy);   // seven average players are worth about 122: the draft cap leaves room for one dear player, not for seven; at the two windows (between leagues, mid-season) the cap is tighter, so a change is a trade (Harry, 12 Nov 2026)
const CHAR_VALUE={veteran:1,easygoing:0.5,hothead:-1,worrier:-0.5};
// the balance knobs: see the comment above `DOT` further down
const BAL={mood:0.45,trust:0.04,neglect:0.3,talkStat:0.45,dot:2.5,tempoFit:0.2,starFit:0.25,three:0.24,fastTire:0.001,setPlay:0.03,zone:0.025,shadow:0.04,speedBy:[0,0.3,1],spPrice:0.9,priceK:1.98};   // speedBy: the speed edge by tempo (slow, steady, fast); spPrice, priceK: the price of a dot of speed and the price scale   // shadow: a cost on every shot under a shadow (the stopper's dots count more since dot 2.5)   // setPlay: a flat edge for set plays when they are run
// speed is priced closer to the other dots (Harry, 24 Nov 2026: at 0.6 a slow squad bought more attack and defence for the same
// money and slow squads playing slow were the strongest teams in 1000 simulated leagues); x1.98 keeps the average price as it was
function valueOf(p){const b=p.base||p;const dots=(b.sh||p.sh)*1.2+(b.df||p.df)+(b.sp||p.sp)*BAL.spPrice;
  return Math.max(6,Math.round(dots*BAL.priceK+p.h*4+(p.bd===2?1:0)+(CHAR_VALUE[p.temp]||0)));}
const squadValue=ps=>(ps||[]).reduce((s,p)=>s+valueOf(p),0);
const money=v=>'$'+v+'M';
const capOf=(d,window)=>(window?CAP_WINDOW:CAP)+((d&&d.capBonus)||0);   // a fat player: weight in who takes a rebound, the side's chance of a second shot per fat player more on the court, and what a close shot loses against them
const bodyOf=p=>p.ht===undefined||p.bd===undefined?null:{ht:p.ht,bd:p.bd};
const tireOf=p=>{const b=bodyOf(p);return b?TIRE_HT[b.ht]*TIRE_BD[b.bd]:1;};
const isFat=p=>p.bd===2&&p.ht!==undefined;
const bodyWords=p=>{const b=bodyOf(p);return b?HEIGHTS[b.ht]+(b.bd===1?'':' and '+BUILDS[b.bd]):'';};
const odds=a=>{let x=R();for(let i=0;i<a.length;i++){x-=a[i];if(x<=0)return i;}return a.length-1;};
// Team kits: two colours and a badge, chosen by the manager (a team without one gets a kit from its name).
const KIT_COLS=['#e03131','#f76707','#f59f00','#ffd43b','#74b816','#2f9e44','#0ca678','#1098ad','#1c7ed6','#3b5bdb','#7048e8','#ae3ec9','#d6336c','#f783ac','#ffffff','#ced4da','#495057','#212529','#7f5539','#0b3d91'];
const BADGES=['🦉','🦁','🔥','🏀','🐺','🦅','🐻','🐝','🦈','🐉','⚡','⭐','🌵','🍕','🚀','👑','🐙','🦊','🐸','🌙','💀','🐢','🦄','🍩'];
function cleanKit(k){if(!k||typeof k!=='object')return null;const a=k.a,b=k.b,g=k.g;
  if(!Number.isInteger(a)||!Number.isInteger(b)||!Number.isInteger(g)||a<0||b<0||g<0||a>=KIT_COLS.length||b>=KIT_COLS.length||g>=BADGES.length||a===b)return null;return {a,b,g};}
function nameKit(name){let x=7;for(const ch of String(name||''))x=(x*31+ch.codePointAt(0))%1000003;const a=x%KIT_COLS.length;let b=Math.floor(x/20)%KIT_COLS.length;if(b===a)b=(b+7)%KIT_COLS.length;return {a,b,g:Math.floor(x/400)%BADGES.length};}
const kitOf=(kit,name)=>cleanKit(kit)||nameKit(name);
const randomKit=()=>{const a=Math.floor(R()*KIT_COLS.length);let b=Math.floor(R()*KIT_COLS.length);if(b===a)b=(b+1)%KIT_COLS.length;return {a,b,g:Math.floor(R()*BADGES.length)};};
let NEXT_ID=1;
const LOOKS=['col','top','shape','hair','beard','specs','acc','socks','shoe','cheek','num','ph','eye','teeth'];
function newLooks(p){const f=makePlayer0();usedNames.delete(f.n);for(const k of LOOKS)p[k]=f[k];}   // a fresh face and outfit, nothing else changes
function makePlayer(){const q=makePlayer0();quirks(q);if(q.ht===3&&q.bd===2&&R()<INJ.toughOdds)q.tough=true;else if(R()<INJ.frailOdds)q.frail=true;return q;}   // a rare very tall, fat body that seldom breaks; one player in ten whose body breaks easily (both hidden; never both)
// Age (Harry, 23 Nov 2026): every new player is born with one, mostly 21-29, a few young ones and veterans. One year is a whole
// season of four leagues (Winter, Spring, Summer, Autumn): everybody turns a year older at the start of each Winter League.
// What age does (young players improve, older ones slow down, careers end) comes before the Spring League.
const AGE_ODDS=[[18,1],[19,2],[20,3],[21,5],[22,6],[23,7],[24,7],[25,7],[26,7],[27,6],[28,6],[29,5],[30,4],[31,3],[32,2],[33,1.5],[34,1]];
// What age does (Harry, 23 Nov 2026, in the Winter League; tuned by simulated leagues):
//  - impressionability `ageImp`: talks, team and half-time talks and trash talk move young players more and older ones less
//  - recovery `ageRec`: younger players get their energy back more easily, older ones more slowly
//  - speed: older players are born with less speed more often, and lose a little each Winter (the birthday)
const AGE_FX={imp:0.04,impMin:0.65,impMax:1.3,rec:0.02,recMin:0.9,recMax:1.2,spFrom:28,spBirth:0.12,spYear:0.08};
const ageImp=p=>p&&p.age?clamp(1+AGE_FX.imp*(25-p.age),AGE_FX.impMin,AGE_FX.impMax):1;
const ageRec=p=>p&&p.age?clamp(1+AGE_FX.rec*(25-p.age),AGE_FX.recMin,AGE_FX.recMax):1;   // the young get their energy back more easily (Harry, 23 Nov 2026)
function birthday(p){if(!p.age)return;p.age++;   // a year older; from 29 on a growing chance of half a dot less speed (on the base, talks and form stay)
  if(p.age>AGE_FX.spFrom&&R()<AGE_FX.spYear*(p.age-AGE_FX.spFrom)){p.base=p.base||{};if(p.base.sp===undefined)p.base.sp=p.sp;
    p.base.sp=Math.max(1,p.base.sp-0.5);const t=(p.tk&&p.tk.sp)||0,f=(p.fm&&p.fm.sp)||0;p.sp=clamp(clamp(p.base.sp+t+f,p.base.sp-STAT_BAND,p.base.sp+STAT_BAND),1,4);}}
// old hands have seen it all because they have been around: most are over 30, a few 27 to 29 (Harry, 23 Nov 2026)
const AGE_ODDS_OLDHAND=[[27,1],[28,1.5],[29,2],[30,3],[31,3],[32,3],[33,2.5],[34,2]];
const newAge=temp=>{const T=temp==='veteran'?AGE_ODDS_OLDHAND:AGE_ODDS;let x=R()*T.reduce((s,a)=>s+a[1],0);for(const [a,w] of T){x-=w;if(x<=0)return a;}return 25;};
function makePlayer0(){
  const temp=pick(TEMPKEYS);const ht=odds(HT_ODDS),bd=odds(BD_ODDS);
  const h=clamp(HT_H[ht]+(R()-0.5)*0.1,0,1),d4=()=>1+Math.floor(R()*4);
  // speed follows the height as a tendency, not a rule: after the dots are drawn, a tiny player usually gains a dot of
  // speed, a very tall one usually loses one, a tall one sometimes. A quick tall player exists, but is rare.
  let sh,df,sp,tries=0;do{sh=d4();df=d4();sp=d4();tries++;}while((sh+df+sp<6||sh+df+sp>9)&&tries<50);
  if(R()<SP_SHIFT[ht])sp=clamp(sp+(ht===0?1:-1),1,4);if(R()<BD_SP[bd])sp=clamp(sp+(bd===0?1:-1),1,4);
  const age=newAge(temp);if(age>AGE_FX.spFrom&&R()<AGE_FX.spBirth*(age-AGE_FX.spFrom))sp=clamp(sp-1,1,4);   // the years take the speed first
  return {id:NEXT_ID++,n:makeName(),age,temp,ht,bd,h,bulk:clamp(BD_BULK[bd]+(R()-0.5)*0.12,0,1),col:pick(COLS),top:pick(TOPS),shape:pick(SHAPES),num:1+Math.floor(R()*98),
    hair:Math.floor(R()*HAIRS.length),beard:R()<0.62?0:1+Math.floor(R()*(BEARDS.length-1)),specs:R()<0.72?0:1+Math.floor(R()*(SPECS.length-1)),acc:R()<0.5?0:1+Math.floor(R()*(ACCS.length-1)),
    socks:Math.floor(R()*SOCKS.length),shoe:Math.floor(R()*SHOES.length),cheek:R()<0.55?0:1+Math.floor(R()*(CHEEKS.length-1)),
    sh,df,sp,rg:R()<RANGE_ODDS[ht],base:{sh,df,sp},tk:{sh:0,df:0,sp:0},fm:{sh:0,df:0,sp:0},mood:'ok',trust:0,talked:false,ph:R()*10,eye:R()*0.3-0.15,teeth:R()<0.35,x:null,tr:{sh:0,df:0,sp:0},idle:0,notes:{},en:4};
}
const rating=p=>p.sh*1.2+p.df+p.sp*0.6+p.h*1.5;
// Energy runs from 4 (fresh) down to 1 (worn out). Playing costs it, a match off gives it back.
const energyOf=p=>p.en===undefined?4:p.en;
// The table in the season leagues (Harry, 26 Nov 2026), as in the NBA: wins, losses, winning percentage (PCT) and games behind
// (GB), ranked by PCT. A team that has played fewer than half the regular season (13 of 26 in the Winter League) is ranked after
// the teams that have, so a hot late start cannot take a play-off place; while nobody has played that many, the bar is the most
// matches anyone has played, so nobody is held back while all are level. Ties: head-to-head (when the results are given), wins,
// +/-, points scored. League 1 keeps its points table to the end.
const PO_MIN_SHARE=0.5;
const pctOf=t=>((t.w||0)+(t.l||0))?(t.w||0)/((t.w||0)+(t.l||0)):0;
function tableNeed(ts,reg){const most=Math.max(0,...ts.map(t=>(t.w||0)+(t.l||0)));return Math.min(Math.ceil((reg||0)*PO_MIN_SHARE)||most,most);}
function rankTeams(ts,reg,results){
  const need=tableNeed(ts,reg),short=t=>((t.w||0)+(t.l||0))<need?1:0;
  const s=[...ts].sort((a,b)=>short(a)-short(b)||pctOf(b)-pctOf(a));const out=[];
  for(let i=0;i<s.length;){let j=i;while(j<s.length&&short(s[j])===short(s[i])&&Math.abs(pctOf(s[j])-pctOf(s[i]))<1e-9)j++;const g=s.slice(i,j);
    if(g.length>1){const w=new Map();
      if(results){const ids=new Set(g.map(t=>t.id));for(const m of results)if(ids.has(m.a)&&ids.has(m.b)){const x=m.score_a>m.score_b?m.a:m.b;w.set(x,(w.get(x)||0)+1);}}
      g.sort((a,b)=>(w.get(b.id)||0)-(w.get(a.id)||0)||(b.w||0)-(a.w||0)||((b.pf||0)-(b.pa||0))-((a.pf||0)-(a.pa||0))||(b.pf||0)-(a.pf||0)||(a.name<b.name?-1:1));}
    out.push(...g);i=j;}
  return out;}
const gamesBehind=(t,lead)=>lead?(((lead.w||0)-(t.w||0))+((t.l||0)-(lead.l||0)))/2:0;
const pctText=t=>{const g=(t.w||0)+(t.l||0);if(!g)return '.000';const p=pctOf(t);return p>=1?'1.000':p.toFixed(3).replace(/^0/,'');};
const tiredOf=p=>(4-energyOf(p))/3;      // 0 = fresh, 1 = worn out
const ENERGY={COST:1.0,REST:1.5,PART_REST:0.5,NIGHT:0.3};   // a whole match played; a whole match off; the bench time of someone who played part of it; what everybody gets back between two match days whatever they did (Harry, 14 Nov 2026: three matches a week left too many at two dots)
const STATNAME={sh:'attack',df:'defence',sp:'speed'};
const nrm=v=>(v-2.5)/1.5; // a stat of 1..4 as -1..1
// nudge a stat; returns +1/-1 when a whole dot is gained or lost
// A stat = the player's natural level (`base`, the dots they were drafted with) + what talks have done (`tk`, stays
// until another talk moves it) + match form (`fm`, fades by FORM_FADE a week, as a hot or cold game does in real
// basketball: skill does not change from one game to the next, only form), all within STAT_BAND of the base.
// Players from before 9 Nov 2026 get their base the first time a stat moves.
const STAT_BAND=0.5,FORM_FADE=0.3;
function bump(p,k,d,kind){
  p.base=p.base||{};if(p.base[k]===undefined)p.base[k]=p[k];p.tk=p.tk||{};p.fm=p.fm||{};if(p.tk[k]===undefined)p.tk[k]=0;if(p.fm[k]===undefined)p.fm[k]=0;
  if(kind==='talk')p.tk[k]=clamp(p.tk[k]+d,-STAT_BAND,STAT_BAND);else p.fm[k]=clamp(p.fm[k]+d,-STAT_BAND,STAT_BAND);
  const before=Math.round(p[k]);p[k]=clamp(clamp(p.base[k]+p.tk[k]+p.fm[k],p.base[k]-STAT_BAND,p.base[k]+STAT_BAND),1,4);p.tr[k]+=d;const after=Math.round(p[k]);return after>before?1:after<before?-1:0;}
// match form fades a little every week; the talks' part stays
function fadeForm(p){if(!p.fm||!p.base)return;for(const k of ['sh','df','sp']){if(!p.fm[k])continue;p.fm[k]*=1-FORM_FADE;if(Math.abs(p.fm[k])<0.01)p.fm[k]=0;p[k]=clamp(clamp(p.base[k]+(p.tk&&p.tk[k]||0)+p.fm[k],p.base[k]-STAT_BAND,p.base[k]+STAT_BAND),1,4);}}
function makeTeam(name,players,human){return {name,players,kit:randomKit(),starters:[],subs:[],ball:null,sheet:{tempo:1,shots:1,def:0,off:0,guard:0,boards:1},w:0,l:0,pf:0,pa:0,human:!!human,skill:0.25+0.75*R(),style:{tempo:Math.floor(R()*3),shots:Math.floor(R()*3),def:Math.floor(R()*3),off:Math.floor(R()*3),guard:Math.floor(R()*3),boards:Math.floor(R()*3)},lastSheet:null,lastDay:''};}
const byId=(team,id)=>team.players.find(p=>p.id===id);
// ───────────────────────── playing time ─────────────────────────
// A manager may give each of the five named players a share of the match in quarters (none, a quarter, a half, three
// quarters, the whole match), twelve quarters in all since three are on the court the whole time, and the coach rotates
// to those shares; who goes in and out when is the computer's. Kept as minutes of 40 in steps of 10. Without a plan
// the bench works as described in `subs` (idea of a friend of Harry's, 12 Nov 2026; quarters: Harry, same day).
const MINS={game:40,total:120,step:10};
function cleanMins(team){const m=team.mins;if(!m||typeof m!=='object'){team.mins=null;return null;}
  const ids=[...(team.starters||[]),...(team.subs||[])];if(ids.length!==5){team.mins=null;return null;}
  const out={};let sum=0;for(const id of ids){const v=m[id];if(!Number.isInteger(v)||v<0||v>MINS.game||v%MINS.step){team.mins=null;return null;}out[id]=v;sum+=v;}
  if(sum!==MINS.total){team.mins=null;return null;}team.mins=out;return out;}
function tallestId(team){return team.players.reduce((a,b)=>a.h>b.h?a:b).id;}
function enforceRule(team,rule){
  if(rule==='tall_out'){const t=tallestId(team);team.starters=team.starters.filter(id=>id!==t);team.subs=team.subs.filter(id=>id!==t);if(team.ball===t)team.ball=null;}
  team.starters=team.starters.filter(id=>byId(team,id));
  team.subs=team.subs.filter(id=>byId(team,id)&&!team.starters.includes(id)).slice(0,2);
  cleanOrders(team,rule);cleanMins(team);
  if(team.ball&&!team.starters.includes(team.ball))team.ball=null;
}
function weekReset(team,first){for(const p of team.players){p.talked=false;p.lastRes='';if(!first)fadeForm(p);if(!first&&R()<0.3&&p.mood!=='ok'&&!p.ignored)p.mood='ok';}team.teamTalked=false;}

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
  team.orders={behind:wise()?{k:pick(['press','fast','outside']),talk:wise()?pick(['honest','challenge','demand']):null}:null,close:wise()&&R()<0.4?{k:null,talk:'honest'}:null,ahead:wise()&&R()<0.6?{k:'slow',talk:null}:null};
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
function obey(p){return clamp(MOODFX[p.mood][2]+BAL.trust*p.trust,0.2,1);}
// how much the dots weigh in a shot, against moods, energy and tactics: attack on long shots, attack on close shots, height, defence.
// All 1 in the first release: the squad then explained ~2% of a season and the manager ~65% (season simulator, 9 Nov 2026).
const DOT={sh3:1.6,sh2:3,h:2.5,df:2.5};
// The balance knobs (24 Nov 2026, Harry: tactics that fit the squad, talks about a quarter of the results, the draft and the
// transfers mattering more).
//  mood: how much a mood moves a shot (shooter and defender, the star's mood under star ball, the tempo by mood)
//  trust: how much trust moves obedience; neglect: trust lost per match by an ignored player; talkStat: the stat lift of a talk
//  dot: how much a dot of shooting, defence and height moves a shot (the draft and the transfers)
//  tempoFit: fast tempo pays for the quicker team and costs the slower one (slow tempo the other way round)
//  starFit: star ball pays by how much better the star shoots than his teammates; three: the base of a long shot
// Before (until 24 Nov 2026): {mood:1,trust:0.08,neglect:1,talkStat:1,dot:1,tempoFit:0,starFit:0,three:0.33,fastTire:0.009,setPlay:0,zone:0}:
// talks explained 45% of the differences between teams and the draft 2%; slow tempo, sharing and shooting from outside were best for
// everyone. Tuned in 5 rounds of 160 leagues (3nD-tests/localseason/tune.sh), then proved over 1000 leagues (grand_study.js).
const PRESS_MID={h:0.5,sp:0,tired:0.15};
// one of a list, by weight (weights below zero count as zero)
function wpick(arr,f){const w=arr.map(p=>Math.max(0,f(p)));let x=R()*w.reduce((s,v)=>s+v,0);for(let i=0;i<arr.length;i++){x-=w[i];if(x<=0)return arr[i];}return arr[arr.length-1];}
// The box score of one side after a match: a row per player who was named or played, starters first.
// [id, name, possessions on the court, points, shots made, shots taken, threes made, threes taken, rebounds, steals,
// ball losses, shots guarded, shots allowed]. "Stops" on the page = guarded - allowed. About 60 bytes a player.
function boxOf(X){
  const T=X.T,named=[...(T.starters||[]),...(T.subs||[])].map(id=>byId(T,id)).filter(Boolean);
  const extra=T.players.filter(p=>!named.includes(p)&&X.st[p.id]&&X.st[p.id].min>0);
  return [...named,...extra].map(p=>{const s=X.st[p.id];return s?[p.id,p.n,s.min,s.pts,s.fgm,s.fga,s.m3,s.a3,s.reb,s.stl,s.to,s.dg,s.da]:null;}).filter(Boolean);
}   // an average ball handler: height, speed (as -1..1) and tiredness
function playMatch(A,B,ruleKey){
  const rule=ruleKey;
  const mk=T=>{
    let avail=T.players.filter(p=>!(p.inj>0));if(avail.length<3)avail=[...avail,...T.players.filter(p=>p.inj>0).sort((a,b)=>a.inj-b.inj).slice(0,3-avail.length)];   // never fewer than three: the least hurt playif(rule==='tall_out'){const t=tallestId(T);avail=avail.filter(p=>p.id!==t);}
    const court=T.starters.map(id=>avail.find(p=>p.id===id)).filter(Boolean);
    // a manager who named nobody is punished: the three weakest players start (a line-up cut short by the rule of the
    // week is still filled with the best of the rest)
    const noLineup=!(T.starters||[]).length;
    const rest=avail.filter(p=>!court.includes(p)).sort((a,b)=>noLineup?rating(a)-rating(b):rating(b)-rating(a));
    while(court.length<3&&rest.length)court.push(rest.shift());
    const bench=(T.subs||[]).map(id=>avail.find(p=>p.id===id)).filter(p=>p&&!court.includes(p)).slice(0,2);
    // an injury among the named players: the bench is filled back up to the substitutes the manager named, with the best left
    if([...(T.starters||[]),...(T.subs||[])].some(id=>{const p=T.players.find(q=>q.id===id);return p&&p.inj>0;})){
      const want=Math.min(2,(T.subs||[]).length);for(const p of avail.filter(p=>!court.includes(p)&&!bench.includes(p)).sort((a,b)=>rating(b)-rating(a))){if(bench.length>=want)break;bench.push(p);}}
    const st={};for(const p of avail)st[p.id]={pts:0,fga:0,fgm:0,a3:0,m3:0,to:0,free:0,bonus:0,bench:!court.includes(p),f:0.3*tiredOf(p),min:0,dbl:0,dblM:0,shad:0,shadM:0,reb:0,stl:0,dg:0,da:0};
    // the playing-time plan, as shares of the match, when it is whole and the rules allow substitutions
    const plan=(!noLineup&&rule!=='iron'&&rule!=='first11'&&court.length===3&&court.every(p=>T.starters.includes(p.id))&&bench.length===2&&cleanMins(T))?Object.fromEntries([...court,...bench].map(p=>[p.id,T.mins[p.id]/MINS.game])):null;
    const head=rule==='underdog'?(T.head||0):0;   // Underdog week: the lower team starts with points (set by the caller from the table)
    return {T,court,bench,st,noLineup,sheet:{...T.sheet},ball:T.ball,half:null,lift:0,score:head,steals:0,oreb:0,fast:0,rb:head,openA:0,openM:0,playQ:0,playN:0,plan,planOff:false};
  };
  const a=mk(A),b=mk(B);
  let P=rule==='first11'?60:Math.round((POSS[A.sheet.tempo]+POSS[B.sheet.tempo])/2);
  const half=rule==='first11'?-1:Math.floor(P/2);
  const noRun=rule==='no_dribble'||rule==='tiny_court';
  const hMul=rule==='tiny_court'?3.5:rule==='paint'?1.8:1;
  const aMul=rule==='attack'?2:1,dMul=rule==='attack'?0.5:rule==='defence'?2:1,sMul=rule==='speed'?2:1;
  const avg=(arr,f)=>arr.reduce((s,p)=>s+f(p),0)/arr.length;
  const rawObey=p=>MOODFX[p.mood][2]+BAL.trust*p.trust;
  const stopperOf=X=>[...X.court].sort((p,q)=>q.df-p.df)[0];
  function possession(O,D,late,second){
    const os=O.sheet,ds=D.sheet;
    const star=O.court.find(p=>p.id===O.ball)||null;
    const focus=star&&os.off===1?star:[...O.court].sort((p,q)=>q.sh-p.sh)[0]; // the one the defence worries about: the star when the team plays star ball, else its best shooter (Harry, 19 Nov 2026: a weak player named star as a decoy drew the double)
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
    if(R()<pTO){sst.to++;if(ds.def===2||rule==='defence'){D.steals++;const thief=D.st[wpick(D.court,d=>d.df+(d.mood==='angry'?1.5:0)+(d.mood==='sad'?-0.8:0)).id];thief.stl++;if(rule==='defence'){D.score++;D.rb++;thief.pts++;}}return;}
    let q=(O.lift||0)+swing(O,D);if(ds.def===2)q+=0.035+0.012*D.court.filter(d=>d.mood==='sad').length; // broke the press
    if(os.tempo===0)q+=m==='nervous'?0.04:-0.015; // a slow attack meets a set defence
    if(os.tempo===2)q+=BAL.mood*(m==='happy'?0.03:m==='sad'?-0.06:0);
    // how the attack is run
    if(hog)q-=(rule==='no_dribble'?0.16:0.08);
    else if(os.off===0)q+=0.03;
    else if(os.off===2){const pq=BAL.setPlay+clamp(0.7*(avg(O.court,rawObey)-0.93),-0.15,0.09)+(os.tempo===2?-0.04:os.tempo===0?0.02:0)-(ds.def===2?0.05:0);q+=pq;O.playQ+=pq;O.playN++;}
    else if(shooter===star){const rest=O.court.filter(p=>p!==star);q+=0.02+BAL.mood*(m==='happy'||m==='cool'?0.08:m==='nervous'?-0.11:m==='sad'?-0.09:m==='angry'&&shooter.temp!=='fighter'?-0.06:0)+(rest.length?BAL.starFit*(star.sh-avg(rest,p=>p.sh)):0);}   // star ball pays by how much better the star shoots
    else q+=0.03;
    // fast break
    let forceInside=false;
    const spAdv=avg(O.court,p=>p.sp-tiredOf(p))-avg(D.court,p=>p.sp-tiredOf(p));   // tired legs do not run
    q+=BAL.tempoFit*(avg(O.court,p=>p.sp)-avg(D.court,p=>p.sp))*BAL.speedBy[os.tempo];   // on the speed dots: tiredness already costs shots, balls and fast breaks   // being quicker always helps: a fast game makes the most of it, a steady one part, a slow one keeps a quicker opponent's edge small (24 Nov 2026; until then a slow game rewarded being slow and speed was worth nothing in itself)
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
    const three=!forceInside&&R()<[0.15,0.4,0.65][os.shots]+(shooter.sh>=3.5?0.05:0)+(rule==='three5'?RULE_FX.fiveTake*nrm(shooter.sh):0);   // long shots for five: good shooters take them, poor ones go inside
    const zoneIn=ds.def===1?(def.mood==='angry'?0:def.mood==='cool'?-0.19:-0.17):0;const dW=ds.def===1?0.4:1; // a furious defender wanders out of the zone; a zone guards the hoop, hides weak defenders and wastes strong ones (inside -0.17 balances the second shots it gives up under DOTW 3, measured 9 Nov 2026)
    let pm;
    if(three){pm=BAL.three+BAL.dot*(0.085*DOT.sh3*nrm(shooter.sh)*aMul-0.04*DOT.df*nrm(def.df)*dMul*dW)+(ds.def===1?0.08:ds.def===0?-0.03:0)+range3(shooter);}   // range: most small players have it, few big ones
    else{pm=0.52+BAL.dot*(0.03*DOT.sh2*nrm(shooter.sh)*aMul+0.13*DOT.h*(shooter.h-def.h)*hMul-0.05*DOT.df*nrm(def.df)*dMul*dW)+zoneIn-(isFat(def)?FAT.inside:0);}   // a fat defender holds their ground under the hoop
    if(rule==='low_ceiling')pm-=RULE_FX.lowCeil*Math.max(0,shooter.h-RULE_FX.lowFrom);   // only those taller than medium have to duck
    if(rule==='three5'&&three)pm+=RULE_FX.five*nrm(shooter.sh);   // long shots for five: the shooters' week
    pm+=-(three?0.10:0.07)*tiredOf(shooter)+0.05*tiredOf(def);   // tired legs miss, long shots most of all (meta-analysis of shooting under fatigue, 2025)
    if(ds.def===1)pm-=BAL.zone;   // a zone that is set
    pm+=(q+BAL.mood*(fx[0]-dfx[3])-0.12*sst.f+0.08*D.st[def.id].f)*(three?0.67:1); // a long shot is worth more, so the same edge moves it less
    let tag=0;
    if(!forceInside){
      if(shadow){pm+=BAL.shadow;if(isF){pm+=0.01-0.04*nrm(def.df)+(def.mood==='cool'?-0.05:def.mood==='angry'&&def.temp!=='fighter'?0.09:def.mood==='sad'?0.07:0);tag=1;sst.shad++;}else pm+=[0.04,0.03,0.06][os.off];}   // the shadow is a smaller bet than the double (Harry, 19 Nov 2026: it gained against every attack, about +11 against star ball, +4 against sharing, +8 against set plays; on the twenty-minute match now about +5, -2, 0, the double +9, -5, +3)
      if(dbl){if(isF){sst.dbl++;if(R()<beatChance(shooter,sst.f,D)){tag=4;sst.beat=(sst.beat||0)+1;}else{pm-=0.14;tag=2;}}else{pm+=[0.11,0.06,0.08][os.off];tag=3;O.openA++;}} // the star may beat the double; a sharing team finds the open man, a star-ball team does not (a wrong double costs less than a right one gains since 17 Nov 2026)
    }
    if(shooter.temp==='fighter'&&shooter.mood==='angry')pm+=0.08;   // a fighter shoots better when angry (0.11 until 14 Nov 2026: challenging a fighter was worth more than any other talk, and trash talk at fighters cost the sender 11 points; Harry: unfair)
    if(late){if(shooter.mood==='happy'||shooter.mood==='cool')pm+=0.04;if(shooter.mood==='nervous')pm-=0.08;if(shooter.temp==='showoff')pm+=0.04;}   // a proud player rises to the big moment (narcissism and performance under pressure)
    sst.fga++;if(three)sst.a3++;const dst=D.st[def.id];dst.dg++;
    if(R()<clamp(pm,0.05,0.9)){dst.da++;
      let pts=three?(rule==='three5'?5:rule==='paint'?2:3):(rule==='paint'?3:2);
      if(rule==='three5'&&three)O.rb+=2;if(rule==='paint'&&!three)O.rb+=1;
      if(rule==='speed'&&forceInside){pts=3;O.rb+=1;}
      if(rule==='hotheads'&&shooter.mood==='angry'){pts++;sst.bonus++;O.rb++;}
      if(rule==='oldhands'&&(shooter.age||0)>=30){pts++;sst.bonus++;O.rb++;}   // Old hands' night (26 Nov 2026)
      if(rule==='heavy'&&shooter.bd===2){pts++;sst.bonus++;O.rb++;}   // Heavyweights' night (26 Nov 2026)
      if(rule==='freshlegs'&&energyOf(shooter)>=RULE_FX.freshFrom){pts++;sst.bonus++;O.rb++;}   // Fresh legs night (26 Nov 2026): energy before the match
      if(rule==='rookies'&&shooter.age&&shooter.age<=23){pts++;sst.bonus++;O.rb++;}   // Rookies' night (26 Nov 2026)
      if(rule==='party'&&shooter.mood==='happy'){pts++;sst.bonus++;O.rb++;}
      if(rule==='bench'&&sst.bench){O.rb+=pts;pts*=2;}
      sst.fgm++;if(three)sst.m3++;sst.pts+=pts;O.score+=pts;
      if(tag===1)sst.shadM++;if(tag===2||tag===4)sst.dblM++;if(tag===3)O.openM++;
    }else{
      // the miss: a second shot for the attack, or the defence takes the ball. The rebound goes to a player: the tall
      // ones and the ones sent to crash (or to get back) take most of them.
      let kept=false;
      if(!second){
        const hAdv=avg(O.court,p=>p.h)-avg(D.court,p=>p.h);
        const pr=0.22+0.13*hAdv*hMul+(rule==='rebounds'?RULE_FX.reb*hAdv+RULE_FX.rebFat*(O.court.filter(isFat).length-D.court.filter(isFat).length):0)+(os.boards===2?0.10+0.20*hAdv:os.boards===0?-0.07:0)+(ds.def===1?0.05:0)+0.03*(O.court.filter(p=>p.mood==='angry').length-O.court.filter(p=>p.mood==='sad').length)+FAT.team*(O.court.filter(isFat).length-D.court.filter(isFat).length);   // nobody boxes out in a zone: more second shots (Syracuse's 2-3 zone gave up ~33% of misses against a normal ~28%)
        if(R()<clamp(pr,0.03,0.6)){kept=true;O.oreb++;const rbr=O.st[wpick(O.court,p=>0.25+p.h+(os.boards===2?0.4:0)+(isFat(p)?FAT.reb:0)).id];rbr.reb++;if(rule==='rebounds'){O.score++;O.rb++;rbr.pts++;rbr.bonus++;}possession(O,D,late,true);}   // Rebound frenzy (26 Nov 2026): a point for the offensive rebound
      }
      if(!kept)D.st[wpick(D.court,p=>0.25+p.h+(ds.boards===0?0.3:0)+(isFat(p)?FAT.reb:0)).id].reb++;
    }
  }
  function tire(X){const sh=X.sheet;const stp=sh.guard===1?stopperOf(X):null;
    for(const p of X.court){X.st[p.id].min++;X.st[p.id].f=Math.min(1,X.st[p.id].f+POSS_SCALE*tireOf(p)*(0.011+(sh.tempo===2?BAL.fastTire:sh.tempo===0?-0.003:0)+(sh.def===2?0.011:0)+(sh.boards===2?0.005:0)+(sh.off===1&&p.id===X.ball?0.008:0)+(p===stp?0.008:0)));}}   // big and heavy bodies tire faster
  // The bench works like a real one: a substitute comes on for a starter who has tired enough, and only when the fresh
  // player is worth more on the court right now (dots against tiredness; under the bench rule a substitute scores
  // double, so they are worth more). Named substitutes can only help; weak ones simply stay seated. Until 11 Nov 2026
  // the most tired starter was swapped for a substitute whatever their quality, so naming no substitutes paid 6 points.
  const worth=(X,p)=>rating(p)-3*X.st[p.id].f-2*tiredOf(p)+(rule==='bench'&&X.st[p.id].bench?4:0);
  // an injury: the player limps off at once and the best substitute comes on; never fewer than two on the court
  function hurt(X,i){
    const sh=X.sheet,hard=1+(sh.tempo===2?0.2:sh.tempo===0?-0.15:0)+(sh.def===2?0.2:0)+(sh.boards===2?0.08:0);
    for(const p of [...X.court]){const s=X.st[p.id];
      if(!(R()<injRate(p,clamp(tiredOf(p)+0.4*s.f,0,1),hard)))continue;
      const fresh=rule==='iron'?null:[...X.bench].sort((u,v)=>worth(X,v)-worth(X,u))[0];
      if(!fresh&&X.court.length<=2)return;   // nobody can come on and only two are left: they play on
      s.injured=i<half||half<0?'first half':'second half';s.injAt=i;X.hurt=(X.hurt||[]).concat(p.id);
      const k=X.court.indexOf(p);
      if(fresh){X.court[k]=fresh;X.bench.splice(X.bench.indexOf(fresh),1);}else X.court.splice(k,1);
      if(X.keep===p.id)X.keep=null;
      return;}}
  function subs(X){for(const p of X.bench)X.st[p.id].f=Math.max(0,X.st[p.id].f-0.25);
    if(!X.bench.length)return;
    const tired=[...X.court].filter(p=>p.id!==X.keep).sort((p,q)=>worth(X,p)-worth(X,q))[0];   // the player named at half-time stays on
    const fresh=[...X.bench].sort((p,q)=>worth(X,q)-worth(X,p))[0];
    if(tired&&fresh&&X.st[fresh.id].f<X.st[tired.id].f-0.07&&worth(X,fresh)>worth(X,tired)+0.1){X.court[X.court.indexOf(tired)]=fresh;X.bench[X.bench.indexOf(fresh)]=tired;}}
  // the playing-time plan: after every possession the three most owed minutes are on the court (one change at a time,
  // and only for a whole possession's difference, so nobody yo-yos); a bench player's legs recover meanwhile
  function rotate(X,i){if(!X.plan||X.planOff)return;
    for(const p of X.bench)X.st[p.id].f=Math.max(0,X.st[p.id].f-0.04*POSS_SCALE);
    const owed=p=>(X.plan[p.id]||0)*(i+1)-X.st[p.id].min;
    const c=[...X.court].filter(p=>p.id!==X.keep).sort((p,q)=>owed(p)-owed(q))[0],b=[...X.bench].filter(p=>X.plan[p.id]!==undefined).sort((p,q)=>owed(q)-owed(p))[0];
    if(c&&b&&owed(b)-owed(c)>=1){X.court[X.court.indexOf(c)]=b;X.bench[X.bench.indexOf(b)]=c;}}
  // half-time: each side reads the score and follows the order left for that case
  const bringOn=(X,p)=>{   // a bench player comes on for the most tired player on the court
    if(!X.bench.includes(p))return false;const tired=[...X.court].sort((u,v)=>X.st[v.id].f-X.st[u.id].f)[0];
    X.court[X.court.indexOf(tired)]=p;X.bench[X.bench.indexOf(p)]=tired;return true;};
  const swing=(O,D)=>{if(!O.half||!D.half)return 0;const g=O.score-D.score;let s=0;
    if(O.half.cond==='behind'&&g<0){const k=clamp(1+5*(avg(O.court,rating)/avg(D.court,rating)-1),0.3,1.7);   // the better the team, the more the urgency is worth
      s+=(O.half.order&&O.half.order!=='slow'?CB.push*k:0)+CB.ease*(D.half.order?0.5:1);}
    if(O.half.cond==='ahead'&&g>0)s-=CB.ease*(O.half.order?0.5:1);
    return s;};
  const halfTime=()=>{
    const m=a.score-b.score;
    for(const [X,d] of [[a,m],[b,-m]]){
      const cond=d>=ORDER_MARGIN?'ahead':d<=-ORDER_MARGIN?'behind':'close';
      X.half={us:X.score,them:X===a?b.score:a.score,cond,order:null,pid:null,failed:null,talk:null,gagged:false,up:[],down:[]};
      const o=oneOrder(X.T.orders&&X.T.orders[cond]);if(!o)continue;   // an order saved in the two-change format of 17-18 Nov 2026 counts as one order
      if(TONES.includes(o.talk)&&(X.T.ban||0)>0)X.half.gagged=true;
      else if(TONES.includes(o.talk)){X.half.talk=o.talk;X.lift=TALK_LIFT[TALK_SHARP[o.talk]||0];
        for(const p of X.T.players){const r=replyTo(p,o.talk);if(R()<Math.min(0.95,TALK_REACH*ageImp(p))&&p.mood!==r[1]){const was=p.mood;p.mood=r[1];
          const good=m=>m==='happy'||m==='cool',bad=m=>m==='sad'||m==='angry'||m==='nervous';
          if(good(p.mood)||(bad(was)&&!bad(p.mood)))X.half.up.push(p.n);else if(bad(p.mood)&&p.temp!=='fighter')X.half.down.push(p.n);}}}
      if(!orderOf(o.k))continue;
      if(o.k==='press')X.sheet.def=2;else if(o.k==='zone')X.sheet.def=1;else if(o.k==='slow')X.sheet.tempo=0;else if(o.k==='fast')X.sheet.tempo=2;else if(o.k==='outside')X.sheet.shots=2;
      else if(o.k==='fresh'){if(rule==='iron'||!X.bench.length){X.half.failed=rule==='iron'?'no substitutions under this rule':'nobody on the bench';continue;}for(const p of [...X.bench])bringOn(X,p);X.planOff=true;}   // the order outranks the playing-time plan
      else if(o.k==='star'){const p=X.court.find(q=>q.id===o.pid)||X.bench.find(q=>q.id===o.pid);
        if(!p){X.half.failed=X.st[o.pid]&&X.st[o.pid].injured?'that player is injured':'that player is not available';continue;}
        if(!X.court.includes(p)){if(rule==='iron'){X.half.failed='no substitutions under this rule';continue;}bringOn(X,p);X.planOff=true;}
        X.ball=p.id;X.sheet.off=1;X.half.pid=p.id;X.keep=p.id;}   // and they stay on the court to the end
      X.half.order=o.k;
    }
    P=half+Math.round((POSS[a.sheet.tempo]+POSS[b.sheet.tempo])/4);   // the second half is as long as the new tempos say
  };
  for(let i=0;i<P;i++){
    if(i===half)halfTime();
    const late=i>=P*0.8&&Math.abs(a.score-b.score)<=ORDER_MARGIN;
    possession(a,b,late);tire(a);rotate(a,i);hurt(a,i);
    if(rule==='first11'&&a.score>=11)break;
    possession(b,a,late);tire(b);rotate(b,i);hurt(b,i);
    if(rule==='first11'&&b.score>=11)break;
    if(rule!=='first11'&&rule!=='iron'&&(i+1)%Math.ceil(P/4)===0&&i<P-1){if(!a.plan||a.planOff)subs(a);if(!b.plan||b.planOff)subs(b);}
    if(rule==='first11'&&(i+1)%5===0){subs(a);subs(b);}
  }
  let guard=0;while(a.score===b.score&&guard++<40){possession(a,b,true);if(a.score!==b.score)break;possession(b,a,true);}
  if(a.score===b.score)a.score++;
  return {a,b};
}
// after a match, the player the defence went after: the one who drew the most doubles and shadows; if nobody did, the star
// (or the best shooter on the court)
const dblTarget=Z=>{const ps=Z.T.players.filter(p=>Z.st[p.id]),n=p=>(Z.st[p.id].dbl||0)+(Z.st[p.id].shad||0);
  const top=[...ps].sort((p,q)=>n(q)-n(p))[0];if(top&&n(top)>0)return top;
  return Z.T.players.find(p=>p.id===Z.ball&&Z.st[p.id])||[...Z.court].sort((p,q)=>q.sh-p.sh)[0];};
function reportLines(X,Y,won,rule){
  // X = our side, Y = theirs. Returns up to two short cause lines.
  const L=[];const ps=X.T.players.filter(p=>X.st[p.id]);
  const st=p=>X.st[p.id];
  const top=[...ps].sort((p,q)=>st(q).pts-st(p).pts)[0];
  const cold=[...ps].filter(p=>st(p).fga>=5&&st(p).fgm/st(p).fga<0.3).sort((p,q)=>st(q).fga-st(p).fga)[0];
  const hog=[...ps].filter(p=>st(p).free>=3).sort((p,q)=>st(q).free-st(p).free)[0];
  const benchHero=[...ps].filter(p=>st(p).bench&&st(p).pts>=12).sort((p,q)=>st(q).pts-st(p).pts)[0];
  const my3=ps.reduce((s,p)=>s+st(p).m3,0);
  const their3=Y.T.players.filter(p=>Y.st[p.id]).reduce((s,p)=>s+Y.st[p.id].m3,0);
  const tiredAvg=X.court.reduce((s,p)=>s+st(p).f,0)/X.court.length;
  const bonus=ps.reduce((s,p)=>s+st(p).bonus,0);
  const moodWhy=p=>p.mood==='sad'?'still sulking':p.mood==='nervous'?'a bundle of nerves':p.mood==='angry'&&p.temp!=='fighter'?'too angry to think':st(p).f>0.6?'running on fumes':'ice cold';
  const good=[],bad=[];
  if(top&&st(top).pts>=14)good.push([st(top).pts,`${top.n}${top.mood==='happy'?', buzzing,':top.mood==='cool'?', locked in,':top.mood==='angry'&&top.temp==='fighter'?', furious and loving it,':''} scored ${st(top).pts}.`]);
  if(benchHero&&benchHero!==top)good.push([st(benchHero).pts+2,`${benchHero.n} came off the bench with ${st(benchHero).pts}.`]);
  if(X.sheet.def===2&&X.steals>=4)good.push([X.steals+2,`Your press stole the ball ${X.steals} times.`]);
  if(Y.sheet.def===1&&my3>=4)good.push([my3+1,`Their zone left your shooters open outside.`]);
  if(X.oreb-Y.oreb>=3)good.push([X.oreb-Y.oreb+2,`You grabbed ${X.oreb} second chances under the hoop.`]);
  if(X.fast>=3)good.push([X.fast+1,`Your fast breaks outran them ${X.fast} times.`]);
  if(X.rb-Y.rb>=3)good.push([X.rb-Y.rb+5,`The rule was worth ${X.rb} points to you and ${Y.rb} to them.`]);
  if(Y.rb-X.rb>=3)bad.push([Y.rb-X.rb+5,`The rule was worth ${Y.rb} points to them and only ${X.rb} to you.`]);
  const LU={attack:[p=>p.sh,'attackers','Attack counted double'],defence:[p=>p.df,'defenders','Defence counted double'],speed:[p=>p.sp,'runners','Speed counted double'],tiny_court:[p=>p.h*4,'giants','height ruled'],low_ceiling:[p=>-p.h*4,'small ones','tall players had to duck']}[rule];
  if(LU){const sum=Z=>Z.T.starters.map(id=>Z.T.players.find(p=>p.id===id)).filter(Boolean).reduce((a,p)=>a+LU[0](p),0);const d=sum(X)-sum(Y);
    if(d>=1.2)good.push([d*3+4,`You started the better ${LU[1]} in a week when ${LU[2]}.`]);
    if(d<=-1.2)bad.push([-d*3+4,`They started the better ${LU[1]} in a week when ${LU[2]}.`]);}
  // the newer dials
  const xs=X.sheet,ys=Y.sheet;
  const foc=Z=>dblTarget(Z);
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
  if(Y.sheet.def===2&&Y.steals>=4)bad.push([Y.steals+2,`Their press took the ball off you ${Y.steals} times.`]);
  if(X.sheet.def===1&&their3>=4)bad.push([their3+2,`Your zone left their shooters open: ${their3} long ones went in.`]);
  if(tiredAvg>0.62)bad.push([6,`${X.sheet.def===2?'The press':X.sheet.tempo===2?'Fast tempo':'A long game'} wore your players out by the end.`]);
  if(Y.oreb-X.oreb>=3)bad.push([Y.oreb-X.oreb+2,xs.boards===0?`You got back early and left them the rebounds: ${Y.oreb} second shots.`:`They owned the rebounds: ${Y.oreb} second shots.`]);
  const tos=ps.reduce((s,p)=>s+st(p).to,0);if(tos>=6&&!(Y.sheet.def===2&&Y.steals>=4))bad.push([tos,`You fumbled the ball away ${tos} times.`]);
  if(X.half){const h=X.half,gap=Math.abs(h.us-h.them),chase=h.order&&h.order!=='slow';   // comebacks (see CB)
    if(h.cond==='behind'&&won)good.push([30,`${gap} down at half-time and your players never stopped chasing${chase?": your order gave them something to chase":""}.`]);
    if(h.cond==='behind'&&!won&&!chase)bad.push([7,`${gap} down at half-time with ${h.order==='slow'?'the game slowed down':'no order for it'}: nothing to chase with.`]);
    if(h.cond==='ahead'&&!won)bad.push([30,`${gap} up at half-time, your players eased off${h.order?'':', with no order to keep them busy'}.`]);}
  good.sort((x,y)=>y[0]-x[0]);bad.sort((x,y)=>y[0]-x[0]);
  if(won){if(good[0])L.push(good[0][1]);if(good[1])L.push(good[1][1]);else if(bad[0])L.push('Even so: '+bad[0][1]);}
  else{if(bad[0])L.push(bad[0][1]);if(bad[1])L.push(bad[1][1]);else if(good[0])L.push('Still: '+good[0][1]);}
  if(!L.length)L.push(won?'A scrappy win. Nothing pretty about it.':'Close, but they wanted it more.');
  if(X.noLineup){L.unshift(`You named no starters, so your three weakest players started: ${X.court.map(p=>p.n).join(', ')}.`);L.length=Math.min(L.length,2);}
  if(X.half&&(X.half.order||X.half.failed||X.half.talk||X.half.gagged)){const h=X.half,o=h.order&&orderOf(h.order);
    const talk=h.gagged?' Banned, you were not in the locker room: no half-time talk.':h.talk?` You ${TALK_WORD[h.talk]}${h.up.length||h.down.length?': '+[h.up.length?h.up.join(', ')+(h.up.length>1?' were':' was')+' lifted':'',h.down.length?h.down.join(', ')+(h.down.length>1?' were':' was')+' put off':''].filter(Boolean).join(', ')+'.':'. Nobody blinked.'}`:'';
    const order=o?` Your order kicked in: ${o.txt.toLowerCase()}${h.pid?' ('+(byId(X.T,h.pid)||{}).n+')':''}.`:h.failed?` Your order "${orderWords(X.T.orders[h.cond],X.T)}" could not be followed: ${h.failed}.`:'';
    L.unshift(`Half-time ${h.us}-${h.them}.${talk}${order} Second half ${X.score-h.us}-${Y.score-h.them}.`);L.length=Math.min(L.length,2);}
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
  const xs=X.sheet,ys=Y.sheet,them=Y.T.name,times=n=>n===1?'once':n===2?'twice':n+' times';
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
  if(top&&st(top).pts>=14)add((st(top).pts-12)/8,`${top.n} scored ${st(top).pts} (${st(top).fgm} of ${st(top).fga} shots).`);
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
  if(cameOn.length&&benchPts>=14)add((benchPts-8)/10,`The substitutes scored ${benchPts}.`);
  else if(cameOn.length&&benchPts>=8)add(0.2,`The substitutes scored ${benchPts}.`);
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
  const foc=Z=>dblTarget(Z);
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
  {const v=(X.score-38)/16;if(rule!=='first11'&&Math.abs(v)>=0.5)add(v*0.3,v>0?`Scored ${X.score} points.`:`Scored only ${X.score} points.`);}
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
  const star=dblTarget(X),ss=X.st[star.id];
  if(os.guard===2){c.dn++;c.db+=ss.dbl;c.dbm+=ss.dblM;c.opn+=X.openM;}         // when their star was double-teamed
  if(os.guard===1){c.sn++;c.sh+=ss.shad;c.shm+=ss.shadM;}                      // when their star was shadowed
  c.t[sh.tempo]++;c.s[sh.shots]++;c.d[sh.def]++;c.o[sh.off||0]++;c.g[sh.guard||0]++;c.b[sh.boards===undefined?1:sh.boards]++;   // the plans they chose
  return c;
}
function roundPairs(n,k){const a=[...Array(n).keys()];const rest=a.slice(1);for(let i=0;i<k;i++)rest.unshift(rest.pop());const arr=[0,...rest];const out=[];for(let i=0;i<n/2;i++)out.push([arr[i],arr[n-1-i]]);return out;}

// ───────────────────────── talking ─────────────────────────
function replyTo(p,tone){
  let r=TEMPS[p.temp].r[tone];
  if(tone===p.love)r=[pick(LOVE_LINES),'happy',1];
  else if(tone===p.hate)r=[pick(HATE_LINES),(p.temp==='hothead'||p.temp==='showoff')?'angry':'sad',-1];
  else if(tone==='calm'&&p.temp==='hothead'&&p.mood!=='angry')r=['I AM CALM!!','angry',-1];
  if(tone!==p.love&&tone!==p.hate&&tone==='praise'&&p.cold&&['veteran','loner','hothead','fighter'].includes(p.temp))r=['After THAT game? Do not.','ok',-1];
  if(tone==='shout'&&p.mood==='sad'&&p.temp!=='fighter')r=[r[0],r[1]==='angry'?'angry':'sad',Math.min(r[2],-2)];
  return r;
}
function react(p,tone,strength){
  let r=replyTo(p,tone);
  if(strength>=1){if(p.lastTone===tone)r=[pick(['You said that last time, coach.','Yes, yes. Heard it.','Is this the same speech?']),'ok',0];p.lastTone=tone;}
  const before=p.mood,imp=ageImp(p);
  // age: an older player sometimes just nods (a talk lands with chance imp when imp<1); the team talk reaches the young more
  if(strength>=1&&imp<1&&R()>=imp){p.fx=null;return [pick(['Mm.','Heard you, coach.','Right.']),p.mood,0];}
  if(strength>=1||R()<Math.min(0.95,0.6*imp)){p.mood=r[1];}
  let dt=strength>=1?r[2]:(Math.abs(r[2])>=2?Math.sign(r[2]):0);
  if(dt>0&&imp>1&&R()<imp-1)dt++;   // a good talk sticks a little more with the young
  p.trust=clamp(p.trust+dt,-2,2);
  p.fx=null;
  if(p.mood===r[1]&&(p.mood!==before||strength>=1)){const k=strength>=1?1:0.5;
    const FX={happy:['sh',0.2],cool:['df',0.2],nervous:['sh',-0.2],sad:['sp',-0.2],angry:p.temp==='fighter'?['sh',0.2]:['df',-0.2]}[r[1]];
    if(FX){const m=FX[1]>0?Math.max(1,imp):1;bump(p,FX[0],FX[1]*k*m*BAL.talkStat,'talk');p.fx=[FX[0],FX[1]*m];}}   // the young gain a little more from a good talk
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
  const tot=Math.max(1,Object.values(X.st).reduce((s,z)=>s+z.min,0)/3);const sh=team.sheet||{};   // the match length: three on the court at every possession (until 14 Nov 2026 this was the most-used player's minutes, which charged a shared rotation as if everybody had played the whole match)
  const hard=1+(sh.tempo===2?0.2:sh.tempo===0?-0.15:0)+(sh.def===2?0.2:0)+(sh.boards===2?0.08:0);
  for(const p of team.players){
    const s=X.st[p.id],share=s?s.min/tot:0;
    p.enWas=energyOf(p);
    p.en=clamp(p.enWas-ENERGY.COST*hard*share*tireOf(p)+((share>0?ENERGY.PART_REST*(1-share):ENERGY.REST)+ENERGY.NIGHT)*ageRec(p),1,4);   // younger players recover more easily   // the body's tiring rate on the cost, the night's recovery for everybody
    injuryAfter(p,s);
  }
}
// Injuries (Harry, 19 Nov 2026; play-offs included). They happen in the match: a player on the court may get hurt at any
// possession and limps off at once; the best substitute comes on, and with nobody on the bench (or under "iron legs") the
// team plays on with two. Mostly the manager's doing: the risk climbs steeply with tiredness (the energy the player started
// with, and the match in their legs), a heavy or very tall body more, a press or a fast game more. A rare very tall, fat
// player (`tough`, hidden, about one in eight of them) seldom gets hurt. Out for 1 to 3 matches; the count goes down with
// every match day (a rest day as well), and the player comes back short of fitness (energy at most INJ.back).
// `p.inj` is the matches still to miss; `p.hurt` and `p.hurtWhen` mark a new injury for the result.
// injury-prone (`frail`, Harry, 25 Nov 2026): one player in ten, hidden, three times the risk; the card shows how often a player
// has been hurt this league, so a manager finds out by playing, not in the draft
const INJ={base:0.0009,tired:0.043,len:[0.5,0.3,0.2],back:2,tough:0.3,toughOdds:0.12,frail:3,frailOdds:0.10,poss:38};
const injRate=(p,T,hard)=>tireOf(p)*(p.tough?INJ.tough:p.frail?INJ.frail:1)*hard*(INJ.base+INJ.tired*T*T*T)/INJ.poss;   // per possession on the court
function injuryAfter(p,s){
  delete p.hurt;delete p.hurtWhen;
  if(s&&s.injured){p.inj=odds(INJ.len)+1;p.hurt=true;p.hurtWhen=s.injured;p.injN=(p.injN||0)+1;return;}   // injN: injuries this league (on the card)
  if(p.inj>0&&!(s&&s.min>0)){p.inj--;if(!p.inj){delete p.inj;p.en=Math.min(energyOf(p),INJ.back);}}   // back, but not fit yet
}
const injDays=n=>n===1?'the next match':'the next '+n+' matches';
// how many matches of silence each character puts up with before feeling ignored (a loner never minds)
const QUIET_LIMIT={showoff:2,pleaser:2,joker:2,worrier:2,hothead:2,veteran:3,fighter:3,easygoing:4,loner:999};
// how a match leaves one team: moods, then form (stats drift). X is that team's side of playMatch's result.
function aftermath(team,X,won,conceded){
  const moves=[],usage={};
  const tot=Math.max(1,Object.values(X.st).reduce((s,z)=>s+z.min,0)/3);   // the match length, as in energyAfter
  for(const p of team.players){const s=X.st[p.id];if(s)usage[p.id]={pts:s.pts,fga:s.fga,fgm:s.fgm,min:s.min,tot};}
  energyAfter(team,X);
  const wins=won?1:0;
  const best=team.players.filter(p=>usage[p.id]).sort((p,q)=>usage[q.id].pts-usage[p.id].pts)[0];
  for(const p of team.players){
    const u=usage[p.id],started=team.starters.includes(p.id);const before=p.mood;
    p.cold=!!(u&&u.fga>=4&&u.fgm/u.fga<0.25);
    if(p===best&&u.pts>=14)p.mood='happy';
    else if(u&&u.fga>=5&&u.fgm/u.fga<0.25)p.mood=(p.temp==='hothead'||p.temp==='fighter')?'angry':(p.temp==='veteran'||p.temp==='loner'||p.temp==='easygoing')?'ok':'nervous';
    else if(!started&&p.temp==='showoff'){p.mood='sad';p.trust=clamp(p.trust-1,-2,2);}
    else if(wins===1&&R()<0.4&&p.mood!=='angry')p.mood=p.mood==='sad'?'ok':'happy';
    // a loss leaves most players down, a heavy one (8 or more) nearly everyone; old hands, loners and easy-going players shrug (Harry, 11 Nov 2026: losses should hurt a little more)
    else if(wins===0&&R()<(conceded-X.score>=16?0.8:0.6))p.mood=p.temp==='hothead'||p.temp==='fighter'?'angry':p.temp==='worrier'||p.temp==='pleaser'?'nervous':p.temp==='showoff'||p.temp==='joker'?'sad':p.mood;
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
      p.mood=(p.temp==='showoff'||p.temp==='hothead')?'angry':'sad';if(R()<BAL.neglect)p.trust=clamp(p.trust-1,-2,2);
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
      if(u.min>=u.tot*0.5&&conceded<=34)ch.push(['df',0.15]);
      if(u.min>=u.tot*0.5&&conceded>=52)ch.push(['df',-0.1]);
    }else if(!(p.enWas<3.5)){ch.push(['sp',-0.12]);ch.push(['sh',-0.06]);}   // sitting out when fresh costs form; a needed rest does not
    for(const [k,d] of ch){const r=bump(p,k,d);if(r>0)ups.push(`${p.n}'s ${STATNAME[k]} went up`);if(r<0)ups.push(`${p.n}'s ${STATNAME[k]} went down`);}
  }
  for(const x of ups)moves.push(x);
  return moves;
}
function sheetWords(s){return [['slow','steady','fast'][s.tempo],['inside','mixed','outside'][s.shots],['share','star ball','set plays'][s.off||0],['man','zone','press'][s.def],['','shadow','double'][s.guard||0],['get back','','crash'][s.boards===undefined?1:s.boards]].filter(Boolean).join(' · ');}
