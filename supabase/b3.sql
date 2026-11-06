-- 3nD Basketball: the online league. Run once in the Supabase SQL editor (it is safe to run again).
-- Nothing here is readable or writable from a browser. Only the server function "b3" touches these tables.

create table if not exists public.b3_league (
  id int primary key check (id = 1),          -- there is one league at a time
  no int not null,                            -- league number
  match_no int not null,                      -- the match that is played next (1, 2, ... up to the length of the league)
  next_match_at bigint not null,              -- when, in milliseconds since 1970 (UTC)
  rule text not null,                         -- the rule of that match
  vote_opts jsonb not null,                   -- the three rules managers vote on for the match after it
  busy_until bigint,                          -- set while a match day is being played
  final jsonb                                 -- how the previous league ended
);

create table if not exists public.b3_teams (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,              -- SHA-256 of the secret kept in the manager's browser
  name text not null,
  name_lc text not null unique,
  is_house boolean not null default false,    -- the one computer team, used only when the number of managers is odd
  league_no int not null default 1,           -- the last league this team entered; it is in the running league only if this is that league's number
  w int not null default 0, l int not null default 0,
  pf int not null default 0, pa int not null default 0, pts int not null default 0,
  next_opp uuid,                              -- next opponent; null = not in play (away for three weeks, or has not entered this league)
  last_seen bigint not null,
  ver int not null default 0,                 -- goes up with every write, so an old copy can never overwrite a new one
  pub jsonb not null default '{}'::jsonb,     -- what everyone may see: the plan and line-up of the last match
  data jsonb not null,                        -- players (with their secrets), line-up, plan, last result
  created_at timestamptz not null default now()
);
create index if not exists b3_teams_inplay on public.b3_teams (next_opp) where next_opp is not null;
create index if not exists b3_teams_table on public.b3_teams (pts desc);

create table if not exists public.b3_pools (  -- the 14 players offered to someone who has not picked a team yet
  key_hash text primary key,
  players jsonb not null,
  rerolls int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.b3_matches (  -- every match ever played, for the record
  id bigint generated always as identity primary key,
  league_no int not null, match_no int not null,
  a uuid, b uuid, a_name text, b_name text, score_a int, score_b int,
  rule text, detail jsonb,
  played_at timestamptz not null default now()
);
create index if not exists b3_matches_round on public.b3_matches (league_no, match_no);

create table if not exists public.b3_config (  -- small settings the server keeps for itself, e.g. the key it signs notifications with
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.b3_config  enable row level security;
revoke all on public.b3_config from anon, authenticated;
grant all on public.b3_config to service_role;

alter table public.b3_league  enable row level security;
alter table public.b3_teams   enable row level security;
alter table public.b3_pools   enable row level security;
alter table public.b3_matches enable row level security;
-- no policies on purpose: visitors get nothing. The server function uses the secret key, which bypasses this.
revoke all on public.b3_league, public.b3_teams, public.b3_pools, public.b3_matches from anon, authenticated;
grant all on public.b3_league, public.b3_teams, public.b3_pools, public.b3_matches to service_role;

-- One match day is written in one go: either all of it lands or none of it.
create or replace function public.b3_commit(p_league jsonb, p_teams jsonb, p_matches jsonb, p_reset boolean)
returns void language plpgsql set search_path = public as $$
begin
  if p_reset then   -- a league ended: everyone goes back to zero. Nobody is moved into the next league:
                    -- league_no stays as it was until the manager enters (the server sets it then).
    update b3_teams set w = 0, l = 0, pf = 0, pa = 0, pts = 0, pub = pub - 'lw'
     where not is_house;
  end if;
  update b3_teams t
     set w = x.w, l = x.l, pf = x.pf, pa = x.pa, pts = x.pts, league_no = x.league_no,
         next_opp = x.next_opp, pub = x.pub, data = x.data, ver = t.ver + 1
    from jsonb_to_recordset(p_teams)
         as x(id uuid, w int, l int, pf int, pa int, pts int, league_no int, next_opp uuid, pub jsonb, data jsonb)
   where t.id = x.id;
  insert into b3_matches (league_no, match_no, a, b, a_name, b_name, score_a, score_b, rule, detail)
  select x.league_no, x.match_no, x.a, x.b, x.a_name, x.b_name, x.score_a, x.score_b, x.rule, x.detail
    from jsonb_to_recordset(p_matches)
         as x(league_no int, match_no int, a uuid, b uuid, a_name text, b_name text, score_a int, score_b int, rule text, detail jsonb);
  update b3_league
     set no = (p_league->>'no')::int, match_no = (p_league->>'match_no')::int,
         next_match_at = (p_league->>'next_match_at')::bigint, rule = p_league->>'rule',
         vote_opts = p_league->'vote_opts', final = p_league->'final', busy_until = null
   where id = 1;
  delete from b3_pools where created_at < now() - interval '14 days';
end $$;
revoke all on function public.b3_commit(jsonb, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.b3_commit(jsonb, jsonb, jsonb, boolean) to service_role;

-- Giving a manager an opponent (a new manager, one back after a long absence, or one entering a new league), in one step.
-- The new manager takes the house team's place if the house team has a match, and otherwise plays the house team.
-- Only one of these runs at a time, and never while a match day is being played, so two people joining at the
-- same moment cannot be given the same opponent.
create or replace function public.b3_attach(p_id uuid, p_now bigint)
returns void language plpgsql set search_path = public as $$
declare lg b3_league; h b3_teams; x uuid;
begin
  select * into lg from b3_league where id = 1 for update;
  if lg.busy_until is not null and lg.busy_until > p_now then raise exception 'b3_busy'; end if;
  select * into h from b3_teams where is_house order by created_at limit 1 for update;
  if h.id is null then raise exception 'b3_busy'; end if;
  if exists (select 1 from b3_teams t join b3_teams o on o.id = t.next_opp
              where t.id = p_id and o.next_opp = t.id) then return; end if;      -- already has an opponent
  x := h.next_opp;
  if x is not null and x <> p_id and exists (select 1 from b3_teams where id = x and next_opp = h.id) then
    update b3_teams set next_opp = p_id, ver = ver + 1 where id = x;
    update b3_teams set next_opp = x,    ver = ver + 1 where id = p_id;
    update b3_teams set next_opp = null, ver = ver + 1 where id = h.id;
  else
    update b3_teams set next_opp = h.id, ver = ver + 1 where id = p_id;
    update b3_teams set next_opp = p_id, ver = ver + 1 where id = h.id;
  end if;
end $$;
revoke all on function public.b3_attach(uuid, bigint) from public, anon, authenticated;
grant execute on function public.b3_attach(uuid, bigint) to service_role;

-- How much room the whole database takes, in bytes. The server reports it in its "ping" answer (as megabytes),
-- so it can be watched from outside. The free Supabase plan allows 500 MB.
create or replace function public.b3_size()
returns bigint language sql stable security definer set search_path = public as $$
  select pg_database_size(current_database());
$$;
revoke all on function public.b3_size() from public, anon, authenticated;
grant execute on function public.b3_size() to service_role;

-- Which version of this file was run last. The server reports it in its "ping" answer, so it can be checked from outside.
insert into public.b3_config (key, value) values ('sql', '3'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Handy to look at (run one at a time, any time):
-- select no, match_no, to_timestamp(next_match_at/1000) as next_match, rule from public.b3_league;
-- select name, pts, w, l, is_house, (select name from public.b3_teams o where o.id = t.next_opp) as next_opponent, to_timestamp(last_seen/1000) as last_seen from public.b3_teams t order by pts desc;
-- select league_no, match_no, a_name, score_a, score_b, b_name, rule, played_at from public.b3_matches order by id desc limit 20;
