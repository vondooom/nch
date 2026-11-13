import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { cleanTypes, UserTypeId } from "./userTypes";
import { GroupRole, GroupType, HuntGroup, makeInviteCode, ROLES_FOR } from "./groups";
import { HuntLog, migrateHunt } from "./huntLog";
import { HuntView, viewHunt, ViewerContext, ViewerGroup } from "./privacy";
import { HANDLE_RE, isVisibility, MyProfile, Visibility } from "./profile";
import { getSupabase, isSupabaseConfigured } from "./supabase";

// Connect: hunter profiles, follows / friends, group invites, and other
// hunters' logbooks. Everything here talks to the NorCalHunt server, which
// doesn't exist yet. Every call checks isSupabaseConfigured FIRST and returns
// a typed { ok: false, reason: "off" } without touching getSupabase() (which
// throws when unconfigured). Point EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY at the
// NorCalHunt project with 20261113_social.sql applied and this lights up.
//
// FOLLOW MODEL (public.nch_follows):
//   One row per direction: follower → followee, status pending | accepted | declined.
//   - Sending = insert a pending row as yourself.
//   - Only the followee accepts or declines.
//   - Either side deletes: unfollow / cancel (follower) or remove follower (followee).
//   - A declined row stays so the inbox stays quiet; the sender can delete it
//     and ask again (requestFollow does that).
//   - FRIENDS = accepted both ways. Friends see "Friends" entries; a one-way
//     accepted follow sees only "Public" ones. Following gets you the feed.

export const CONNECT_OFF_LINE = "Connect needs the NorCalHunt server — coming soon.";
export const CONNECT_OFF_SUB =
  "Your profile and logbook privacy save on this phone now. Search, friends, the feed and group invites turn on once the server's up.";
export const CONNECT_SIGN_IN = "Sign in to find hunters and share your log.";

// ── result type ──────────────────────────────────────────────────────────

export type Fail = { ok: false; reason: "off" | "signed_out" | "error"; message: string };
export type Result<T> = { ok: true; data: T } | Fail;

const OFF: Fail = { ok: false, reason: "off", message: CONNECT_OFF_LINE };
const SIGNED_OUT: Fail = { ok: false, reason: "signed_out", message: CONNECT_SIGN_IN };
const err = (message: string): Fail => ({ ok: false, reason: "error", message });
const ok = <T,>(data: T): Result<T> => ({ ok: true, data });

/** "off" | "signed_out" | "ready" — for screens choosing which state to draw. */
export type ConnectState = "off" | "signed_out" | "ready";
export const connectState = (session: Session | null): ConnectState => (!isSupabaseConfigured ? "off" : session ? "ready" : "signed_out");

/**
 * The only way into the client from this module. Unconfigured → OFF, and
 * getSupabase() is never reached. Signed out → SIGNED_OUT.
 */
async function withSession<T>(fn: (sb: SupabaseClient, uid: string) => Promise<Result<T>>): Promise<Result<T>> {
  if (!isSupabaseConfigured) return OFF;
  try {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return SIGNED_OUT;
    return await fn(sb, uid);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ── profiles ─────────────────────────────────────────────────────────────

export type HunterProfile = {
  userId: string;
  handle: string;
  displayName: string;
  homeArea: string;
  userTypes: UserTypeId[];
};

type ProfileRow = { user_id: string; handle: string | null; display_name: string | null; home_area: string | null; user_types: string[] | null };
const PROFILE_COLS = "user_id, handle, display_name, home_area, user_types";

const toProfile = (r: ProfileRow): HunterProfile => ({
  userId: r.user_id,
  handle: r.handle ?? "",
  displayName: r.display_name ?? "",
  homeArea: r.home_area ?? "",
  userTypes: cleanTypes(r.user_types ?? []),
});

export const hunterName = (p: Pick<HunterProfile, "displayName" | "handle">) => p.displayName || (p.handle ? `@${p.handle}` : "Hunter");

/** Push this phone's profile to the server. Handle clash → a plain message. */
export function saveServerProfile(p: MyProfile, types: UserTypeId[]): Promise<Result<HunterProfile>> {
  return withSession(async (sb, uid) => {
    const { data, error } = await sb
      .from("nch_profiles")
      .upsert(
        {
          user_id: uid,
          handle: p.handle || null,
          display_name: p.displayName || null,
          home_area: p.homeArea || null,
          user_types: types,
          logbook_privacy: p.logbookPrivacy,
        },
        { onConflict: "user_id" },
      )
      .select(PROFILE_COLS)
      .single();
    if (error) return err(error.code === "23505" ? `@${p.handle} is taken — try another.` : error.message);
    return ok(toProfile(data as ProfileRow));
  });
}

/** The signed-in hunter's server profile (to fill an empty form on a new phone). */
export function fetchMyServerProfile(): Promise<Result<(HunterProfile & { logbookPrivacy: Visibility }) | null>> {
  return withSession(async (sb, uid) => {
    const { data, error } = await sb.from("nch_profiles").select(`${PROFILE_COLS}, logbook_privacy`).eq("user_id", uid).maybeSingle();
    if (error) return err(error.message);
    if (!data) return ok(null);
    const row = data as ProfileRow & { logbook_privacy: string | null };
    return ok({ ...toProfile(row), logbookPrivacy: isVisibility(row.logbook_privacy) ? row.logbook_privacy : "friends" });
  });
}

/**
 * Hunters whose older entries have no override pick up a new default on the
 * server too (the payload keeps "unset"; the row column is what RLS reads).
 */
export function applyDefaultPrivacy(v: Visibility): Promise<Result<null>> {
  return withSession(async (sb, uid) => {
    const { error } = await sb.from("hunt_logs").update({ visibility: v }).eq("user_id", uid).is("payload->>visibility", null);
    return error ? err(error.message) : ok(null);
  });
}

/** Name or handle. Server-side search (nch_search_hunters) — nothing is cached or invented here. */
export function searchHunters(q: string): Promise<Result<HunterProfile[]>> {
  const query = q.trim().replace(/^@/, "").slice(0, 40);
  if (query.length < 2) return Promise.resolve(ok([]));
  return withSession(async (sb, uid) => {
    const { data, error } = await sb.rpc("nch_search_hunters", { q: query, lim: 25 });
    if (error) return err(error.message);
    return ok(((data ?? []) as ProfileRow[]).map(toProfile).filter((p) => p.userId !== uid));
  });
}

// ── follows ──────────────────────────────────────────────────────────────

export type FollowStatus = "pending" | "accepted" | "declined";

export type Relationship = {
  /** My follow of them. */
  iFollow: FollowStatus | null;
  /** Their follow of me. */
  followsMe: FollowStatus | null;
  isFriend: boolean;
  /** My groups they're also in. */
  groups: ViewerGroup[];
};

export type HunterCard = HunterProfile & { followers: number; following: number; rel: Relationship; isMe: boolean };

type RelJson = {
  i_follow: FollowStatus | null;
  follows_me: FollowStatus | null;
  is_friend: boolean;
  groups: { group_id: string; group_type: GroupType; viewer_role: GroupRole; with_author: boolean }[] | null;
};

const toGroups = (g: RelJson["groups"]): ViewerGroup[] =>
  (g ?? []).map((x) => ({ groupId: x.group_id, type: x.group_type, viewerRole: x.viewer_role, withAuthor: !!x.with_author }));

const toRel = (r: RelJson | null): Relationship => ({
  iFollow: r?.i_follow ?? null,
  followsMe: r?.follows_me ?? null,
  isFriend: !!r?.is_friend,
  groups: toGroups(r?.groups ?? null),
});

/** Profile + counts + how they relate to me. By user id or handle. */
export function getHunter(idOrHandle: { userId?: string; handle?: string }): Promise<Result<HunterCard | null>> {
  return withSession(async (sb, uid) => {
    let q = sb.from("nch_profiles").select(PROFILE_COLS);
    if (idOrHandle.userId) q = q.eq("user_id", idOrHandle.userId);
    else if (idOrHandle.handle && HANDLE_RE.test(idOrHandle.handle)) q = q.eq("handle", idOrHandle.handle);
    else return ok(null);
    const { data, error } = await q.maybeSingle();
    if (error) return err(error.message);
    if (!data) return ok(null);
    const p = toProfile(data as ProfileRow);
    const [counts, rel] = await Promise.all([
      sb.rpc("nch_follow_counts", { target: p.userId }),
      sb.rpc("nch_relationship", { other: p.userId }),
    ]);
    if (counts.error) return err(counts.error.message);
    if (rel.error) return err(rel.error.message);
    const c = (Array.isArray(counts.data) ? counts.data[0] : counts.data) as { followers: number; following: number } | null;
    return ok({ ...p, followers: c?.followers ?? 0, following: c?.following ?? 0, rel: toRel(rel.data as RelJson), isMe: p.userId === uid });
  });
}

/** Ask to follow. A declined ask is cleared and sent fresh. */
export function requestFollow(target: string): Promise<Result<FollowStatus>> {
  return withSession(async (sb, uid) => {
    if (target === uid) return err("That's you.");
    const { data: existing, error: readErr } = await sb
      .from("nch_follows")
      .select("status")
      .eq("follower_id", uid)
      .eq("followee_id", target)
      .maybeSingle();
    if (readErr) return err(readErr.message);
    const st = (existing as { status: FollowStatus } | null)?.status;
    if (st === "pending" || st === "accepted") return ok(st);
    if (st === "declined") {
      const { error } = await sb.from("nch_follows").delete().eq("follower_id", uid).eq("followee_id", target);
      if (error) return err(error.message);
    }
    const { error } = await sb.from("nch_follows").insert({ follower_id: uid, followee_id: target, status: "pending" });
    return error ? err(error.message) : ok("pending");
  });
}

/** Accept or decline someone's request to follow me. */
export function respondToFollow(follower: string, accept: boolean): Promise<Result<FollowStatus>> {
  return withSession(async (sb, uid) => {
    const status: FollowStatus = accept ? "accepted" : "declined";
    const { error } = await sb
      .from("nch_follows")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("follower_id", follower)
      .eq("followee_id", uid);
    return error ? err(error.message) : ok(status);
  });
}

/** Unfollow / cancel my request. */
export function unfollow(target: string): Promise<Result<null>> {
  return withSession(async (sb, uid) => {
    const { error } = await sb.from("nch_follows").delete().eq("follower_id", uid).eq("followee_id", target);
    return error ? err(error.message) : ok(null);
  });
}

/** Drop someone from my followers (they lose Friends-level access). */
export function removeFollower(follower: string): Promise<Result<null>> {
  return withSession(async (sb, uid) => {
    const { error } = await sb.from("nch_follows").delete().eq("follower_id", follower).eq("followee_id", uid);
    return error ? err(error.message) : ok(null);
  });
}

/** Unfriend = both directions gone. */
export async function unfriend(other: string): Promise<Result<null>> {
  const a = await unfollow(other);
  if (!a.ok) return a;
  return removeFollower(other);
}

export type FollowEntry = { profile: HunterProfile; status: FollowStatus; createdAt: string };

export type FollowLists = {
  /** People asking to follow me. */
  incoming: FollowEntry[];
  /** My asks still waiting. */
  outgoing: FollowEntry[];
  followers: FollowEntry[];
  following: FollowEntry[];
};

/** Everything on my side of the follow graph, with profiles. RLS only returns rows I'm on. */
export function myFollows(): Promise<Result<FollowLists>> {
  return withSession(async (sb, uid) => {
    const { data, error } = await sb
      .from("nch_follows")
      .select("follower_id, followee_id, status, created_at")
      .or(`follower_id.eq.${uid},followee_id.eq.${uid}`)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return err(error.message);
    const rows = (data ?? []) as { follower_id: string; followee_id: string; status: FollowStatus; created_at: string }[];
    const ids = [...new Set(rows.map((r) => (r.follower_id === uid ? r.followee_id : r.follower_id)))];
    const profiles = new Map<string, HunterProfile>();
    if (ids.length) {
      const res = await sb.from("nch_profiles").select(PROFILE_COLS).in("user_id", ids);
      if (res.error) return err(res.error.message);
      ((res.data ?? []) as ProfileRow[]).forEach((r) => profiles.set(r.user_id, toProfile(r)));
    }
    const entry = (other: string, r: (typeof rows)[number]): FollowEntry => ({
      profile: profiles.get(other) ?? { userId: other, handle: "", displayName: "", homeArea: "", userTypes: [] },
      status: r.status,
      createdAt: r.created_at,
    });
    const out: FollowLists = { incoming: [], outgoing: [], followers: [], following: [] };
    for (const r of rows) {
      if (r.followee_id === uid) {
        if (r.status === "pending") out.incoming.push(entry(r.follower_id, r));
        else if (r.status === "accepted") out.followers.push(entry(r.follower_id, r));
      } else {
        if (r.status === "pending") out.outgoing.push(entry(r.followee_id, r));
        else if (r.status === "accepted") out.following.push(entry(r.followee_id, r));
      }
    }
    return ok(out);
  });
}

// ── logbooks + feed ──────────────────────────────────────────────────────

export type FeedItem = { author: HunterProfile; view: HuntView };

type HuntRow = {
  author_id: string;
  handle: string | null;
  display_name: string | null;
  home_area: string | null;
  user_types: string[] | null;
  hunt_id: string;
  hunt_date: string;
  visibility: string;
  group_ids: string[] | null;
  payload: HuntLog;
  is_friend: boolean;
  viewer_groups: RelJson["groups"];
};

/**
 * Server rows → redacted views. The server already filtered and redacted
 * (nch_visible_hunts); this runs the same rules again through lib/privacy.ts
 * so a server slip can't put a blind name on screen.
 */
function toFeed(rows: HuntRow[], viewerId: string): FeedItem[] {
  const out: FeedItem[] = [];
  for (const r of rows) {
    const ctx: ViewerContext = { viewerId, authorId: r.author_id, isFriend: !!r.is_friend, groups: toGroups(r.viewer_groups) };
    const hunt = migrateHunt({ ...(r.payload ?? ({} as HuntLog)), id: r.hunt_id, date: r.hunt_date });
    const view = viewHunt(ctx, hunt, { visibility: isVisibility(r.visibility) ? r.visibility : "only_me", groupIds: r.group_ids ?? [] });
    if (!view) continue;
    out.push({
      author: toProfile({ user_id: r.author_id, handle: r.handle, display_name: r.display_name, home_area: r.home_area, user_types: r.user_types }),
      view,
    });
  }
  return out;
}

/** One hunter's entries I'm allowed to see. */
export function hunterLog(authorId: string, limit = 50): Promise<Result<FeedItem[]>> {
  return withSession(async (sb, uid) => {
    const { data, error } = await sb.rpc("nch_visible_hunts", { author: authorId, lim: limit });
    if (error) return err(error.message);
    return ok(toFeed((data ?? []) as HuntRow[], uid));
  });
}

/** Recent hunts from people I follow, as far as each one lets me see. */
export function friendFeed(limit = 50): Promise<Result<FeedItem[]>> {
  return withSession(async (sb, uid) => {
    const { data, error } = await sb.rpc("nch_visible_hunts", { author: null, lim: limit });
    if (error) return err(error.message);
    return ok(toFeed((data ?? []) as HuntRow[], uid));
  });
}

// ── group invites ────────────────────────────────────────────────────────
// A manager (owner / admin / manager) mints a code for ONE role. The server
// generates the code (10 chars from a 32-letter alphabet ≈ 50 bits), stores
// expiry + max uses, and redeems through nch_redeem_invite, which re-checks
// everything and can't hand out owner or a role above the inviter's.

export const INVITE_DAYS = [1, 7, 14] as const;
export const DEFAULT_INVITE_DAYS = 7;
export const INVITE_PREFIX = "norcalhunt://invite/";

/** Roles an inviter may hand out, per Build 6 rules. Never owner; never above yourself. */
export function invitableRoles(type: GroupType, myRole: GroupRole): GroupRole[] {
  const all = ROLES_FOR[type];
  if (myRole === "owner") return all;
  if (myRole === "admin") return all.filter((r) => r !== "admin");
  if (myRole === "manager") return all.filter((r) => r !== "admin" && r !== "manager");
  return [];
}

// Invite codes: XXXXX-XXXXX, same no-0/O/1/I alphabet as group codes.
const INVITE_RE = /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

export function cleanInviteInput(s: string): string {
  const raw = s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
}

/** Link, "invite/CODE", or the bare code someone typed → CODE, or null. */
export function parseInviteInput(s: string): string | null {
  const m = s.trim().match(/invite\/([A-Za-z0-9-]+)/);
  const code = cleanInviteInput(m ? m[1] : s);
  return INVITE_RE.test(code) ? code : null;
}

export const inviteLink = (code: string) => `${INVITE_PREFIX}${code}`;

export function inviteShareText(groupName: string, role: GroupRole, code: string, expiresAt: string): string {
  const until = new Date(expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `Join ${groupName} on NorCalHunt as ${role}: ${inviteLink(code)}\nLink not opening? NorCalHunt → Field Desk → Connect → Have a code, and type ${code}. Good till ${until}.`;
}

export type GroupInvite = {
  id: string;
  code: string;
  role: GroupRole;
  expiresAt: string;
  maxUses: number | null;
  uses: number;
  revoked: boolean;
};

export type InviteStatus = "open" | "expired" | "revoked" | "used_up";

export const inviteStatus = (i: Pick<GroupInvite, "expiresAt" | "maxUses" | "uses" | "revoked">): InviteStatus =>
  i.revoked ? "revoked" : Date.parse(i.expiresAt) <= Date.now() ? "expired" : i.maxUses != null && i.uses >= i.maxUses ? "used_up" : "open";

type InviteRow = { id: string; code: string; role: GroupRole; expires_at: string; max_uses: number | null; uses: number; revoked_at: string | null };
const toInvite = (r: InviteRow): GroupInvite => ({
  id: r.id,
  code: r.code,
  role: r.role,
  expiresAt: r.expires_at,
  maxUses: r.max_uses,
  uses: r.uses,
  revoked: !!r.revoked_at,
});

/**
 * Put a local group on the server so it can have invites. Owner only; the
 * server row gets the same name, type and 6-char group code. Returns the
 * server id to keep on the local group (HuntGroup.serverId).
 */
export function publishGroup(g: HuntGroup): Promise<Result<string>> {
  if (g.serverId) return Promise.resolve(ok(g.serverId));
  return withSession(async (sb, uid) => {
    if (!g.owner) return err("Only the group's owner can put it on the server.");
    // Local codes are random; on the rare clash, roll a new one.
    for (let i = 0; i < 3; i++) {
      const { data, error } = await sb
        .from("hunt_groups")
        .insert({
          name: g.name,
          owner_id: uid,
          group_type: g.type,
          guest_day_limit: g.guestDayLimit ?? null,
          invite_code: i === 0 ? g.inviteCode : makeInviteCode(),
        })
        .select("id")
        .single();
      if (!error) return ok((data as { id: string }).id);
      if (error.code !== "23505") return err(error.message);
    }
    return err("Couldn't get a free group code — try again.");
  });
}

export function createInvite(serverGroupId: string, role: GroupRole, days: number, maxUses: number | null): Promise<Result<GroupInvite>> {
  return withSession(async (sb) => {
    const { data, error } = await sb.rpc("nch_create_invite", { gid: serverGroupId, invite_role: role, valid_days: days, uses_allowed: maxUses });
    if (error) return err(error.message);
    const row = (Array.isArray(data) ? data[0] : data) as InviteRow | null;
    return row ? ok(toInvite(row)) : err("No invite came back.");
  });
}

/** Invites for a group I manage (RLS: managers only). */
export function listInvites(serverGroupId: string): Promise<Result<GroupInvite[]>> {
  return withSession(async (sb) => {
    const { data, error } = await sb
      .from("nch_group_invites")
      .select("id, code, role, expires_at, max_uses, uses, revoked_at")
      .eq("group_id", serverGroupId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return err(error.message);
    return ok(((data ?? []) as InviteRow[]).map(toInvite));
  });
}

export function revokeInvite(inviteId: string): Promise<Result<null>> {
  return withSession(async (sb) => {
    const { error } = await sb.from("nch_group_invites").update({ revoked_at: new Date().toISOString() }).eq("id", inviteId);
    return error ? err(error.message) : ok(null);
  });
}

/** What the accept screen shows: group name/type and the role on offer. No roster. */
export type InvitePeek = {
  groupId: string;
  groupName: string;
  groupType: GroupType;
  role: GroupRole;
  expiresAt: string;
  status: InviteStatus;
  alreadyMember: boolean;
};

export function peekInvite(code: string): Promise<Result<InvitePeek | null>> {
  return withSession(async (sb) => {
    const { data, error } = await sb.rpc("nch_peek_invite", { p_code: code });
    if (error) return err(error.message);
    const r = (Array.isArray(data) ? data[0] : data) as {
      group_id: string;
      group_name: string;
      group_type: GroupType;
      role: GroupRole;
      expires_at: string;
      status: InviteStatus;
      already_member: boolean;
    } | null;
    if (!r) return ok(null);
    return ok({
      groupId: r.group_id,
      groupName: r.group_name,
      groupType: r.group_type,
      role: r.role,
      expiresAt: r.expires_at,
      status: r.status,
      alreadyMember: !!r.already_member,
    });
  });
}

/** Join. The server validates expiry, uses, role and membership, then adds me to members + roster. */
export function redeemInvite(code: string): Promise<Result<{ groupId: string; role: GroupRole }>> {
  return withSession(async (sb) => {
    const { data, error } = await sb.rpc("nch_redeem_invite", { p_code: code });
    if (error) return err(error.message);
    const r = (Array.isArray(data) ? data[0] : data) as { group_id: string; role: GroupRole } | null;
    return r ? ok({ groupId: r.group_id, role: r.role }) : err("Couldn't join with that code.");
  });
}
