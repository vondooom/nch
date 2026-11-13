import { KEYS, readJSON, writeJSON } from "./storage";
import type { HuntLog } from "./huntLog";

// Groups: a blind lease crew, a guide service, a duck club, or a plain crew.
// A group names its people (roster), the spots and blinds it runs, and the
// hunts tagged to it — one combined logbook.
//
// LOCAL ONLY until the NorCalHunt Supabase project exists and the migrations
// under supabase/migrations/ are applied there (none are applied yet). Group
// membership, roles and group-hunt links live in AsyncStorage; team_code is
// NOT used as an access list. Server shape for later:
//   20261111_guide_groups.sql, 20261112_user_types_blinds_assignments.sql.

export type GroupType = "blind_lease" | "guide_service" | "duck_club" | "crew";

export type GroupRole = "owner" | "admin" | "manager" | "guide" | "member" | "blindmate" | "client" | "guest";

/** A person on the group's roster. Not necessarily an app account. */
export type GroupMember = { id: string; name: string; role: GroupRole };

export type HuntGroup = {
  id: string;
  name: string;
  /** Build 6. Groups saved before Build 6 load as "crew" (or guide_service if they had guides). */
  type: GroupType;
  /** This phone created the group (vs. noted an invite code from someone else). */
  owner: boolean;
  /** Local code to hand out. Becomes the real join code once the NorCalHunt DB is live. */
  inviteCode: string;
  members: GroupMember[];
  /** Roster id of the person using this phone. */
  meId?: string;
  /** Spot keys from huntLog.spotKey — the areas this group runs. */
  spotKeys: string[];
  /** HuntLog ids tagged to this group on this phone. */
  huntIds: string[];
  /** Duck clubs: guest days each member may use per season. */
  guestDayLimit?: number;
  /** Supabase auth user id when signed in at creation; for a later sync. */
  ownerUserId: string | null;
  createdAt: number;
};

export const GROUP_TYPES: { id: GroupType; label: string; blurb: string }[] = [
  { id: "blind_lease", label: "Blind lease", blurb: "Blindmates share one log and see every bird." },
  { id: "guide_service", label: "Guide service", blurb: "Owner + guides log and see results. Clients don't." },
  { id: "duck_club", label: "Duck club", blurb: "Club-wide log, blind draw, guest days. Manager runs the draw." },
  { id: "crew", label: "Crew", blurb: "A hunting crew sharing a logbook." },
];

export const GROUP_TYPE_LABEL = Object.fromEntries(GROUP_TYPES.map((t) => [t.id, t.label])) as Record<GroupType, string>;

export const ROLE_LABEL: Record<GroupRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  guide: "Guide",
  member: "Member",
  blindmate: "Blindmate",
  client: "Client",
  guest: "Guest",
};

/** Roles that make sense per group type, in tap-to-cycle order (owner is fixed). */
export const ROLES_FOR: Record<GroupType, GroupRole[]> = {
  blind_lease: ["blindmate", "admin", "guest"],
  guide_service: ["guide", "admin", "client"],
  duck_club: ["member", "manager", "admin", "guest"],
  crew: ["member", "guide", "admin", "guest"],
};

export const defaultRole = (t: GroupType): GroupRole => ROLES_FOR[t][0];

export const GROUPS_LOCAL_LINE =
  "Groups stay on this phone until the NorCalHunt database is set up. Sharing with other hunters turns on after that.";

// No 0/O/1/I so a code read aloud in a sweat line survives.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeInviteCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

export function cleanInviteCode(s: string): string {
  const raw = s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return raw.length > 3 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : raw;
}

const ALL_ROLES = new Set<string>(Object.keys(ROLE_LABEL));
const ALL_TYPES = new Set<string>(GROUP_TYPES.map((t) => t.id));

/** Bring a stored group up to the Build 6 shape. Safe to run twice. */
export function migrateGroup(raw: HuntGroup): HuntGroup {
  const members: GroupMember[] = (Array.isArray(raw.members) ? raw.members : []).map((m) => ({
    ...m,
    role: ALL_ROLES.has(m.role) ? m.role : "member",
  }));
  const type: GroupType = ALL_TYPES.has(raw.type)
    ? raw.type
    : members.some((m) => m.role === "guide")
      ? "guide_service"
      : "crew";
  const meId =
    raw.meId && members.some((m) => m.id === raw.meId)
      ? raw.meId
      : members.find((m) => m.name === "Me")?.id ?? members.find((m) => m.role === "owner")?.id;
  return {
    ...raw,
    type,
    members,
    meId,
    spotKeys: Array.isArray(raw.spotKeys) ? raw.spotKeys : [],
    huntIds: Array.isArray(raw.huntIds) ? raw.huntIds : [],
    ownerUserId: raw.ownerUserId ?? null,
  };
}

export async function loadGroups(): Promise<HuntGroup[]> {
  return (await readJSON<HuntGroup[]>(KEYS.groups, [])).map(migrateGroup);
}

export async function saveGroups(list: HuntGroup[]): Promise<void> {
  await writeJSON(KEYS.groups, list);
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export const toggleSpot = (g: HuntGroup, key: string): HuntGroup => ({ ...g, spotKeys: toggle(g.spotKeys, key) });
export const toggleHunt = (g: HuntGroup, id: string): HuntGroup => ({ ...g, huntIds: toggle(g.huntIds, id) });

/** Drop links to hunts that were deleted from the logbook. */
export function pruneGroups(groups: HuntGroup[], huntIds: Set<string>): HuntGroup[] {
  let changed = false;
  const next = groups.map((g) => {
    const kept = g.huntIds.filter((id) => huntIds.has(id));
    if (kept.length === g.huntIds.length) return g;
    changed = true;
    return { ...g, huntIds: kept };
  });
  return changed ? next : groups;
}

/** Hunts in a group's shared log: tagged by id, or logged with this groupId. */
export function groupHunts(g: HuntGroup, hunts: HuntLog[]): HuntLog[] {
  const ids = new Set(g.huntIds);
  return hunts.filter((h) => ids.has(h.id) || h.groupId === g.id);
}

/** Make sure a hunt saved with a groupId is also in that group's huntIds (and only that group's). */
export function linkHuntToGroup(groups: HuntGroup[], huntId: string, groupId: string | undefined): HuntGroup[] {
  return groups.map((g) => {
    const has = g.huntIds.includes(huntId);
    if (g.id === groupId && !has) return { ...g, huntIds: [...g.huntIds, huntId] };
    return g;
  });
}

export function myRole(g: HuntGroup): GroupRole {
  return g.members.find((m) => m.id === g.meId)?.role ?? (g.owner ? "owner" : defaultRole(g.type));
}

export const memberName = (g: HuntGroup | undefined, id: string | undefined) => (g && id ? g.members.find((m) => m.id === id)?.name ?? "" : "");
