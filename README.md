# 3nD Basketball

A cartoon basketball manager. You are the coach: you pick seven players, learn how to talk to each of them,
and choose the tactics. The match plays by itself.

- **Online league**: a match against another manager on fixed evenings (Sunday, Wednesday and Friday in every league, since 14 Nov 2026; the seasonal leagues had been planned with two a week). You do not need to be online
  when it is played. A win is 3 points.
  There are four leagues a year, one per season: the Winter League (December to February), Spring (March to May),
  Summer (June to August) and Autumn (September to November), about 26 matches each. A league ends on the last
  match day of its season. The very first league (8 November to 6 December 2026) is a trial of 13 match days, three a week, so that 13 or 14 teams all meet each other once:
  `LEAGUE_MATCHES` and `SEASONS_FROM` in `server.js`.
  Between leagues each manager may change one player (`MAX_SWAPS` in `server.js` and in `index.html`).
  Every new league starts with no teams: when a league ends, each manager opens the game and presses
  **Enter league N**. The team, its players and its record stay the same. The Table tab lists the leagues won
  by every team.
- **Practice**: against seven computer teams, at your own pace.

The rules are explained inside the game under **? How to play**.

## Files

| file | what it is |
|---|---|
| `index.html` | the game: every screen, the drawing, practice mode |
| `engine.js` | the rules of the game (talks, moods, the match). Used by the page and by the server, so both agree |
| `server.js` | the online league: joining, talking, plans, votes, match day, who meets whom |
| `push.js` | result notifications: encrypting and signing a message for one phone (Web Push) |
| `store_rest.js` | how the server reads and writes the Supabase tables |
| `serve_deno.js` | the web part of the server function |
| `build.py` | joins the five files above into `supabase/functions/b3/index.ts` and stamps the version number |
| `manifest.json`, `sw.js`, `icons/`, `version.json` | what makes it installable as an app, and the update check |
| `supabase/b3.sql` | the database tables |
| `supabase/functions/b3/index.ts` | the built server function (do not edit by hand) |

## Putting it online

1. Supabase SQL editor: run `supabase/b3.sql` once.
2. Supabase Edge Functions: deploy a function named `b3` with the contents of `supabase/functions/b3/index.ts`.
3. Serve `index.html` and `engine.js` from any static host.

## Releasing a change

1. Run `python3 build.py`. It rebuilds the server function and stamps a new version number into `index.html`,
   `sw.js` and `version.json`. It also says whether the server function changed.
2. Commit and push. Phones that have the game open or installed compare their number with `version.json`
   and show an "Update now" button.
3. If `supabase/b3.sql` changed, run it again in the Supabase SQL editor first (it is safe to run again).
4. If build.py said the server function changed, paste `supabase/functions/b3/index.ts` into the function `b3`
   in the Supabase dashboard and deploy it.

To check a deployment from outside, send `{"a":"ping"}` to the function: the answer has `build` (the number
build.py printed), `sql` (the version of `b3.sql` that was run last, 3 at the moment), `name` and `matches` (the
running league and its length), `managers` (teams in it) and `db_mb` (megabytes the database uses, of the 500 the
free plan allows; the scheduled job fails loudly from 350 on).

## How the online league works

- The browser decides nothing. It sends choices; the server works out every talk and every match.
- No accounts. A secret team key lives in the browser ("Play this team on another device" in the Table tab moves it).
- Any number of managers. If the number is odd, one computer team fills the gap; a new manager takes its place.
- Who meets whom: everyone should meet everyone. A team is paired first with teams it has not met yet in this
  league (counted from `b3_matches`), then with those it has met least; among those, teams on similar points meet,
  and nobody meets the same team twice running if it can be avoided. With 13 teams everyone has met everyone once
  after 13 match days.
- Match day needs no timer: the first request after the hour plays it.
- A team is in the running league when its `league_no` is that league's number. Ending a league changes nobody's
  `league_no`, so the next league is empty until managers enter it (action `enter`, which older copies of the
  page send as `swap`). A brand-new team joins the running league directly. The all-time list of leagues won is
  worked out when a league ends and kept with the league (`final.hall`).
- Match reports: after every match the server works out three strong and three weak points for each side, and keeps a box score per player (points, shots, threes, rebounds, steals, ball losses, shots guarded and allowed) until the league ends; then all the matches of that league are deleted (scores, reports, box scores) and only the teams, the champion and each team's record line stay
  (`scoutReport` in `engine.js`, from what happened on the court only) and stores them with the match
  (`b3_matches.detail`). Action `round` returns one match day for everybody to read; each team's last report is
  also kept in its public data (`pub.rep`) and shown to its next opponent. What a manager is told in private
  about their own match (`lines`) is never sent to anyone else.
- Half-time orders: the plan carries `orders = {behind, close, ahead}`, one order per way the first half can end
  (`ORDERS` in `engine.js`: press, zone, slow, fast, outside, fresh legs, everything through a named player; the
  margin for behind/ahead is `ORDER_MARGIN`: 8 points or more down is behind, 8 or more up is ahead, less than 8 apart is close; it was 5 with the ten-minute match). A match is twenty minutes of three-on-three since 14 Nov 2026: `POSS` possessions a side by tempo (30/38/46, twice the old 15/19/23), in-match tiring per possession halved (`POSS_SCALE`), report thresholds doubled. `playMatch` works on a copy of the plan, reads the score at
  the halfway possession and changes the copy; the second half is as long as the new tempos say. Each side's
  result carries `half = {us, them, cond, order, who, left}`, kept in `b3_matches.detail`, in `pub.rep` and in the
  manager's `data.last`. `checkPlan` validates the orders; a plan without them (older pages) keeps the stored ones.
  The computer team leaves orders too (`botPrepare`). Not under "First to eleven" (no half-time).
- Half-time talk: each order row may also carry `talk` (one of the nine tones). At half-time every player reacts to
  it as to a team talk, moods only (`replyTo` in `engine.js`, no trust or form change); a sharp talk (honest,
  challenge, demand) adds `TALK_LIFT` to the side's shot quality for the rest of the match, shouting adds less
  (`TALK_SHARP`). The half-time record carries `talk`, the manager's lines say who was lifted or put off.
- Balance of squad and manager (9 Nov 2026, from the season simulator in the test scripts): the dots weigh more in
  a shot than at first release (`DOT` in `engine.js`: attack on long shots 1.6x, on close shots 3x, height 2.5x,
  defence 2.5x), moods move shooting 30% less (`MOODFX`), and a stat = `base` (drafted level) + `tk` (what talks did, stays) + `fm` (match form, fades by
  `FORM_FADE` 0.3 a week in `weekReset`), within `STAT_BAND` (0.5) of the base (`bump(p,k,d,kind)`; older players get
  base/tk/fm the first time a stat moves). From the research of 11 Nov 2026: skill does not change game to game,
  shooting regresses to the mean, no between-game momentum (Vergin 2000), only fatigue carries over. Measured
  over 150 simulated seasons: the squad now explains ~5% of a season's results overall and ~20% within one manager
  style (was ~2% and ~3%); a typical gap between two squads is worth ~5 points of win rate (was ~1); the gap between
  the best and the worst manager style fell from 45 to ~40 points. Talking well remains the biggest lever (+19),
  energy rotation ~+7, half-time orders ~+6, a smart plan ~+2, trash talk used well ~+3.
- Trash talk: action `trash {i}` stores one line of `TRASH` (engine.js) for the next opponent (`data.trash`, `i:null`
  takes it back). On match day it is the last word before tip-off: `trashTeam` moves the opposing players' moods by
  character (`TRASH_FX`: rattled or fired up; a line aimed at the star reaches the star for sure; a team that has
  heard this manager before, `data.heard`, is harder to rattle). The sender gets `data.ban = 1` (and `banFor`): talk, team talk and
  trash talk are refused and the half-time talk is skipped (`half.gagged`) until the next match is played; the
  plan, line-up and orders are set as usual (Harry's rule, 10 Nov 2026); a half-time tone sent during the ban is ignored by
  `checkPlan` and the page locks the tone menus, while a tone set before the ban is kept and applies again after it (15 Nov 2026). The line, who was rattled and who was fired up are in `b3_matches.detail` and in both managers' lines.
- Body types (Winter League 2026/27, Harry 12 Nov 2026): a player has a height `ht` (0 tiny .. 3 very tall) and a build
  `bd` (0 slim, 1 normal, 2 fat); `h` and `bulk` follow from them (`HT_H`, `BD_BULK` in `engine.js`). A body tires by
  `TIRE_HT[ht]*TIRE_BD[bd]` (0.81 for tiny and slim to 1.44 for very tall and fat; set 12 Nov 2026 against real figures: bigs
  have a 21-26% lower aerobic capacity and play about a quarter fewer minutes than guards), both inside a match and in the
  energy a match costs (`tireOf`). Speed follows the body as a tendency at creation (`SP_SHIFT` by height, `BD_SP` by build). Tall and very tall players lose
  `TALL3[ht]` (0.03, 0.06) on every long shot, as real centres shoot worse from range. A fat player takes more rebounds,
  adds to the side's second shots and takes `FAT.inside` off close shots against them (`FAT`). Players from before the
  update have no `ht`/`bd` and none of this applies to them. Measured over 400 simulated leagues of computer teams (no rotation): a
  very tall player's side wins about 55% of the matches they play in, a tiny one's about 45% (the same spread as before
  the update, 54 to 44: height wins close shots and rebounds), fat about 1.5 points more than slim; very tall players
  start a match with about 0.5 energy dots less than tiny ones.
- Team names: `nameFit` (server.js) refuses the plain insults in English, Greek and Greeklish at `join` (whole words, the longer ones
  anywhere in the name, accents dropped). See the itch.io section below.
- Every player is one of a kind: `takenNames` collects every name on every team, in free agents, in fresh-draft pools and in the
  draft pools still open; new pools and new players are made against it, and at `join` a name taken in the meantime is swapped
  for a fresh one (Harry, 12 Nov 2026).
- Looks: `hair`, `beard`, `specs`, `acc` (sweatbands), `socks`, `shoe`, `cheek` are numbers into lists in `engine.js`,
  drawn by `toon` in `index.html`; they change nothing in a match.
- Team kit: two colours and a badge (`KIT_COLS`, `BADGES`, `cleanKit`), kept in `pub.kit`; a team without one gets a kit
  from its name (`nameKit`). Chosen at the draft, changed with action `kit {kit:{a,b,g}}`, copied into each match record.
- The fresh draft: when a league listed in `CFG.REDRAFT_AFTER` ends (League 1), every team gets `data.redraft.pool`,
  fourteen new players, instead of free agents. `enter` then needs `picks` (seven of them), which replace the whole
  squad; the old squad stays until then. The computer team simply gets new players. Only this once: later leagues end
  with the usual one change.
- Managers can ask for a notification with their result after each match. The server signs these with a key it
  makes once and keeps in the table `b3_config`; without that table notifications are simply off.

## itch.io

The itch.io page (from 17 Nov 2026) is a launcher, not the game: `itch/index.html` sends people to the GitHub Pages site to
install the game as a web app, so a team never lives in itch's frame. `python3 itch.py` zips it for upload. Team names are
checked by `nameFit` (server.js) at `join`: plain insults in English, Greek and Greeklish are refused.

## Half-time orders (one per case again, 18 Nov 2026)

`data.orders` is `{behind, close, ahead}`, each `{k, pid, talk}` or null: one order of `ORDERS` (press, zone, slow, fast,
outside, fresh legs, everything through one player with `pid`) and a tone. From 17 to 18 Nov 2026 the card took up to two
changes per case (`{ch, free, star, talk}`); it was too complicated, so it went back. `oneOrder` (engine.js) turns an order
saved in that format into one order, at match time, on the page and when the server takes a plan. What stayed: on every
doubled shot the star may beat the double (`beatChance`: the star's attack and speed dots, mood and tiredness against the
two best defenders on the court), a wrong double costs less than a right one gains, and the player named for everything
through stays on the court.

Comebacks (Winter, 19 Nov 2026, `CB` and `swing` in engine.js): in the second half a team that was behind at half-time
gets `CB.push` (0.14) on its shots while still behind, if an order other than slow fired, scaled by how much better its
court is than the leaders' (0.3x to 1.7x); a team that was ahead loses `CB.ease` (0.06) while still ahead, half that if an
order fired. Teams 8+ down at half-time won 5% before, about 13% after (20% from 8-11 down, 25-30% for a stronger team
with press, fast, outside or star). Check: `3nD-tests/comeback2.js`.

## Names (19 Nov 2026, Winter)

`makeName` (engine.js): a first name from `FIRST` (60) and a basketball-pun surname from `LAST` (60), 3600 in all, unique in
the league (`usedNames`, filled by the server from every name in play); 3% of the time a legend from `LEGENDS` (32 spoofs of
film characters, never real people), each at most once a league. Letters, spaces and hyphens only. The gym tag shows
`shortName` (the surname, or the legend's own word; `gymTag` adds the initial when two teammates share it). Old one-word
names stay. Check: 3nD-tests/names_test.js (200 leagues: 3.0% legends, no repeats).

## Injuries (19 Nov 2026, Winter; play-offs included)

In the match (`hurt` in playMatch, after every possession): a player on the court gets hurt with `injRate` = tireOf(body) x
(tough? 0.3 : 1) x hard(plan) x (INJ.base 0.0009 + INJ.tired 0.043 x T^3) / 38, T = tiredness before the match + 0.4 x the
match in their legs. They limp off at once (`st.injured` = 'first half'/'second half', `st.injAt`, `X.hurt`); the best
substitute comes on; with nobody to come on (or "iron legs") the team plays on with two, never fewer. After the match
`injuryAfter` (from `energyAfter`): out for 1-3 matches (`p.inj`, 50/30/20%), `p.hurt`/`p.hurtWhen` for the result line
(and the opponent's: "Their X limped off"). The count goes down every match day (rest days in `runMatchday` too); on the
way back energy is at most INJ.back (2). The end of a league heals everyone. Before a match `playMatch` leaves injured
players out; the best player left starts, the bench is filled back up to the substitutes named. Public (`pubPlayer`).
`tough`: about 12% of very tall, fat players, hidden (`ownPlayer` drops it), risk x0.3.
Balance study (60 leagues): managers who rest tired players 0.3 injuries a season (none in 74%), who never rest about 3.
Resting is worth about +4 wins a season with or without injuries: they are rare and short, a story more than a points
swing (a "rusty" return, form down after an injury, was tried and changed nothing measurable, so it is not in).
Checks: `3nD-tests/injury_test.js`, `3nD-tests/localseason/injury_league_test.js`.

## Range (19 Nov 2026, Winter)

Every new player gets a hidden `rg` (true/false) at birth, with odds by height `RANGE_ODDS` = tiny 0.6, medium 0.4, tall 0.15,
very tall 0.05. On a long shot `range3` adds +0.03 with range, and without it 0 / 0 / -0.04 / -0.08 by height (it replaces
`TALL3` -0.03/-0.06 for new players; players without `rg` keep `TALL3`). Not in the player's value, never sent to a browser
(`ownPlayer` drops it). Long shots made: tiny 36%, medium 35%, tall 31%, very tall 26% (a very tall one with range 36%).

## Play-offs (17 Nov 2026, from the Winter League; top eight and no Silver Cup since 19 Nov 2026)

The last `CFG.PO_DAYS` (9) match days of a season league of at least `PO_MIN` (18) are play-offs, one round a week, best of three.
The top eight play (`PO_SHAPES[8]`): quarter-finals 1v8, 4v5, 3v6, 2v7, semi-finals (1/8 v 4/5, 3/6 v 2/7), final. 1st and 2nd
meet the weakest teams, pick the rule of games 1 and 3, and cannot meet before the final. With 6-7 teams the old six bracket
(3v6, 4v5, 1 and 2 have a bye), with 4-5 semi-finals and a final, with 2-3 a final. Everyone else plays friendlies. The Silver Cup
for 7th-12th (cup `s`) was dropped before it was ever played. After the last regular match day
`poOrder` (points, head-to-head among teams level, +/-, points scored) and `poSeeds` put `{league,cup,seed,pos}` in each team's
`data.po` and `pub.po`; the table is frozen from then on. Nothing new is stored in the league row: `poState` works the bracket out
from the seeds and the match records, which carry `detail.po = {c, s, g}`. `poPair` pairs the series of the week, friendlies for the
rest (`pairUp`), and leaves byes and decided series unpaired: they rest (energy as a match off) and are not given the computer team
when they open the game. The higher seed picks the rule of games 1 and 3, the lower seed game 2 (action `porule`, kept in
`data.poRule` for that match); nothing picked means the voted rule of the week, which also rules the friendlies. The champion is
the final's winner (`data.won`, history `title`); `final.top` keeps the top of the table.
Store query `leagueResults` (scores with the `po` tag). Page: the bracket and series sheet on the Table tab, zones in the table,
the play-off box with the rule picker in the locker room, help section 14.
