-- ============================================================================
-- DO NOT APPLY without Chris OK.
-- DO NOT APPLY until 20261106_hunt_logs_auth.sql (hunt_logs auth lockdown)
-- has been applied and verified first. This file depends on hunt_logs.user_id
-- and on the anon policies on hunt_logs being gone.
-- ============================================================================
-- NorCalHunt Build 5 · guide / blind groups (server side, for later).
--
-- Build 5 ships groups LOCAL-ONLY (mobile/lib/groups.ts, AsyncStorage). The app
-- does not read or write any of these tables yet. Once lockdown is live and
-- this is applied, the app can sync groups and let members read each other's
-- hunts that were tagged to a shared group.
--
-- Shape:
--   hunt_groups         a named group; one owner; unique invite code
--   hunt_group_members  (group, user) with role owner | guide | member
--   hunt_group_spots    spot keys the group runs (matches huntLog.spotKey)
--   hunt_group_hunts    hunt_logs rows a member shared into the group
--
-- Access (authenticated only; anon gets nothing):
--   - read a group, its members, spots and shared hunts → you're a member
--   - create a group → you become its owner (trigger adds the member row)
--   - rename / delete group, add / remove / re-role members → owner only
--   - add / remove spots → owner or guide
--   - share a hunt → member, and the hunt must be your own (hunt_logs.user_id)
--   - un-share → whoever shared it, or the owner
--   - leave a group → delete your own member row (owner can't leave; delete the group)
--   - join → rpc join_group_by_code(code), adds you as 'member'
--   - hunt_logs: one extra SELECT policy so members can read hunts shared into
--     their groups. Insert/update/delete on hunt_logs stay owner-only.
--
-- Membership checks go through SECURITY DEFINER helpers so the member-table
-- policies don't recurse into themselves.
-- team_code is NOT used for access anywhere.

begin;

-- ── tables ────────────────────────────────────────────────────────────────

create table if not exists public.hunt_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$'),
  created_at  timestamptz not null default now()
);

create table if not exists public.hunt_group_members (
  group_id     uuid not null references public.hunt_groups (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'guide', 'member')),
  display_name text check (display_name is null or char_length(display_name) <= 40),
  joined_at    timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists hunt_group_members_user on public.hunt_group_members (user_id);

create table if not exists public.hunt_group_spots (
  group_id   uuid not null references public.hunt_groups (id) on delete cascade,
  spot_key   text not null check (char_length(spot_key) <= 120),
  label      text check (label is null or char_length(label) <= 80),
  added_by   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, spot_key)
);

create table if not exists public.hunt_group_hunts (
  group_id   uuid not null references public.hunt_groups (id) on delete cascade,
  hunt_id    text not null references public.hunt_logs (id) on delete cascade,
  added_by   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, hunt_id)
);
create index if not exists hunt_group_hunts_hunt on public.hunt_group_hunts (hunt_id);

-- ── helpers (security definer, fixed search_path) ─────────────────────────

create or replace function public.nch_is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.hunt_group_members m
    where m.group_id = gid and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.nch_group_role(gid uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.hunt_group_members m
  where m.group_id = gid and m.user_id = (select auth.uid());
$$;

create or replace function public.nch_can_read_shared_hunt(hid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.hunt_group_hunts gh
    join public.hunt_group_members m on m.group_id = gh.group_id
    where gh.hunt_id = hid and m.user_id = (select auth.uid())
  );
$$;

-- Owner gets a member row automatically.
create or replace function public.nch_add_group_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.hunt_group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

drop trigger if exists hunt_groups_add_owner on public.hunt_groups;
create trigger hunt_groups_add_owner
  after insert on public.hunt_groups
  for each row execute function public.nch_add_group_owner();

-- Join by invite code. Returns the group id, or raises if the code is unknown.
create or replace function public.join_group_by_code(code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  gid uuid;
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'sign in to join a group';
  end if;
  select g.id into gid from public.hunt_groups g where g.invite_code = upper(btrim(code));
  if gid is null then
    raise exception 'no group with that code';
  end if;
  insert into public.hunt_group_members (group_id, user_id, role)
  values (gid, uid, 'member')
  on conflict (group_id, user_id) do nothing;
  return gid;
end;
$$;

revoke all on function public.nch_is_group_member(uuid) from public, anon;
revoke all on function public.nch_group_role(uuid) from public, anon;
revoke all on function public.nch_can_read_shared_hunt(text) from public, anon;
revoke all on function public.nch_add_group_owner() from public, anon, authenticated;
revoke all on function public.join_group_by_code(text) from public, anon;
grant execute on function public.nch_is_group_member(uuid) to authenticated;
grant execute on function public.nch_group_role(uuid) to authenticated;
grant execute on function public.nch_can_read_shared_hunt(text) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.hunt_groups enable row level security;
alter table public.hunt_group_members enable row level security;
alter table public.hunt_group_spots enable row level security;
alter table public.hunt_group_hunts enable row level security;

-- hunt_groups
create policy "members read their groups"
  on public.hunt_groups for select to authenticated
  using (public.nch_is_group_member(id) or owner_id = (select auth.uid()));
create policy "anyone signed in creates a group they own"
  on public.hunt_groups for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "owners rename their group"
  on public.hunt_groups for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "owners delete their group"
  on public.hunt_groups for delete to authenticated
  using (owner_id = (select auth.uid()));

-- hunt_group_members
create policy "members see who is in their groups"
  on public.hunt_group_members for select to authenticated
  using (public.nch_is_group_member(group_id));
create policy "owners add members"
  on public.hunt_group_members for insert to authenticated
  with check (public.nch_group_role(group_id) = 'owner' and role <> 'owner');
create policy "owners change roles"
  on public.hunt_group_members for update to authenticated
  using (public.nch_group_role(group_id) = 'owner' and role <> 'owner')
  with check (public.nch_group_role(group_id) = 'owner' and role <> 'owner');
create policy "owners remove members, members leave"
  on public.hunt_group_members for delete to authenticated
  using (
    role <> 'owner'
    and (public.nch_group_role(group_id) = 'owner' or user_id = (select auth.uid()))
  );

-- hunt_group_spots
create policy "members read group spots"
  on public.hunt_group_spots for select to authenticated
  using (public.nch_is_group_member(group_id));
create policy "owners and guides add spots"
  on public.hunt_group_spots for insert to authenticated
  with check (public.nch_group_role(group_id) in ('owner', 'guide') and added_by = (select auth.uid()));
create policy "owners and guides remove spots"
  on public.hunt_group_spots for delete to authenticated
  using (public.nch_group_role(group_id) in ('owner', 'guide'));

-- hunt_group_hunts
create policy "members read shared hunt links"
  on public.hunt_group_hunts for select to authenticated
  using (public.nch_is_group_member(group_id));
create policy "members share their own hunts"
  on public.hunt_group_hunts for insert to authenticated
  with check (
    public.nch_is_group_member(group_id)
    and added_by = (select auth.uid())
    and exists (
      select 1 from public.hunt_logs h
      where h.id = hunt_id and h.user_id = (select auth.uid())
    )
  );
create policy "sharer or owner un-shares"
  on public.hunt_group_hunts for delete to authenticated
  using (added_by = (select auth.uid()) or public.nch_group_role(group_id) = 'owner');

-- hunt_logs: group members may READ hunts shared into their groups.
-- (Owner-only insert/update/delete from 20261106 are unchanged.)
drop policy if exists "group members read shared hunts" on public.hunt_logs;
create policy "group members read shared hunts"
  on public.hunt_logs for select to authenticated
  using (public.nch_can_read_shared_hunt(id));

-- ── grants ────────────────────────────────────────────────────────────────

revoke all on public.hunt_groups, public.hunt_group_members, public.hunt_group_spots, public.hunt_group_hunts from anon;
grant select, insert, update, delete on public.hunt_groups to authenticated;
grant select, insert, update, delete on public.hunt_group_members to authenticated;
grant select, insert, delete on public.hunt_group_spots to authenticated;
grant select, insert, delete on public.hunt_group_hunts to authenticated;

commit;
