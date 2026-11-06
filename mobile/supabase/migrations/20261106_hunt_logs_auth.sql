-- ============================================================================
-- DO NOT APPLY without Chris OK.
-- ============================================================================
-- NorCalHunt Build 4 · per-user hunt logs behind Supabase Auth (email OTP).
--
-- Before applying, in the Supabase dashboard:
--   1. Authentication → Providers → Email: enabled. "Confirm email" on is fine;
--      OTP sign-in creates and confirms the user when they type the code.
--   2. Authentication → Email Templates → "Magic Link" (used by signInWithOtp)
--      AND "Confirm signup": put the 6-digit code in the body, e.g.
--        <h2>Your NorCalHunt code</h2><p>{{ .Token }}</p>
--      If the template only has {{ .ConfirmationURL }} the hunter gets a link,
--      not a code, and the app's code screen can't finish sign-in.
--   3. Authentication → Settings: Email OTP length 6, expiry ~600–3600s.
--   4. Set up custom SMTP before a public release (the built-in sender is
--      rate-limited to a handful of emails an hour).
--
-- What this does:
--   - Adds hunt_logs.user_id (FK to auth.users, cascade on account delete).
--   - Defaults user_id to auth.uid() so inserts get stamped server-side.
--   - Lets team_code be null — signed-in hunters sync every hunt, not only
--     ones tagged with a blind group.
--   - Drops the starter "anyone with the anon key" policies from schema.sql.
--   - Per-user policies for `authenticated` only. anon gets nothing.
--
-- Existing rows: starter-era rows have no owner and keep user_id = null.
-- Under the new policies nobody can read them through the API. To hand them
-- to an account, backfill by hand before (or after) applying, e.g.:
--   update public.hunt_logs set user_id = '<auth user uuid>' where team_code = 'BUTTE-7' and user_id is null;
-- Or leave them — the phones that wrote them still hold their own copies and
-- re-push them (stamped with the new owner) on the next "Sync my hunts".
-- NOTE: a re-push upserts on id; a null-owner row with the same id is hidden
-- from the client by RLS, so the upsert fails for that id. Backfill or delete
-- the null-owner rows if hunters report "row-level security" sync errors.

begin;

alter table public.hunt_logs
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Backfill strategy: see header (manual, per team). Then stamp new rows.
alter table public.hunt_logs alter column user_id set default auth.uid();

alter table public.hunt_logs alter column team_code drop not null;

create index if not exists hunt_logs_user_date on public.hunt_logs (user_id, hunt_date desc);

-- Starter policies from schema.sql.
drop policy if exists "team members read their group" on public.hunt_logs;
drop policy if exists "team members add hunts" on public.hunt_logs;
drop policy if exists "team members fix hunts" on public.hunt_logs;
drop policy if exists "team members delete hunts" on public.hunt_logs;

alter table public.hunt_logs enable row level security;

create policy "hunters read their own hunts"
  on public.hunt_logs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "hunters add their own hunts"
  on public.hunt_logs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "hunters fix their own hunts"
  on public.hunt_logs for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "hunters delete their own hunts"
  on public.hunt_logs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- anon: no policies and no grants → no access.
revoke all on public.hunt_logs from anon;
grant select, insert, update, delete on public.hunt_logs to authenticated;

commit;
