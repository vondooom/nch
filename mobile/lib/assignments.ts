import { KEYS, readJSON, writeJSON } from "./storage";

// Daily slate. For a guide service: which guide takes which clients to which
// blind on a date. For a blind lease or crew: the hunt schedule — who is in
// the blind on which morning. One shape, two jobs.
//
// LOCAL ONLY (nch.assignments.v1) until the NorCalHunt database is set up;
// server shape is public.group_assignments in 20261112_user_types_blinds_assignments.sql.

export type Assignment = {
  id: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  blindId?: string;
  /** Roster id of the guide running the blind (guide services). */
  guideMemberId?: string;
  /** Clients (guide service) or hunters (lease schedule), as typed. */
  hunters: string[];
  notes?: string;
  createdAt: number;
};

export async function loadAssignments(): Promise<Assignment[]> {
  const raw = await readJSON<Assignment[]>(KEYS.assignments, []);
  return sortAssignments(Array.isArray(raw) ? raw.filter((a) => a && a.id && a.groupId && a.date) : []);
}

export async function saveAssignments(list: Assignment[]): Promise<void> {
  await writeJSON(KEYS.assignments, list);
}

/** Soonest first. */
export function sortAssignments(list: Assignment[]): Assignment[] {
  return [...list].sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
}

export const upcoming = (list: Assignment[], today: string) => list.filter((a) => a.date >= today);
