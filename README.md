# 3nD Basketball

A cartoon basketball manager. You are the coach: you pick seven players, learn how to talk to each of them,
and choose the tactics. The match plays by itself.

- **Online league**: a match against another manager on fixed evenings (League 1: Sunday, Wednesday and Friday; the seasonal leagues: Sunday and Wednesday). You do not need to be online
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
- Match reports: after every match the server works out three strong and three weak points for each side
  (`scoutReport` in `engine.js`, from what happened on the court only) and stores them with the match
  (`b3_matches.detail`). Action `round` returns one match day for everybody to read; each team's last report is
  also kept in its public data (`pub.rep`) and shown to its next opponent. What a manager is told in private
  about their own match (`lines`) is never sent to anyone else.
- Half-time orders: the plan carries `orders = {behind, close, ahead}`, one order per way the first half can end
  (`ORDERS` in `engine.js`: press, zone, slow, fast, outside, fresh legs, everything through a named player; the
  margin for behind/ahead is `ORDER_MARGIN`: 5 points or more down is behind, 5 or more up is ahead, less than 5 apart is close). `playMatch` works on a copy of the plan, reads the score at
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
  plan, line-up and orders are set as usual (Harry's rule, 10 Nov 2026). The line, who was rattled and who was fired up are in `b3_matches.detail` and in both managers' lines.
- Managers can ask for a notification with their result after each match. The server signs these with a key it
  makes once and keeps in the table `b3_config`; without that table notifications are simply off.
