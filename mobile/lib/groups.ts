import { KEYS, readJSON, writeJSON } from "./storage";

// Guide / blind groups. A guide names a group, adds the spots they run, lists
// the hunters in it, and tags hunts to it — one combined logbook per blind.
//
// LOCAL ONLY until the hunt_logs auth lockdown
// (supabase/migrations/20261106_hunt_logs_auth.sql) is applied. The live
// hunt_logs table still has permissive anon policies, so nothing here goes to
// the cloud: group membership and group-hunt links live in AsyncStorage, the
// HuntLog shape is untouched, and team_code is NOT used as an access list.
// The server-side shape for later is in
// supabase/migrations/20261111_guide_groups.sql (NOT applied).

export type GroupRole = "owner" | "guide" | "member";

export type GroupMember = { id: string; name: string; role: GroupRole };

export type HuntGroup = {
  id: string;
  name: string;
  /** This phone created the group (vs. noted an invite code from someone else). */
  owner: boolean;
  /** Local code to hand out. Becomes the real join code after lockdown. */
  inviteCode: string;
  members: GroupMember[];
  /** Spot keys from huntLog.spotKey — the blinds / areas this group runs. */
  spotKeys: string[];
  /** HuntLog ids tagged to this group on this phone. */
  huntIds: string[];
  /** Supabase auth user id when signed in at creation; for a later sync. */
  ownerUserId: string | null;
  createdAt: number;
};

export const GROUPS_LOCAL_LINE =
  "Groups stay on this phone until we lock down accounts. Sharing with other hunters turns on after that.";

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

export async function loadGroups(): Promise<HuntGroup[]> {
  return readJSON<HuntGroup[]>(KEYS.groups, []);
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
