import { KEYS, readJSON, writeJSON } from "./storage";

// Sweat-line draw log. Every morning at a Type A area the line draws numbers;
// this keeps a hunter's history of what they drew and what spot it got them.
//
// LOCAL ONLY. Stored in AsyncStorage. When signed in we stamp `userId` so the
// rows can sync to a per-user table after the auth lockdown — but nothing here
// uploads, and draws never go to `hunt_logs` or any other open table.

export type Draw = {
  id: string;
  /** REFUGES id, or null for a custom area name. */
  refugeId: string | null;
  areaName: string;
  date: string;          // YYYY-MM-DD hunt date
  /** Draw number / line position as the hunter heard it (e.g. "14", "2nd card"). */
  drawNumber: string;
  /** Spot / pond / blind they took (optional). */
  spot: string;
  notes: string;
  /** Supabase auth user id when signed in at save time; for a later per-user sync. */
  userId: string | null;
  createdAt: number;
  updatedAt?: number;
};

export const DRAWS_LOCAL_LINE = "Draws stay on this phone for now — no cloud upload until the NorCalHunt database is set up.";

export async function loadDraws(): Promise<Draw[]> {
  return sortDraws(await readJSON<Draw[]>(KEYS.draws, []));
}

export async function saveDraws(list: Draw[]): Promise<void> {
  await writeJSON(KEYS.draws, list);
}

export function sortDraws(list: Draw[]): Draw[] {
  return [...list].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
}

/** First integer in the draw text, for averages ("#14" → 14). Null if none. */
export function drawNum(d: Draw): number | null {
  const m = d.drawNumber.match(/\d+/);
  return m ? Number(m[0]) : null;
}

export type DrawSummary = { areaName: string; count: number; best: number | null; avg: number | null };

export function drawSummary(list: Draw[]): DrawSummary[] {
  const by = new Map<string, Draw[]>();
  list.forEach((d) => {
    const k = d.refugeId ?? `custom:${d.areaName.trim().toLowerCase()}`;
    by.set(k, [...(by.get(k) ?? []), d]);
  });
  return [...by.values()]
    .map((ds) => {
      const nums = ds.map(drawNum).filter((n): n is number => n != null);
      return {
        areaName: ds[0].areaName,
        count: ds.length,
        best: nums.length ? Math.min(...nums) : null,
        avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null,
      };
    })
    .sort((a, b) => b.count - a.count);
}
