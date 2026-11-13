import { HuntLog, seasonOf } from "./huntLog";
import { KEYS, readJSON, writeJSON } from "./storage";

// Duck club guest days. Each member gets `guestDayLimit` per season (set on
// the club group). A guest day is one guest on one date with one host. Logged
// two ways: straight from the club panel, or by naming guests on a club hunt
// (those rows carry huntId and follow the hunt when it's edited or deleted).
//
// LOCAL ONLY (nch.guestDays.v1) until the NorCalHunt database is set up;
// server shape is public.guest_days in 20261112_user_types_blinds_assignments.sql.

export type GuestDay = {
  id: string;
  groupId: string;
  /** Roster id of the hosting member. */
  memberId: string;
  guestName: string;
  date: string;
  /** Set when the guest day came from a logged hunt. */
  huntId?: string;
  createdAt: number;
};

export const DEFAULT_GUEST_LIMIT = 6;

export async function loadGuestDays(): Promise<GuestDay[]> {
  const raw = await readJSON<GuestDay[]>(KEYS.guestDays, []);
  return Array.isArray(raw) ? raw.filter((g) => g && g.id && g.groupId && g.memberId) : [];
}

export async function saveGuestDays(list: GuestDay[]): Promise<void> {
  await writeJSON(KEYS.guestDays, list);
}

/** Guest days a member has used in the season containing `day`. */
export function guestDaysUsed(list: GuestDay[], groupId: string, memberId: string, day: string): number {
  const season = seasonOf(day);
  return list.filter((g) => g.groupId === groupId && g.memberId === memberId && seasonOf(g.date) === season).length;
}

export type GuestLevel = "ok" | "near" | "at" | "over";

export function guestLevel(used: number, limit: number): GuestLevel {
  if (used > limit) return "over";
  if (used === limit) return "at";
  if (used === limit - 1) return "near";
  return "ok";
}

/** Replace the guest days that came from this hunt with what the hunt says now. */
export function syncGuestDaysForHunt(list: GuestDay[], h: HuntLog, makeId: () => string): GuestDay[] {
  const kept = list.filter((g) => g.huntId !== h.id);
  const names = (h.guestNames ?? []).map((n) => n.trim()).filter(Boolean);
  if (!h.groupId || !h.guestHostId || !names.length) return kept;
  return [
    ...kept,
    ...names.map((guestName) => ({ id: makeId(), groupId: h.groupId!, memberId: h.guestHostId!, guestName, date: h.date, huntId: h.id, createdAt: Date.now() })),
  ];
}

export const dropGuestDaysForHunt = (list: GuestDay[], huntId: string) => list.filter((g) => g.huntId !== huntId);
