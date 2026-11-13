import { KEYS, readJSON, writeJSON } from "./storage";

// Club blind draw / rotation. The manager runs it for a date: random shuffle,
// or rotation (each draw shifts the member order one place so everyone gets a
// turn at the good blinds). Members see the result. Hot blinds are shown at
// draw time from lib/blinds.ts hotBlinds().
//
// LOCAL ONLY (nch.clubDraws.v1) until the NorCalHunt database is set up;
// server shape is public.club_draws in 20261112_user_types_blinds_assignments.sql.

export type DrawMode = "random" | "rotation";

export type ClubDrawPick = { memberId: string; blindId: string | null; pick: number };

export type ClubDraw = {
  id: string;
  groupId: string;
  date: string;
  mode: DrawMode;
  picks: ClubDrawPick[];
  createdAt: number;
};

export async function loadClubDraws(): Promise<ClubDraw[]> {
  const raw = await readJSON<ClubDraw[]>(KEYS.clubDraws, []);
  return Array.isArray(raw) ? raw.filter((d) => d && d.id && d.groupId && Array.isArray(d.picks)) : [];
}

export async function saveClubDraws(list: ClubDraw[]): Promise<void> {
  await writeJSON(KEYS.clubDraws, list);
}

function shuffle<T>(a: T[]): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Member pick order for a draw. Random: shuffled. Rotation: the roster order
 * shifted by how many draws this group has already run, so the first pick
 * walks down the roster draw by draw. Blinds are then handed out in
 * `blindOrder` (hottest first), one member per blind; extra members wait.
 */
export function runClubDraw(
  groupId: string,
  date: string,
  mode: DrawMode,
  memberIds: string[],
  blindOrder: string[],
  prior: ClubDraw[],
  id: string,
): ClubDraw {
  let order = memberIds.slice();
  if (mode === "random") order = shuffle(order);
  else if (order.length) {
    const n = prior.filter((d) => d.groupId === groupId).length % order.length;
    order = [...order.slice(n), ...order.slice(0, n)];
  }
  return {
    id,
    groupId,
    date,
    mode,
    picks: order.map((memberId, i) => ({ memberId, blindId: blindOrder[i] ?? null, pick: i + 1 })),
    createdAt: Date.now(),
  };
}

/** Newest draw for a group (by date, then created). */
export function latestDraw(list: ClubDraw[], groupId: string): ClubDraw | null {
  return list
    .filter((d) => d.groupId === groupId)
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))[0] ?? null;
}
