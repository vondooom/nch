-- NorCalHunt logbook sync (optional). Run in the Supabase SQL editor.
--
-- A blind group shares a team code (e.g. BUTTE-7) and the app filters by it.
-- Rows without a team code never leave the phone.
--
-- STARTER POLICIES: these let anyone with the public anon key read and write
-- every row — the team code is a filter, not a secret. Fine for a private
-- TestFlight group; before a public release, add Supabase Auth and scope the
-- policies to a team-membership table.

create table if not exists public.hunt_logs (
  id          text primary key,
  team_code   text not null check (team_code ~ '^[A-Z0-9-]{2,16}$'),
  hunt_date   date not null,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists hunt_logs_team_date on public.hunt_logs (team_code, hunt_date desc);

alter table public.hunt_logs enable row level security;

create policy "team members read their group"
  on public.hunt_logs for select
  to anon, authenticated
  using (true);

create policy "team members add hunts"
  on public.hunt_logs for insert
  to anon, authenticated
  with check (true);

create policy "team members fix hunts"
  on public.hunt_logs for update
  to anon, authenticated
  using (true) with check (true);
