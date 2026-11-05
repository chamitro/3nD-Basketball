# 3nD Basketball

A cartoon basketball manager. You are the coach: you pick seven players, learn how to talk to each of them,
and choose the tactics. The match plays by itself.

- **Online league**: a match against another manager every Wednesday and Sunday. You do not need to be online
  when it is played. One league lasts two months (16 matches), a win is 3 points.
- **Practice**: against seven computer teams, at your own pace.

The rules are explained inside the game under **? How to play**.

## Files

| file | what it is |
|---|---|
| `index.html` | the game: every screen, the drawing, practice mode |
| `engine.js` | the rules of the game (talks, moods, the match). Used by the page and by the server, so both agree |
| `server.js` | the online league: joining, talking, plans, votes, match day, who meets whom |
| `store_rest.js` | how the server reads and writes the Supabase tables |
| `serve_deno.js` | the web part of the server function |
| `build.py` | joins the four files above into `supabase/functions/b3/index.ts` and stamps the version number |
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
3. If build.py said the server function changed, paste `supabase/functions/b3/index.ts` into the function `b3`
   in the Supabase dashboard and deploy it.

## How the online league works

- The browser decides nothing. It sends choices; the server works out every talk and every match.
- No accounts. A secret team key lives in the browser ("Play this team on another device" in the Table tab moves it).
- Any number of managers. If the number is odd, one computer team fills the gap; a new manager takes its place.
- Match day needs no timer: the first request after the hour plays it.
