-- ============================================================================
-- NOT APPLIED. DO NOT APPLY without Chris OK.
-- Do not `supabase db push`, psql, or paste this into any project's SQL editor.
-- For a FUTURE, dedicated NorCalHunt Supabase project ONLY. Never run this
-- against any other app's project.
--
-- Apply order on the NorCalHunt project:
--   supabase/schema.sql
--   migrations/20261106_hunt_logs_auth.sql
--   migrations/20261111_guide_groups.sql
--   migrations/20261112_user_types_blinds_assignments.sql
--   migrations/20261113_social.sql                         ← this file
-- ============================================================================
-- NorCalHunt Build 7 · Connect: hunter profiles, follows / friends, group
-- invites, logbook privacy.
--
-- App side: mobile/lib/social.ts (queries, all gated on isSupabaseConfigured),
-- mobile/lib/privacy.ts (the same visibility + redaction rules, client side),
-- mobile/lib/profile.ts (local profile, nch.profile.v1).
--
-- 1. PROFILES. nch_profiles (20261112) gains handle, home_area and
--    logbook_privacy. Handles are lowercase, 3–20 chars, start with a letter;
--    unique case-insensitively. Any signed-in hunter can read profiles (search
--    needs it); there is no email on this table. Writes stay owner-only.
--
-- 2. FOLLOWS (nch_follows). One row per direction, follower → followee, status
--    pending | accepted | declined. You send only as yourself and only
--    'pending'; only the followee accepts/declines (and can touch nothing but
--    status/responded_at); either party deletes (unfollow, cancel, remove).
--    FRIENDS = accepted in both directions. Following someone (accepted) puts
--    their visible hunts in your feed.
--
-- 3. LOGBOOK PRIVACY. hunt_logs.visibility = only_me | groups | friends |
--    public — a real column so RLS can use it (the app also keeps it in the
--    payload, where unset means "follow my default"). Who sees an entry:
--      owner                                       always
--      client/guest in any group the hunt is in    NEVER (Build 6 rule; RESTRICTIVE
--                                                  policy below, nothing overrides it)
--      group read path from 20261112               unchanged: result readers of the
--                                                  hunt's own group see the group log
--      groups+                                     group-mates (share any group with
--                                                  the author, not as client/guest)
--      friends+                                    + mutual accepted follows
--      public                                      + any authenticated hunter
--    GPS / blind names / notes ("detail") are for the owner and group-mates
--    only. Friends and public viewers DO NOT get a base-table SELECT policy on
--    hunt_logs — a policy can only hand out whole rows, and the payload carries
--    blind names, notes and party names. They read through
--    nch_visible_hunts(), a security-definer function that applies the same
--    visibility rules and returns the payload already redacted
--    (nch_redact_hunt_payload). Group-mates may read the base table: they're
--    entitled to the detail anyway.
--
-- 4. GROUP INVITES (nch_group_invites). Owner / admin / manager mint a code for
--    one role via nch_create_invite(): the server generates the code
--    (XXXXX-XXXXX, 32-letter alphabet, ~50 bits), expiry 1–30 days, optional
--    max uses. The role must be valid for the group type and never above the
--    inviter (owner: any non-owner role; admin: not admin; manager: not admin
--    or manager). Clients and guests can't invite. Anyone signed in who holds a
--    code can peek (group name, type, offered role, status — never the roster)
--    and redeem through nch_redeem_invite(), which re-checks expiry, uses,
--    revocation, the inviter's CURRENT role and existing membership, then adds
--    the hunter to hunt_group_members + hunt_group_roster. An invite never
--    changes the role of someone already in the group. Deep link:
--    norcalhunt://invite/<code>.
--
-- Nothing here drops a protection from 20261106 / 20261111 / 20261112. The
-- only replaced policy is "hunters read their own profile" (widened on
-- purpose for search — see section 1).

begin;

-- ── shared helpers ───────────────────────────────────────────────────────

create or replace function public.nch_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── 1. profiles ──────────────────────────────────────────────────────────

alter table public.nch_profiles
  add column if not exists handle          text,
  add column if not exists home_area       text,
  add column if not exists logbook_privacy text not null default 'friends';

alter table public.nch_profiles drop constraint if exists nch_profiles_handle_check;
alter table public.nch_profiles add constraint nch_profiles_handle_check
  check (handle is null or handle ~ '^[a-z][a-z0-9_]{2,19}$');
alter table public.nch_profiles drop constraint if exists nch_profiles_home_area_check;
alter table public.nch_profiles add constraint nch_profiles_home_area_check
  check (home_area is null or char_length(home_area) <= 60);
alter table public.nch_profiles drop constraint if exists nch_profiles_logbook_privacy_check;
alter table public.nch_profiles add constraint nch_profiles_logbook_privacy_check
  check (logbook_privacy in ('only_me', 'groups', 'friends', 'public'));

-- The CHECK already forces lowercase; lower() keeps uniqueness case-insensitive
-- even if the CHECK is ever relaxed.
create unique index if not exists nch_profiles_handle_lower_key
  on public.nch_profiles (lower(handle)) where handle is not null;
create index if not exists nch_profiles_display_name_lower
  on public.nch_profiles (lower(display_name) text_pattern_ops);

drop trigger if exists nch_profiles_touch on public.nch_profiles;
create trigger nch_profiles_touch
  before update on public.nch_profiles
  for each row execute function public.nch_touch_updated_at();

-- Search needs other hunters' handle / name / home area / types. Insert,
-- update and delete stay owner-only (20261112 policies, untouched).
drop policy if exists "hunters read their own profile" on public.nch_profiles;
drop policy if exists "signed-in hunters read profiles" on public.nch_profiles;
create policy "signed-in hunters read profiles"
  on public.nch_profiles for select to authenticated
  using (true);

-- Name or handle search. security invoker → the profile RLS above applies.
-- LIKE wildcards in the query are escaped; 2+ characters; max 50 rows.
create or replace function public.nch_search_hunters(q text, lim integer default 25)
returns setof public.nch_profiles
language sql stable security invoker set search_path = '' as $$
  with t as (
    select lower(btrim(regexp_replace(coalesce(q, ''), '^@+', ''))) as s
  ), e as (
    select s, replace(replace(replace(s, '\', '\\'), '%', '\%'), '_', '\_') as esc from t
  )
  select p.*
  from public.nch_profiles p, e
  where char_length(e.s) >= 2
    and (p.handle is not null or p.display_name is not null)
    and (p.handle like e.esc || '%' or lower(p.display_name) like '%' || e.esc || '%')
  order by coalesce(p.handle = e.s, false) desc, p.handle asc nulls last, p.display_name asc
  limit least(greatest(coalesce(lim, 25), 1), 50);
$$;

-- ── 2. follows ───────────────────────────────────────────────────────────

create table if not exists public.nch_follows (
  follower_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  followee_id  uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists nch_follows_followee on public.nch_follows (followee_id, status);
create index if not exists nch_follows_follower on public.nch_follows (follower_id, status);

alter table public.nch_follows enable row level security;

create policy "hunters read follows they are part of"
  on public.nch_follows for select to authenticated
  using (follower_id = (select auth.uid()) or followee_id = (select auth.uid()));
create policy "hunters send follow requests as themselves"
  on public.nch_follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and status = 'pending');
-- Column grants below limit this to status / responded_at.
create policy "followee accepts or declines"
  on public.nch_follows for update to authenticated
  using (followee_id = (select auth.uid()))
  with check (followee_id = (select auth.uid()) and status in ('accepted', 'declined'));
create policy "either side ends a follow"
  on public.nch_follows for delete to authenticated
  using (follower_id = (select auth.uid()) or followee_id = (select auth.uid()));

-- Mutual accepted follow with the signed-in user.
create or replace function public.nch_is_friend(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.nch_follows a
    join public.nch_follows b on b.follower_id = a.followee_id and b.followee_id = a.follower_id
    where a.follower_id = (select auth.uid()) and a.followee_id = other
      and a.status = 'accepted' and b.status = 'accepted'
  );
$$;

-- Counts only — who follows whom stays private to the two people involved.
create or replace function public.nch_follow_counts(target uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'followers', (select count(*) from public.nch_follows f where f.followee_id = target and f.status = 'accepted'),
    'following', (select count(*) from public.nch_follows f where f.follower_id = target and f.status = 'accepted')
  );
$$;

-- Signed-in user shares a group with `other`, as anything but client/guest.
create or replace function public.nch_shares_group_with(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.hunt_group_members me
    join public.hunt_group_members them on them.group_id = me.group_id
    where me.user_id = (select auth.uid())
      and them.user_id = other
      and me.role not in ('client', 'guest')
  );
$$;

-- How the signed-in user relates to `other`: follow both ways, friend, and
-- the groups they share (with MY role there). Only shared groups are listed.
create or replace function public.nch_relationship(other uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'i_follow', (select f.status from public.nch_follows f where f.follower_id = (select auth.uid()) and f.followee_id = other),
    'follows_me', (select f.status from public.nch_follows f where f.follower_id = other and f.followee_id = (select auth.uid())),
    'is_friend', public.nch_is_friend(other),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object('group_id', g.id, 'group_type', g.group_type, 'viewer_role', me.role, 'with_author', true))
      from public.hunt_group_members me
      join public.hunt_group_members them on them.group_id = me.group_id and them.user_id = other
      join public.hunt_groups g on g.id = me.group_id
      where me.user_id = (select auth.uid())
    ), '[]'::jsonb)
  );
$$;

-- ── 3. logbook privacy on hunt_logs ──────────────────────────────────────

-- Existing rows default to only_me: nothing becomes visible until the owner's
-- phone re-syncs with their chosen setting.
alter table public.hunt_logs
  add column if not exists visibility text not null default 'only_me';
alter table public.hunt_logs drop constraint if exists hunt_logs_visibility_check;
alter table public.hunt_logs add constraint hunt_logs_visibility_check
  check (visibility in ('only_me', 'groups', 'friends', 'public'));
create index if not exists hunt_logs_user_visibility_date on public.hunt_logs (user_id, visibility, hunt_date desc);

-- Is the signed-in user in a group this hunt belongs to (logged into or shared
-- to) in a role that doesn't see results there? Then they never see the hunt.
create or replace function public.nch_hunt_blocked_for_viewer(hid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from (
      select h.group_id as gid from public.hunt_logs h where h.id = hid and h.group_id is not null
      union
      select gh.group_id from public.hunt_group_hunts gh where gh.hunt_id = hid
    ) hg
    join public.hunt_group_members m on m.group_id = hg.gid and m.user_id = (select auth.uid())
    join public.hunt_groups g on g.id = hg.gid
    where not public.nch_role_sees_results(g.group_type, m.role)
  );
$$;

-- Visibility rule (mirrors canSeeEntry in mobile/lib/privacy.ts).
create or replace function public.nch_can_see_hunt(hid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case
      when (select auth.uid()) is null then false
      when h.user_id = (select auth.uid()) then true
      when h.user_id is null then false
      when public.nch_hunt_blocked_for_viewer(h.id) then false
      when h.visibility = 'groups' then public.nch_shares_group_with(h.user_id)
      when h.visibility = 'friends' then public.nch_shares_group_with(h.user_id) or public.nch_is_friend(h.user_id)
      when h.visibility = 'public' then true
      else false
    end
    from public.hunt_logs h
    where h.id = hid
  ), false);
$$;

-- Detail rule (mirrors seesDetail): owner, or a group-mate who can see it.
create or replace function public.nch_sees_hunt_detail(hid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select h.user_id = (select auth.uid())
      or (public.nch_can_see_hunt(h.id) and public.nch_shares_group_with(h.user_id))
    from public.hunt_logs h
    where h.id = hid
  ), false);
$$;

-- What friends / public get: birds, weather, conditions, the coarse area the
-- owner's phone stamped (payload.coarseArea) — no spot or blind names, notes,
-- sightings, party / client / guest names, bands or team code.
create or replace function public.nch_redact_hunt_payload(p jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select (p - array[
      'locationName', 'blind', 'blindId', 'groupId', 'notes', 'sightings', 'waterLevel',
      'party', 'bands', 'trophies', 'teamCode', 'clientMemberId', 'clientName',
      'guestHostId', 'guestNames', 'photo'
    ])
    || jsonb_build_object(
      'partySize', greatest(1, coalesce(jsonb_array_length(case when jsonb_typeof(p -> 'party') = 'array' then p -> 'party' end), 1)),
      'bandCount', coalesce(jsonb_array_length(case when jsonb_typeof(p -> 'bands') = 'array' then p -> 'bands' end), 0),
      'redacted', true
    );
$$;

-- Group-mates read entries shared with groups or wider, straight from the
-- table (they get the detail anyway). Friends/public: nch_visible_hunts().
drop policy if exists "group-mates read hunts shared with groups" on public.hunt_logs;
create policy "group-mates read hunts shared with groups"
  on public.hunt_logs for select to authenticated
  using (
    visibility <> 'only_me'
    and user_id is not null
    and public.nch_shares_group_with(user_id)
    and not public.nch_hunt_blocked_for_viewer(id)
  );

-- RESTRICTIVE: ANDed with every SELECT policy on hunt_logs (own, group read
-- path, the one above). A client or guest in a hunt's group never gets the
-- row, whatever its visibility. The owner always does.
drop policy if exists "clients and guests never read group hunts" on public.hunt_logs;
create policy "clients and guests never read group hunts"
  on public.hunt_logs as restrictive for select to authenticated
  using (user_id = (select auth.uid()) or not public.nch_hunt_blocked_for_viewer(id));

-- One hunter's visible entries (author set) or the feed (author null = people
-- I follow, accepted). Never my own; never only_me. Detail viewers get the
-- payload minus the photo path; everyone else gets it redacted.
create or replace function public.nch_visible_hunts(author uuid default null, lim integer default 50)
returns table (
  author_id     uuid,
  handle        text,
  display_name  text,
  home_area     text,
  user_types    text[],
  hunt_id       text,
  hunt_date     date,
  visibility    text,
  group_ids     uuid[],
  payload       jsonb,
  is_friend     boolean,
  viewer_groups jsonb
)
language sql stable security definer set search_path = '' as $$
  with me as (select (select auth.uid()) as uid),
  picked as (
    select h.*
    from public.hunt_logs h, me
    where me.uid is not null
      and h.user_id is not null
      and h.user_id <> me.uid
      and h.visibility <> 'only_me'
      and (
        (nch_visible_hunts.author is not null and h.user_id = nch_visible_hunts.author)
        or (
          nch_visible_hunts.author is null
          and exists (
            select 1 from public.nch_follows f
            where f.follower_id = me.uid and f.followee_id = h.user_id and f.status = 'accepted'
          )
        )
      )
      and public.nch_can_see_hunt(h.id)
    order by h.hunt_date desc, h.created_at desc
    limit least(greatest(coalesce(nch_visible_hunts.lim, 50), 1), 200)
  )
  select
    h.user_id,
    p.handle,
    p.display_name,
    p.home_area,
    p.user_types,
    h.id,
    h.hunt_date,
    h.visibility,
    array(
      select hg.gid from (
        select h.group_id as gid where h.group_id is not null
        union
        select gh.group_id from public.hunt_group_hunts gh where gh.hunt_id = h.id
      ) hg
      where exists (select 1 from public.hunt_group_members m where m.group_id = hg.gid and m.user_id = (select uid from me))
    ),
    case when public.nch_sees_hunt_detail(h.id) then h.payload - 'photo' else public.nch_redact_hunt_payload(h.payload) end,
    public.nch_is_friend(h.user_id),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'group_id', m.group_id,
        'group_type', g.group_type,
        'viewer_role', m.role,
        'with_author', exists (select 1 from public.hunt_group_members a where a.group_id = m.group_id and a.user_id = h.user_id)
      ))
      from public.hunt_group_members m
      join public.hunt_groups g on g.id = m.group_id
      where m.user_id = (select uid from me)
        and (
          exists (select 1 from public.hunt_group_members a where a.group_id = m.group_id and a.user_id = h.user_id)
          or m.group_id = h.group_id
          or exists (select 1 from public.hunt_group_hunts gh where gh.group_id = m.group_id and gh.hunt_id = h.id)
        )
    ), '[]'::jsonb)
  from picked h
  left join public.nch_profiles p on p.user_id = h.user_id
  order by h.hunt_date desc, h.created_at desc;
$$;

-- ── 4. group invites ─────────────────────────────────────────────────────

-- Roles that exist per group type (mirrors ROLES_FOR in mobile/lib/groups.ts).
create or replace function public.nch_role_valid_for(gtype text, r text)
returns boolean language sql immutable set search_path = '' as $$
  select case gtype
    when 'blind_lease'   then r in ('blindmate', 'admin', 'guest')
    when 'guide_service' then r in ('guide', 'admin', 'client')
    when 'duck_club'     then r in ('member', 'manager', 'admin', 'guest')
    when 'crew'          then r in ('member', 'guide', 'admin', 'guest')
    else false
  end;
$$;

-- May someone holding `inviter_role` hand out `r` in a group of `gtype`?
-- Never owner, never above yourself (mirrors invitableRoles in lib/social.ts).
create or replace function public.nch_inviter_may_grant(inviter_role text, gtype text, r text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(
    r <> 'owner'
    and public.nch_role_valid_for(gtype, r)
    and case inviter_role
      when 'owner'   then true
      when 'admin'   then r <> 'admin'
      when 'manager' then r not in ('admin', 'manager')
      else false
    end,
    false
  );
$$;

create table if not exists public.nch_group_invites (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.hunt_groups (id) on delete cascade,
  code       text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$'),
  role       text not null check (role in ('admin', 'manager', 'guide', 'member', 'blindmate', 'client', 'guest')),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses   integer check (max_uses is null or max_uses between 1 and 100),
  uses       integer not null default 0 check (uses >= 0),
  revoked_at timestamptz,
  check (expires_at > created_at and expires_at <= created_at + interval '30 days')
);
create index if not exists nch_group_invites_group on public.nch_group_invites (group_id, created_at desc);

create table if not exists public.nch_group_invite_redemptions (
  invite_id   uuid not null references public.nch_group_invites (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (invite_id, user_id)
);

alter table public.nch_group_invites enable row level security;
alter table public.nch_group_invite_redemptions enable row level security;

-- Managers list and revoke. No INSERT grant: invites are minted only through
-- nch_create_invite() so the server picks the code. No DELETE: revoke instead.
create policy "managers list their group's invites"
  on public.nch_group_invites for select to authenticated
  using (public.nch_can_manage_group(group_id));
create policy "managers revoke their group's invites"
  on public.nch_group_invites for update to authenticated
  using (public.nch_can_manage_group(group_id))
  with check (public.nch_can_manage_group(group_id));
create policy "managers see who used their invites"
  on public.nch_group_invite_redemptions for select to authenticated
  using (exists (
    select 1 from public.nch_group_invites i
    where i.id = invite_id and public.nch_can_manage_group(i.group_id)
  ));

create or replace function public.nch_create_invite(gid uuid, invite_role text, valid_days integer default 7, uses_allowed integer default null)
returns public.nch_group_invites
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid      uuid := (select auth.uid());
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  -- uuid v4 bytes 6 and 8 carry version/variant bits; skip them.
  idx      constant int[] := array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11];
  b        bytea;
  c        text;
  k        int;
  inv      public.nch_group_invites;
begin
  if uid is null then
    raise exception 'sign in to invite hunters';
  end if;
  if not public.nch_inviter_may_grant(public.nch_group_role(gid), public.nch_group_type(gid), invite_role) then
    raise exception 'you can''t invite that role to this group' using errcode = '42501';
  end if;
  if valid_days is null or valid_days < 1 or valid_days > 30 then
    raise exception 'invites last 1 to 30 days';
  end if;
  if uses_allowed is not null and (uses_allowed < 1 or uses_allowed > 100) then
    raise exception 'max uses is 1 to 100';
  end if;
  for attempt in 1..5 loop
    b := uuid_send(gen_random_uuid());
    c := '';
    foreach k in array idx loop
      -- 256 is a multiple of 32, so the low 5 bits are uniform.
      c := c || substr(alphabet, (get_byte(b, k) % 32) + 1, 1);
    end loop;
    c := substr(c, 1, 5) || '-' || substr(c, 6, 5);
    begin
      insert into public.nch_group_invites (group_id, code, role, created_by, expires_at, max_uses)
      values (gid, c, invite_role, uid, now() + make_interval(days => valid_days), uses_allowed)
      returning * into inv;
      return inv;
    exception when unique_violation then
      -- vanishingly rare; roll again
    end;
  end loop;
  raise exception 'couldn''t mint an invite code — try again';
end;
$$;

-- What the accept screen shows. Group name / type, offered role, status.
-- Never the roster. 50-bit codes make guessing impractical.
create or replace function public.nch_peek_invite(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when (select auth.uid()) is null then null else (
    select jsonb_build_object(
      'group_id', g.id,
      'group_name', g.name,
      'group_type', g.group_type,
      'role', i.role,
      'expires_at', i.expires_at,
      'status', case
        when i.revoked_at is not null then 'revoked'
        when i.expires_at <= now() then 'expired'
        when i.max_uses is not null and i.uses >= i.max_uses then 'used_up'
        else 'open'
      end,
      'already_member', exists (
        select 1 from public.hunt_group_members m where m.group_id = g.id and m.user_id = (select auth.uid())
      )
    )
    from public.nch_group_invites i
    join public.hunt_groups g on g.id = i.group_id
    where i.code = upper(btrim(p_code))
  ) end;
$$;

create or replace function public.nch_redeem_invite(p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid          uuid := (select auth.uid());
  inv          public.nch_group_invites;
  gtype        text;
  inviter_role text;
  existing     text;
  v_name       text;
begin
  if uid is null then
    raise exception 'sign in to join a group';
  end if;
  select * into inv from public.nch_group_invites i where i.code = upper(btrim(p_code)) for update;
  if not found then
    raise exception 'no invite with that code';
  end if;
  if inv.revoked_at is not null then
    raise exception 'that invite was cancelled';
  end if;
  if inv.expires_at <= now() then
    raise exception 'that invite has expired';
  end if;
  if inv.max_uses is not null and inv.uses >= inv.max_uses then
    raise exception 'that invite has been used up';
  end if;
  select g.group_type into gtype from public.hunt_groups g where g.id = inv.group_id;
  -- The inviter's role NOW: a demoted or removed inviter's codes stop working.
  select m.role into inviter_role from public.hunt_group_members m
    where m.group_id = inv.group_id and m.user_id = inv.created_by;
  if not public.nch_inviter_may_grant(inviter_role, gtype, inv.role) then
    raise exception 'that invite is no longer valid';
  end if;
  -- Already in: keep the role you have. An invite never promotes or demotes.
  select m.role into existing from public.hunt_group_members m
    where m.group_id = inv.group_id and m.user_id = uid;
  if existing is not null then
    return jsonb_build_object('group_id', inv.group_id, 'role', existing, 'already_member', true);
  end if;

  insert into public.hunt_group_members (group_id, user_id, role)
  values (inv.group_id, uid, inv.role);

  select coalesce(nullif(btrim(p.display_name), ''), p.handle) into v_name
    from public.nch_profiles p where p.user_id = uid;
  insert into public.hunt_group_roster (id, group_id, display_name, role, user_id)
  values ('inv-' || replace(gen_random_uuid()::text, '-', ''), inv.group_id, left(coalesce(v_name, 'Hunter'), 40), inv.role, uid);

  insert into public.nch_group_invite_redemptions (invite_id, user_id) values (inv.id, uid)
  on conflict (invite_id, user_id) do nothing;
  update public.nch_group_invites set uses = uses + 1 where id = inv.id;

  return jsonb_build_object('group_id', inv.group_id, 'role', inv.role, 'already_member', false);
end;
$$;

-- ── grants ───────────────────────────────────────────────────────────────

revoke all on function public.nch_touch_updated_at() from public, anon, authenticated;
revoke all on function public.nch_search_hunters(text, integer) from public, anon;
revoke all on function public.nch_is_friend(uuid) from public, anon;
revoke all on function public.nch_follow_counts(uuid) from public, anon;
revoke all on function public.nch_shares_group_with(uuid) from public, anon;
revoke all on function public.nch_relationship(uuid) from public, anon;
revoke all on function public.nch_hunt_blocked_for_viewer(text) from public, anon;
revoke all on function public.nch_can_see_hunt(text) from public, anon;
revoke all on function public.nch_sees_hunt_detail(text) from public, anon;
revoke all on function public.nch_redact_hunt_payload(jsonb) from public, anon;
revoke all on function public.nch_visible_hunts(uuid, integer) from public, anon;
revoke all on function public.nch_role_valid_for(text, text) from public, anon;
revoke all on function public.nch_inviter_may_grant(text, text, text) from public, anon;
revoke all on function public.nch_create_invite(uuid, text, integer, integer) from public, anon;
revoke all on function public.nch_peek_invite(text) from public, anon;
revoke all on function public.nch_redeem_invite(text) from public, anon;

grant execute on function public.nch_search_hunters(text, integer) to authenticated;
grant execute on function public.nch_is_friend(uuid) to authenticated;
grant execute on function public.nch_follow_counts(uuid) to authenticated;
grant execute on function public.nch_shares_group_with(uuid) to authenticated;
grant execute on function public.nch_relationship(uuid) to authenticated;
grant execute on function public.nch_hunt_blocked_for_viewer(text) to authenticated;
grant execute on function public.nch_can_see_hunt(text) to authenticated;
grant execute on function public.nch_sees_hunt_detail(text) to authenticated;
grant execute on function public.nch_redact_hunt_payload(jsonb) to authenticated;
grant execute on function public.nch_visible_hunts(uuid, integer) to authenticated;
grant execute on function public.nch_role_valid_for(text, text) to authenticated;
grant execute on function public.nch_inviter_may_grant(text, text, text) to authenticated;
grant execute on function public.nch_create_invite(uuid, text, integer, integer) to authenticated;
grant execute on function public.nch_peek_invite(text) to authenticated;
grant execute on function public.nch_redeem_invite(text) to authenticated;

revoke all on public.nch_follows, public.nch_group_invites, public.nch_group_invite_redemptions from anon;
-- nch_profiles grants from 20261112 stand (authenticated: select/insert/update/delete).
grant select, insert, delete on public.nch_follows to authenticated;
grant update (status, responded_at) on public.nch_follows to authenticated;
grant select on public.nch_group_invites to authenticated;
grant update (revoked_at) on public.nch_group_invites to authenticated;
grant select on public.nch_group_invite_redemptions to authenticated;

commit;
