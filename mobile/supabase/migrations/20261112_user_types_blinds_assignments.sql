-- ============================================================================
-- NOT APPLIED. DO NOT APPLY without Chris OK.
-- For a FUTURE, dedicated NorCalHunt Supabase project ONLY. Never run this
-- against any other app's project (the borrowed project the app used to point
-- at is not NorCalHunt's and must not be touched).
--
-- Apply order on the NorCalHunt project:
--   supabase/schema.sql
--   migrations/20261106_hunt_logs_auth.sql
--   migrations/20261111_guide_groups.sql
--   migrations/20261112_user_types_blinds_assignments.sql   ← this file
-- ============================================================================
-- NorCalHunt Build 6 · hunter types, typed groups + expanded roles, blinds,
-- hunt-log extras, guide slates / lease schedules, club draws, guest days.
--
-- Build 6 ships all of this LOCAL-ONLY (AsyncStorage). The app does not read
-- or write these tables yet. Local shapes:
--   nch.userTypes.v1   → nch_profiles.user_types
--   nch.groups.v1      → hunt_groups (+ group_type, guest_day_limit),
--                        hunt_group_members (accounts), hunt_group_roster (names)
--   nch.blinds.v1      → blinds
--   nch.hunts.v1 extra → hunt_logs columns (blind_id, group_id, water/field, …)
--   nch.assignments.v1 → group_assignments
--   nch.clubDraws.v1   → club_draws
--   nch.guestDays.v1   → guest_days
-- Ids for the new tables are TEXT so the phone's ids ("blind-…", "asg-…") sync
-- as-is. hunt_groups.id stays uuid (20261111); the sync layer maps a local
-- "grp-…" id to the server uuid when it first uploads a group.
--
-- ACCESS RULES (authenticated only; anon gets nothing). Mirrors
-- mobile/lib/permissions.ts — keep the two in step.
--   Results = hunt rows, bird counts, blind performance, guest-day usage.
--   owner / admin / manager   read + manage everything in the group
--   guide                     guide_service: read results, log, build slates
--   member / blindmate        read the shared group log + blind results
--                             (NOT in guide_service — there, results are staff-only)
--   client                    NEVER reads results. Sees blinds (pins/routes),
--                             staff names, and only the slate lines they're on.
--   guest                     same as client.
-- Enforced by nch_role_sees_results(); hunt_logs' group read path and every
-- results table/view go through it.

begin;

-- ── helpers ──────────────────────────────────────────────────────────────

-- Pure rule: does this role see results in a group of this type?
create or replace function public.nch_role_sees_results(gtype text, r text)
returns boolean language sql immutable set search_path = '' as $$
  select case
    when r is null then false
    when r in ('client', 'guest') then false
    when gtype = 'guide_service' then r in ('owner', 'admin', 'manager', 'guide')
    else r in ('owner', 'admin', 'manager', 'guide', 'member', 'blindmate')
  end;
$$;

-- Season label for a hunt date: Aug–Jul, e.g. 2026-11-12 → '2026-27'.
create or replace function public.nch_season_of(d date)
returns text language sql immutable set search_path = '' as $$
  select case when extract(month from d) >= 8
    then extract(year from d)::int::text || '-' || right((extract(year from d)::int + 1)::text, 2)
    else (extract(year from d)::int - 1)::text || '-' || right(extract(year from d)::int::text, 2)
  end;
$$;

-- ── 1. hunter types profile ──────────────────────────────────────────────

create table if not exists public.nch_profiles (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  user_types   text[] not null default '{}'
               check (user_types <@ array['blind_lease', 'guide_service', 'refuge_rat', 'duck_club']::text[]),
  display_name text check (display_name is null or char_length(display_name) <= 40),
  updated_at   timestamptz not null default now()
);

alter table public.nch_profiles enable row level security;

create policy "hunters read their own profile"
  on public.nch_profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy "hunters create their own profile"
  on public.nch_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "hunters update their own profile"
  on public.nch_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "hunters delete their own profile"
  on public.nch_profiles for delete to authenticated
  using (user_id = (select auth.uid()));

-- ── 2. typed groups + expanded roles ─────────────────────────────────────

alter table public.hunt_groups
  add column if not exists group_type text not null default 'crew',
  add column if not exists guest_day_limit integer;

alter table public.hunt_groups drop constraint if exists hunt_groups_group_type_check;
alter table public.hunt_groups add constraint hunt_groups_group_type_check
  check (group_type in ('blind_lease', 'guide_service', 'duck_club', 'crew'));
alter table public.hunt_groups drop constraint if exists hunt_groups_guest_day_limit_check;
alter table public.hunt_groups add constraint hunt_groups_guest_day_limit_check
  check (guest_day_limit is null or guest_day_limit between 0 and 365);

-- 20261111 created the role check inline (auto-named hunt_group_members_role_check).
alter table public.hunt_group_members drop constraint if exists hunt_group_members_role_check;
alter table public.hunt_group_members add constraint hunt_group_members_role_check
  check (role in ('owner', 'admin', 'manager', 'guide', 'member', 'blindmate', 'client', 'guest'));

create or replace function public.nch_group_type(gid uuid)
returns text language sql stable security definer set search_path = '' as $$
  select g.group_type from public.hunt_groups g where g.id = gid;
$$;

create or replace function public.nch_has_role(gid uuid, roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.nch_group_role(gid) = any (roles), false);
$$;

-- Can the signed-in user see results in this group? (Also: may log into it.)
create or replace function public.nch_sees_group_results(gid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.nch_role_sees_results(public.nch_group_type(gid), public.nch_group_role(gid));
$$;

create or replace function public.nch_can_manage_group(gid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.nch_has_role(gid, array['owner', 'admin', 'manager']);
$$;

-- Build a guide slate / lease schedule.
create or replace function public.nch_can_assign(gid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.nch_can_manage_group(gid)
    or (public.nch_group_type(gid) = 'guide_service' and public.nch_has_role(gid, array['guide']))
    or (public.nch_group_type(gid) in ('blind_lease', 'crew') and public.nch_has_role(gid, array['blindmate', 'member']));
$$;

-- Add / edit / delete the group's blinds. Same people who build the slate.
create or replace function public.nch_can_edit_blinds(gid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.nch_can_assign(gid);
$$;

-- Joining by code lands with the least-privileged role for the group type;
-- the owner promotes from there. (Guide services: client, never results.)
create or replace function public.join_group_by_code(code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  gid uuid;
  gtype text;
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'sign in to join a group';
  end if;
  select g.id, g.group_type into gid, gtype from public.hunt_groups g where g.invite_code = upper(btrim(code));
  if gid is null then
    raise exception 'no group with that code';
  end if;
  insert into public.hunt_group_members (group_id, user_id, role)
  values (
    gid, uid,
    case gtype when 'guide_service' then 'client' when 'blind_lease' then 'blindmate' else 'member' end
  )
  on conflict (group_id, user_id) do nothing;
  return gid;
end;
$$;

-- Member list: result readers see everyone; clients/guests see staff + themselves.
drop policy if exists "members see who is in their groups" on public.hunt_group_members;
create policy "members see who is in their groups"
  on public.hunt_group_members for select to authenticated
  using (
    public.nch_sees_group_results(group_id)
    or (
      public.nch_is_group_member(group_id)
      and (user_id = (select auth.uid()) or role in ('owner', 'admin', 'manager', 'guide'))
    )
  );

-- Owners already manage members (20261111). Let admins/managers do it too,
-- but never mint or demote an owner.
drop policy if exists "owners add members" on public.hunt_group_members;
drop policy if exists "owners change roles" on public.hunt_group_members;
drop policy if exists "owners remove members, members leave" on public.hunt_group_members;
create policy "managers add members"
  on public.hunt_group_members for insert to authenticated
  with check (public.nch_can_manage_group(group_id) and role <> 'owner');
create policy "managers change roles"
  on public.hunt_group_members for update to authenticated
  using (public.nch_can_manage_group(group_id) and role <> 'owner')
  with check (public.nch_can_manage_group(group_id) and role <> 'owner');
create policy "managers remove members, members leave"
  on public.hunt_group_members for delete to authenticated
  using (
    role <> 'owner'
    and (public.nch_can_manage_group(group_id) or user_id = (select auth.uid()))
  );

-- ── 3. roster (people on the group, with or without an account) ─────────

create table if not exists public.hunt_group_roster (
  id           text primary key check (char_length(id) between 1 and 64),
  group_id     uuid not null references public.hunt_groups (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  role         text not null default 'member'
               check (role in ('owner', 'admin', 'manager', 'guide', 'member', 'blindmate', 'client', 'guest')),
  user_id      uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists hunt_group_roster_group on public.hunt_group_roster (group_id);
create index if not exists hunt_group_roster_user on public.hunt_group_roster (user_id);

alter table public.hunt_group_roster enable row level security;

-- Result readers see the whole roster. Clients/guests see staff and themselves
-- (a client never sees the guide service's other clients).
create policy "group roster readable by role"
  on public.hunt_group_roster for select to authenticated
  using (
    public.nch_sees_group_results(group_id)
    or (
      public.nch_is_group_member(group_id)
      and (user_id = (select auth.uid()) or role in ('owner', 'admin', 'manager', 'guide'))
    )
  );
create policy "managers edit roster"
  on public.hunt_group_roster for insert to authenticated
  with check (public.nch_can_manage_group(group_id));
create policy "managers update roster"
  on public.hunt_group_roster for update to authenticated
  using (public.nch_can_manage_group(group_id))
  with check (public.nch_can_manage_group(group_id));
create policy "managers remove from roster"
  on public.hunt_group_roster for delete to authenticated
  using (public.nch_can_manage_group(group_id));

-- ── 4. blinds ────────────────────────────────────────────────────────────

create table if not exists public.blinds (
  id           text primary key check (char_length(id) between 1 and 64),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  group_id     uuid references public.hunt_groups (id) on delete set null,
  name         text not null check (char_length(btrim(name)) between 1 and 60),
  blind_type   text not null default 'other' check (blind_type in ('rice', 'woodland', 'pond', 'refuge', 'other')),
  lat          double precision check (lat is null or lat between -90 and 90),
  lng          double precision check (lng is null or lng between -180 and 180),
  access_route text check (access_route is null or char_length(access_route) <= 500),
  route_points jsonb check (route_points is null or jsonb_typeof(route_points) = 'array'),
  seats        smallint check (seats is null or seats between 1 and 50),
  property     text check (property is null or char_length(property) <= 80),
  county       text check (county is null or char_length(county) <= 40),
  water_level  text check (water_level is null or char_length(water_level) <= 80),
  notes        text check (notes is null or char_length(notes) <= 1000),
  spot_key     text check (spot_key is null or char_length(spot_key) <= 120),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((lat is null) = (lng is null))
);
create index if not exists blinds_group on public.blinds (group_id);
create index if not exists blinds_owner on public.blinds (owner_id);

alter table public.blinds enable row level security;

-- Pins, routes and water are not results: every group member (clients too —
-- they have to find the blind) can read the group's blinds.
create policy "owners and group members read blinds"
  on public.blinds for select to authenticated
  using (owner_id = (select auth.uid()) or (group_id is not null and public.nch_is_group_member(group_id)));
create policy "hunters add their own or their group's blinds"
  on public.blinds for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (group_id is null or public.nch_can_edit_blinds(group_id))
  );
create policy "blind editors update blinds"
  on public.blinds for update to authenticated
  using ((group_id is null and owner_id = (select auth.uid())) or (group_id is not null and public.nch_can_edit_blinds(group_id)))
  with check ((group_id is null and owner_id = (select auth.uid())) or (group_id is not null and public.nch_can_edit_blinds(group_id)));
create policy "blind editors delete blinds"
  on public.blinds for delete to authenticated
  using ((group_id is null and owner_id = (select auth.uid())) or (group_id is not null and public.nch_can_edit_blinds(group_id)));

-- ── 5. hunt_logs extras ──────────────────────────────────────────────────
-- Optional columns, mirrored from the payload so RLS and aggregates can see
-- them. payload stays the source of truth for the app.

alter table public.hunt_logs
  add column if not exists group_id         uuid references public.hunt_groups (id) on delete set null,
  add column if not exists blind_id         text references public.blinds (id) on delete set null,
  add column if not exists water_condition  text,
  add column if not exists field_condition  text,
  add column if not exists water_level      text,
  add column if not exists sightings        text,
  add column if not exists bands            jsonb,
  add column if not exists trophies         text,
  add column if not exists client_member_id text,
  add column if not exists client_name      text,
  add column if not exists guest_host_id    text,
  add column if not exists guest_names      text[];

alter table public.hunt_logs drop constraint if exists hunt_logs_build6_check;
alter table public.hunt_logs add constraint hunt_logs_build6_check check (
  (water_condition is null or water_condition in ('dry', 'low', 'good', 'high', 'flooded', 'frozen'))
  and (field_condition is null or field_condition in ('standing', 'cut', 'rolled', 'burned', 'flooded', 'worked'))
  and (water_level is null or char_length(water_level) <= 80)
  and (sightings is null or char_length(sightings) <= 1000)
  and (bands is null or jsonb_typeof(bands) = 'array')
  and (trophies is null or char_length(trophies) <= 500)
  and (client_name is null or char_length(client_name) <= 60)
);

create index if not exists hunt_logs_group_date on public.hunt_logs (group_id, hunt_date desc);
create index if not exists hunt_logs_blind_date on public.hunt_logs (blind_id, hunt_date desc);

-- Group read path, now role-aware. Replaces the 20261111 helper: a hunt shared
-- into a group (hunt_group_hunts) OR logged straight into it (group_id) is
-- readable only by members whose role sees results. Clients and guests: never.
create or replace function public.nch_can_read_shared_hunt(hid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.hunt_group_hunts gh
    join public.hunt_group_members m on m.group_id = gh.group_id
    join public.hunt_groups g on g.id = gh.group_id
    where gh.hunt_id = hid
      and m.user_id = (select auth.uid())
      and public.nch_role_sees_results(g.group_type, m.role)
  ) or exists (
    select 1
    from public.hunt_logs h
    join public.hunt_group_members m on m.group_id = h.group_id
    join public.hunt_groups g on g.id = h.group_id
    where h.id = hid
      and m.user_id = (select auth.uid())
      and public.nch_role_sees_results(g.group_type, m.role)
  );
$$;

drop policy if exists "group members read shared hunts" on public.hunt_logs;
create policy "group members read shared hunts"
  on public.hunt_logs for select to authenticated
  using (public.nch_can_read_shared_hunt(id));

-- Only people who may log into a group can stamp a hunt with its group_id.
-- RESTRICTIVE: ANDed with the owner-only insert/update policies from 20261106.
drop policy if exists "group hunts only from group loggers (insert)" on public.hunt_logs;
create policy "group hunts only from group loggers (insert)"
  on public.hunt_logs as restrictive for insert to authenticated
  with check (group_id is null or public.nch_sees_group_results(group_id));
drop policy if exists "group hunts only from group loggers (update)" on public.hunt_logs;
create policy "group hunts only from group loggers (update)"
  on public.hunt_logs as restrictive for update to authenticated
  using (true)
  with check (group_id is null or public.nch_sees_group_results(group_id));

-- hunt_group_hunts links are results too (which hunts, by whom).
drop policy if exists "members read shared hunt links" on public.hunt_group_hunts;
create policy "result readers see shared hunt links"
  on public.hunt_group_hunts for select to authenticated
  using (public.nch_sees_group_results(group_id));
drop policy if exists "members share their own hunts" on public.hunt_group_hunts;
create policy "group loggers share their own hunts"
  on public.hunt_group_hunts for insert to authenticated
  with check (
    public.nch_sees_group_results(group_id)
    and added_by = (select auth.uid())
    and exists (
      select 1 from public.hunt_logs h
      where h.id = hunt_id and h.user_id = (select auth.uid())
    )
  );

-- Blind performance, season by season. security_invoker: the caller's RLS on
-- hunt_logs applies, so a client/guest gets zero rows.
create or replace view public.nch_blind_season_totals
with (security_invoker = true) as
select
  h.blind_id,
  h.group_id,
  public.nch_season_of(h.hunt_date) as season,
  count(*)::int as hunts,
  coalesce(sum((select coalesce(sum(v.value::int), 0) from jsonb_each_text(coalesce(h.payload -> 'counts', '{}'::jsonb)) v)), 0)::int as birds,
  coalesce(sum(greatest(1, coalesce(jsonb_array_length(h.payload -> 'party'), 1))), 0)::int as hunter_days
from public.hunt_logs h
where h.blind_id is not null
group by h.blind_id, h.group_id, public.nch_season_of(h.hunt_date);

-- ── 6. guide slates / lease schedules ────────────────────────────────────

create table if not exists public.group_assignments (
  id                text primary key check (char_length(id) between 1 and 64),
  group_id          uuid not null references public.hunt_groups (id) on delete cascade,
  hunt_date         date not null,
  blind_id          text references public.blinds (id) on delete set null,
  guide_roster_id   text references public.hunt_group_roster (id) on delete set null,
  hunter_names      text[] not null default '{}',
  hunter_roster_ids text[] not null default '{}',
  notes             text check (notes is null or char_length(notes) <= 500),
  created_by        uuid default auth.uid() references auth.users (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists group_assignments_group_date on public.group_assignments (group_id, hunt_date);

alter table public.group_assignments enable row level security;

-- Result readers see the whole slate; a client sees only lines they're on
-- (via a roster row linked to their account) — where to be, not results.
create policy "slate readable by role"
  on public.group_assignments for select to authenticated
  using (
    public.nch_sees_group_results(group_id)
    or exists (
      select 1 from public.hunt_group_roster r
      where r.group_id = group_assignments.group_id
        and r.user_id = (select auth.uid())
        and r.id = any (group_assignments.hunter_roster_ids)
    )
  );
create policy "slate builders add lines"
  on public.group_assignments for insert to authenticated
  with check (public.nch_can_assign(group_id));
create policy "slate builders change lines"
  on public.group_assignments for update to authenticated
  using (public.nch_can_assign(group_id))
  with check (public.nch_can_assign(group_id));
create policy "slate builders remove lines"
  on public.group_assignments for delete to authenticated
  using (public.nch_can_assign(group_id));

-- ── 7. club blind draws / rotation ───────────────────────────────────────

create table if not exists public.club_draws (
  id         text primary key check (char_length(id) between 1 and 64),
  group_id   uuid not null references public.hunt_groups (id) on delete cascade,
  draw_date  date not null,
  mode       text not null check (mode in ('random', 'rotation')),
  -- [{ "memberId": roster id, "blindId": blinds.id | null, "pick": 1 }, …]
  picks      jsonb not null check (jsonb_typeof(picks) = 'array'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists club_draws_group_date on public.club_draws (group_id, draw_date desc);

alter table public.club_draws enable row level security;

-- Who drew which blind isn't a harvest result: every club member can read it.
create policy "club members read draws"
  on public.club_draws for select to authenticated
  using (public.nch_is_group_member(group_id));
create policy "managers run draws"
  on public.club_draws for insert to authenticated
  with check (public.nch_can_manage_group(group_id) and public.nch_group_type(group_id) = 'duck_club');
create policy "managers redo draws"
  on public.club_draws for update to authenticated
  using (public.nch_can_manage_group(group_id))
  with check (public.nch_can_manage_group(group_id) and public.nch_group_type(group_id) = 'duck_club');
create policy "managers delete draws"
  on public.club_draws for delete to authenticated
  using (public.nch_can_manage_group(group_id));

-- ── 8. club guest days ───────────────────────────────────────────────────

create table if not exists public.guest_days (
  id             text primary key check (char_length(id) between 1 and 64),
  group_id       uuid not null references public.hunt_groups (id) on delete cascade,
  host_roster_id text not null references public.hunt_group_roster (id) on delete cascade,
  guest_name     text not null check (char_length(btrim(guest_name)) between 1 and 60),
  hunt_date      date not null,
  hunt_id        text references public.hunt_logs (id) on delete cascade,
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists guest_days_group_host on public.guest_days (group_id, host_roster_id, hunt_date);

alter table public.guest_days enable row level security;

-- Members see the club's guest usage; guests and clients don't.
create policy "club members read guest days"
  on public.guest_days for select to authenticated
  using (public.nch_has_role(group_id, array['owner', 'admin', 'manager', 'member']));
-- Managers log for anyone; a member logs guests they host themselves.
create policy "managers or the host log guest days"
  on public.guest_days for insert to authenticated
  with check (
    public.nch_can_manage_group(group_id)
    or (
      public.nch_has_role(group_id, array['member'])
      and exists (
        select 1 from public.hunt_group_roster r
        where r.id = host_roster_id and r.group_id = guest_days.group_id and r.user_id = (select auth.uid())
      )
    )
  );
create policy "managers or the logger remove guest days"
  on public.guest_days for delete to authenticated
  using (public.nch_can_manage_group(group_id) or created_by = (select auth.uid()));

-- Per member per season usage vs. the club limit. security_invoker → same RLS.
create or replace view public.nch_guest_day_usage
with (security_invoker = true) as
select
  gd.group_id,
  gd.host_roster_id,
  public.nch_season_of(gd.hunt_date) as season,
  count(*)::int as used,
  max(g.guest_day_limit) as guest_day_limit
from public.guest_days gd
join public.hunt_groups g on g.id = gd.group_id
group by gd.group_id, gd.host_roster_id, public.nch_season_of(gd.hunt_date);

-- ── grants ───────────────────────────────────────────────────────────────

revoke all on function public.nch_role_sees_results(text, text) from public, anon;
revoke all on function public.nch_season_of(date) from public, anon;
revoke all on function public.nch_group_type(uuid) from public, anon;
revoke all on function public.nch_has_role(uuid, text[]) from public, anon;
revoke all on function public.nch_sees_group_results(uuid) from public, anon;
revoke all on function public.nch_can_manage_group(uuid) from public, anon;
revoke all on function public.nch_can_assign(uuid) from public, anon;
revoke all on function public.nch_can_edit_blinds(uuid) from public, anon;
revoke all on function public.join_group_by_code(text) from public, anon;
grant execute on function public.nch_role_sees_results(text, text) to authenticated;
grant execute on function public.nch_season_of(date) to authenticated;
grant execute on function public.nch_group_type(uuid) to authenticated;
grant execute on function public.nch_has_role(uuid, text[]) to authenticated;
grant execute on function public.nch_sees_group_results(uuid) to authenticated;
grant execute on function public.nch_can_manage_group(uuid) to authenticated;
grant execute on function public.nch_can_assign(uuid) to authenticated;
grant execute on function public.nch_can_edit_blinds(uuid) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;

revoke all on public.nch_profiles, public.hunt_group_roster, public.blinds, public.group_assignments,
  public.club_draws, public.guest_days from anon;
revoke all on public.nch_blind_season_totals, public.nch_guest_day_usage from anon;
grant select, insert, update, delete on public.nch_profiles to authenticated;
grant select, insert, update, delete on public.hunt_group_roster to authenticated;
grant select, insert, update, delete on public.blinds to authenticated;
grant select, insert, update, delete on public.group_assignments to authenticated;
grant select, insert, update, delete on public.club_draws to authenticated;
grant select, insert, delete on public.guest_days to authenticated;
grant select on public.nch_blind_season_totals, public.nch_guest_day_usage to authenticated;

commit;
