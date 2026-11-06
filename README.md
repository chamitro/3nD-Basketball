# 3nD Basketball

A cartoon basketball manager. You are the coach: you pick seven players, learn how to talk to each of them,
and choose the tactics. The match plays by itself.

- **Online league**: a match against another manager every Wednesday and Sunday. You do not need to be online
  when it is played. A win is 3 points.
  There are four leagues a year, one per season: the Winter League (December to February), Spring (March to May),
  Summer (June to August) and Autumn (September to November), about 26 matches each. A league ends on the last
  match day of its season. The very first league (November 2026) is a one-month trial of 8 matches:
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
- Match day needs no timer: the first request after the hour plays it.
- A team is in the running league when its `league_no` is that league's number. Ending a league changes nobody's
  `league_no`, so the next league is empty until managers enter it (action `enter`, which older copies of the
  page send as `swap`). A brand-new team joins the running league directly. The all-time list of leagues won is
  worked out when a league ends and kept with the league (`final.hall`).
- The assistant under the game plan (`planCheck` in `index.html`) only reports the state of the manager's own
  players: tired, worn out, moods, low trust, who has not been talked to. On purpose it does not judge the plan and
  says nothing about the opponent, so that the tactics are the manager's own decision.
- Match reports: after every match the server works out three strong and three weak points for each side
  (`scoutReport` in `engine.js`, from what happened on the court only) and stores them with the match
  (`b3_matches.detail`). Action `round` returns one match day for everybody to read; each team's last report is
  also kept in its public data (`pub.rep`) and shown to its next opponent. What a manager is told in private
  about their own match (`lines`) is never sent to anyone else.
- Managers can ask for a notification with their result after each match. The server signs these with a key it
  makes once and keeps in the table `b3_config`; without that table notifications are simply off.
