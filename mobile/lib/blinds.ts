import { LatLon } from "./geo";
import { HuntLog, huntSpotKey, normName, seasonOf, total } from "./huntLog";
import { KEYS, readJSON, writeJSON } from "./storage";

// First-class blinds: a pin, an access route, seats, water. Leasees run 1–2,
// guides run a dozen across counties, clubs draw for them. A blind can point
// at a logbook Spot (spotKey + its name) so hunts logged before Build 6 under
// "Butte Sink club · Blind 3" still count toward the new blind's performance.
//
// LOCAL ONLY (nch.blinds.v1) until the NorCalHunt database is set up; server
// shape is public.blinds in 20261112_user_types_blinds_assignments.sql.

export type BlindType = "rice" | "woodland" | "pond" | "refuge" | "other";

export const BLIND_TYPES: { id: BlindType; label: string }[] = [
  { id: "rice", label: "Rice" },
  { id: "woodland", label: "Woodland" },
  { id: "pond", label: "Pond" },
  { id: "refuge", label: "Refuge" },
  { id: "other", label: "Other" },
];

export type Blind = {
  id: string;
  name: string;
  type: BlindType;
  /** GPS pin. */
  lat?: number;
  lng?: number;
  /** How you get there: "gate 3, levee road north, park at the pump". */
  accessRoute?: string;
  /** Optional route polyline, truck → blind. */
  routePoints?: LatLon[];
  seats?: number;
  /** Property / ranch / club name. */
  property?: string;
  county?: string;
  groupId?: string;
  /** Current water at the blind (latest reading). */
  waterLevel?: string;
  notes?: string;
  /** Logbook Spot this blind sits in (huntLog.spotKey) — links older hunts by blind name. */
  spotKey?: string;
  createdAt: number;
  updatedAt?: number;
};

export async function loadBlinds(): Promise<Blind[]> {
  const raw = await readJSON<Blind[]>(KEYS.blinds, []);
  return Array.isArray(raw) ? raw.filter((b) => b && b.id && b.name) : [];
}

export async function saveBlinds(list: Blind[]): Promise<void> {
  await writeJSON(KEYS.blinds, list);
}

export const hasPin = (b: Blind): b is Blind & { lat: number; lng: number } =>
  typeof b.lat === "number" && typeof b.lng === "number" && Number.isFinite(b.lat) && Number.isFinite(b.lng);

/** "39.41, -122.18; 39.42, -122.17" → points. Bad pairs are skipped. */
export function parseRoute(s: string): LatLon[] {
  return s
    .split(/[;\n]+/)
    .map((pair) => pair.split(/[,\s]+/).filter(Boolean).map(Number))
    .filter((n) => n.length === 2 && n.every(Number.isFinite) && Math.abs(n[0]) <= 90 && Math.abs(n[1]) <= 180)
    .map(([lat, lon]) => ({ lat, lon }));
}

export const routeText = (pts?: LatLon[]) => (pts ?? []).map((p) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`).join("; ");

/** Hunts in this blind: tagged with its id, or (older logs) same spot + same blind name. */
export function blindHunts(b: Blind, hunts: HuntLog[]): HuntLog[] {
  const n = normName(b.name);
  return hunts.filter((h) => h.blindId === b.id || (!h.blindId && !!b.spotKey && huntSpotKey(h) === b.spotKey && normName(h.blind) === n));
}

export type PerfRow = { season: string; hunts: number; birds: number; hunterDays: number; perHunter: number };
export type BlindPerf = { blind: Blind; seasons: PerfRow[]; allTime: PerfRow; last: string | null };

function roll(label: string, hs: HuntLog[]): PerfRow {
  const birds = hs.reduce((a, h) => a + total(h.counts), 0);
  const hunterDays = hs.reduce((a, h) => a + Math.max(1, h.party.length), 0);
  return { season: label, hunts: hs.length, birds, hunterDays, perHunter: hunterDays ? birds / hunterDays : 0 };
}

/** Season-by-season and all-time birds and birds/hunter for a blind. */
export function blindPerformance(b: Blind, hunts: HuntLog[]): BlindPerf {
  const mine = blindHunts(b, hunts);
  const by = new Map<string, HuntLog[]>();
  mine.forEach((h) => by.set(seasonOf(h.date), [...(by.get(seasonOf(h.date)) ?? []), h]));
  const seasons = [...by.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([s, hs]) => roll(s, hs));
  return {
    blind: b,
    seasons,
    allTime: roll("All years", mine),
    last: mine.reduce<string | null>((a, h) => (!a || h.date > a ? h.date : a), null),
  };
}

export type HotBlind = { blind: Blind; recentHunts: number; recentBirds: number; perHunter: number; heat: "hot" | "warm" | "cold" | "none" };

const addDays = (iso: string, d: number) => {
  const t = new Date(`${iso}T12:00:00`);
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

/**
 * Recent form for each blind going into a draw: birds/hunter over the last
 * `days` days before `day`. "Hot" = top third among blinds that were hunted.
 */
export function hotBlinds(blinds: Blind[], hunts: HuntLog[], day: string, days = 14): HotBlind[] {
  const from = addDays(day, -days);
  const rows = blinds.map((b) => {
    const recent = blindHunts(b, hunts).filter((h) => h.date >= from && h.date <= day);
    const r = roll("recent", recent);
    return { blind: b, recentHunts: r.hunts, recentBirds: r.birds, perHunter: r.perHunter, heat: "none" as HotBlind["heat"] };
  });
  const hunted = rows.filter((r) => r.recentHunts > 0).sort((a, b) => b.perHunter - a.perHunter);
  const third = Math.max(1, Math.ceil(hunted.length / 3));
  hunted.forEach((r, i) => (r.heat = i < third ? "hot" : i >= hunted.length - third && hunted.length > 2 ? "cold" : "warm"));
  return rows.sort((a, b) => b.perHunter - a.perHunter || b.recentHunts - a.recentHunts);
}

export const HEAT_LABEL: Record<HotBlind["heat"], string> = { hot: "Hot", warm: "Warm", cold: "Cold", none: "No recent hunts" };
