import { cardinal } from "./geo";
import { REFUGE_BY_ID } from "./refuges";
import { BAG_LIMITS, scaupOpen } from "./regs";
import { KEYS, readJSON, writeJSON } from "./storage";

// ── Species ────────────────────────────────────────────────────────────────

export type SpeciesGroup = "duck" | "white" | "dark";

export type SpeciesId =
  | "mallardDrake" | "mallardHen" | "pintail" | "gwt" | "cinnamonTeal" | "widgeon" | "gadwall"
  | "shoveler" | "woodDuck" | "canvasback" | "redhead" | "scaup" | "ringneck"
  | "spec" | "snowRoss" | "canada";

export const SPECIES: { id: SpeciesId; name: string; group: SpeciesGroup; chartName: string }[] = [
  { id: "mallardDrake", name: "Mallard Drake", group: "duck", chartName: "Mallard" },
  { id: "mallardHen", name: "Mallard Hen", group: "duck", chartName: "Mallard" },
  { id: "pintail", name: "Northern Pintail", group: "duck", chartName: "Pintail" },
  { id: "gwt", name: "Green-winged Teal", group: "duck", chartName: "Green-winged Teal" },
  { id: "cinnamonTeal", name: "Cinnamon Teal", group: "duck", chartName: "Cinnamon Teal" },
  { id: "widgeon", name: "American Widgeon", group: "duck", chartName: "Widgeon" },
  { id: "gadwall", name: "Gadwall", group: "duck", chartName: "Gadwall" },
  { id: "shoveler", name: "Northern Shoveler", group: "duck", chartName: "Shoveler" },
  { id: "woodDuck", name: "Wood Duck", group: "duck", chartName: "Wood Duck" },
  { id: "canvasback", name: "Canvasback", group: "duck", chartName: "Canvasback" },
  { id: "redhead", name: "Redhead", group: "duck", chartName: "Redhead" },
  { id: "scaup", name: "Scaup", group: "duck", chartName: "Scaup" },
  { id: "ringneck", name: "Ring-necked Duck", group: "duck", chartName: "Ringneck" },
  { id: "spec", name: "Spec (White-fronted Goose)", group: "dark", chartName: "Spec" },
  { id: "snowRoss", name: "Snow/Ross's Goose", group: "white", chartName: "Snow/Ross's" },
  { id: "canada", name: "Canada Goose", group: "dark", chartName: "Canada" },
];

export type Counts = Partial<Record<SpeciesId, number>>;

export const total = (c: Counts, ids?: SpeciesId[]) =>
  (ids ?? (Object.keys(c) as SpeciesId[])).reduce((a, k) => a + (c[k] ?? 0), 0);

const DUCKS = SPECIES.filter((s) => s.group === "duck").map((s) => s.id);
const WHITE = SPECIES.filter((s) => s.group === "white").map((s) => s.id);
const DARK = SPECIES.filter((s) => s.group === "dark").map((s) => s.id);

// ── Bag-limit engine ───────────────────────────────────────────────────────

export type LimitLevel = "ok" | "near" | "at" | "over" | "closed";

export type LimitStatus = { key: string; label: string; count: number; limit: number; level: LimitLevel; note?: string };

function level(count: number, limit: number): LimitLevel {
  if (count > limit) return "over";
  if (count === limit) return "at";
  if (limit > 0 && count >= limit - 1 && count > 0) return "near";
  return "ok";
}

/**
 * Party-scaled daily limits. California limits are per hunter; a blind
 * of three can bring back 21 ducks only if each hunter shot their own, so
 * this is the blind's ceiling, not a license to party-hunt — the UI says so.
 */
export function bagStatus(c: Counts, party: number, day: string, svsma: boolean): LimitStatus[] {
  const n = Math.max(1, party);
  const L = BAG_LIMITS;
  const rows: LimitStatus[] = [
    { key: "ducks", label: "Ducks total", count: total(c, DUCKS), limit: L.ducksTotal * n, level: "ok" },
    { key: "hens", label: "Mallard hens", count: c.mallardHen ?? 0, limit: L.mallardHens * n, level: "ok" },
    { key: "pintail", label: "Northern Pintail", count: c.pintail ?? 0, limit: L.pintail * n, level: "ok" },
    { key: "canvasback", label: "Canvasback", count: c.canvasback ?? 0, limit: L.canvasback * n, level: "ok" },
    { key: "redhead", label: "Redhead", count: c.redhead ?? 0, limit: L.redhead * n, level: "ok" },
    { key: "scaup", label: "Scaup", count: c.scaup ?? 0, limit: L.scaup * n, level: "ok" },
    { key: "geese", label: "Geese total", count: total(c, [...WHITE, ...DARK]), limit: L.geeseTotal * n, level: "ok" },
    { key: "white", label: "White geese (Snow/Ross's)", count: total(c, WHITE), limit: L.whiteGeese * n, level: "ok" },
    { key: "dark", label: "Dark geese (Spec + Canada)", count: total(c, DARK), limit: L.darkGeese * n, level: "ok" },
    {
      key: "spec",
      label: svsma ? "White-fronted (Sac Valley SMA)" : "White-fronted (Spec)",
      count: c.spec ?? 0,
      limit: (svsma ? L.whiteFrontedSVSMA : L.whiteFronted) * n,
      level: "ok",
    },
  ];
  for (const r of rows) r.level = level(r.count, r.limit);
  const scaup = rows.find((r) => r.key === "scaup")!;
  if (!scaupOpen(day)) {
    scaup.limit = 0;
    scaup.level = scaup.count > 0 ? "over" : "closed";
    scaup.note = "Scaup window is Nov 7 – Jan 31";
  }
  return rows;
}

export function worstLevel(rows: LimitStatus[]): LimitLevel {
  const order: LimitLevel[] = ["closed", "ok", "near", "at", "over"];
  return rows.reduce<LimitLevel>((w, r) => (order.indexOf(r.level) > order.indexOf(w) ? r.level : w), "ok");
}

// ── Hunt log ───────────────────────────────────────────────────────────────

export type LocationKind = "refuge" | "club" | "free";

export type HuntLog = {
  id: string;
  date: string;            // YYYY-MM-DD
  locationKind: LocationKind;
  refugeId: string | null;
  locationName: string;
  blind: string;
  party: string[];
  teamCode: string;
  sky: string;
  windDir: number;
  windMph: number;
  tempF: number;
  start: string;           // HH:MM
  end: string;
  notes: string;
  counts: Counts;
  createdAt: number;
  synced?: boolean;
};

export function seasonOf(date: string): string {
  const [y, m] = date.split("-").map(Number);
  const start = m >= 8 ? y : y - 1;
  return `${start}–${String(start + 1).slice(2)}`;
}

export function locationLabel(h: HuntLog): string {
  return h.refugeId ? REFUGE_BY_ID[h.refugeId]?.short ?? h.locationName : h.locationName;
}

// Two seasons of believable NorCal logs so the logbook and analytics aren't
// empty on first launch. Every row stays inside the limits for its date.
const SEED: Omit<HuntLog, "id" | "createdAt">[] = [
  // 2026–27
  { date: "2026-10-04", locationKind: "free", refugeId: null, locationName: "Free Roam · Colusa rice", blind: "Layout row", party: ["Chris", "Luis R."], teamCode: "BUTTE-7", sky: "Bluebird", windDir: 330, windMph: 9, tempF: 52, start: "06:40", end: "09:30", notes: "Early goose — large Canadas only. Two singles worked the layouts at 8:10.", counts: { canada: 3 } },
  { date: "2026-10-24", locationKind: "refuge", refugeId: "sac-nwr", locationName: "Sacramento NWR", blind: "Spaced Blind 14", party: ["Chris", "Jake M.", "Luis R."], teamCode: "BUTTE-7", sky: "Partly cloudy", windDir: 320, windMph: 12, tempF: 46, start: "06:28", end: "10:15", notes: "Opener. Teal buzzing the spread at shoot light, pintail mid-morning on the NW wind.", counts: { gwt: 7, pintail: 4, mallardDrake: 3, mallardHen: 1, widgeon: 2, spec: 2 } },
  { date: "2026-10-24", locationKind: "refuge", refugeId: "yolo-bypass", locationName: "Yolo Bypass WA", blind: "Free roam · Lot E", party: ["Danny K.", "Marcus T."], teamCode: "YOLO-DAWN", sky: "Partly cloudy", windDir: 300, windMph: 10, tempF: 49, start: "06:35", end: "09:50", notes: "Spoonies early, a few greenheads after the second volley at the next pond.", counts: { shoveler: 3, gwt: 4, mallardDrake: 2, gadwall: 1 } },
  { date: "2026-10-25", locationKind: "refuge", refugeId: "gray-lodge", locationName: "Gray Lodge WA", blind: "Pond 8 free roam", party: ["Chris", "Jake M."], teamCode: "BUTTE-7", sky: "Overcast", windDir: 160, windMph: 7, tempF: 51, start: "06:30", end: "10:40", notes: "South wind, birds came in behind us. Moved twice, finally set up on the north bank.", counts: { gwt: 5, pintail: 2, mallardDrake: 2, widgeon: 1, snowRoss: 2 } },
  { date: "2026-10-25", locationKind: "refuge", refugeId: "grizzly-island", locationName: "Grizzly Island WA", blind: "Unit 6", party: ["Marcus T.", "Sam P."], teamCode: "YOLO-DAWN", sky: "Mostly cloudy", windDir: 240, windMph: 18, tempF: 55, start: "06:31", end: "11:00", notes: "Suisun howler. Decoys in the lee of the tules did all the work.", counts: { mallardDrake: 4, mallardHen: 1, gadwall: 3, shoveler: 2, gwt: 2 } },
  { date: "2026-10-26", locationKind: "club", refugeId: null, locationName: "Butte Sink club", blind: "Blind 3", party: ["Chris", "Luis R.", "Tom H."], teamCode: "BUTTE-7", sky: "Rain", windDir: 175, windMph: 14, tempF: 48, start: "06:32", end: "09:05", notes: "Rain band came through at 7. Limit of drakes by nine, wood ducks in the timber.", counts: { mallardDrake: 9, woodDuck: 4, gwt: 5, pintail: 2, widgeon: 1 } },
  // 2025–26
  { date: "2025-10-25", locationKind: "refuge", refugeId: "delevan-nwr", locationName: "Delevan NWR", blind: "Free roam", party: ["Chris", "Jake M."], teamCode: "BUTTE-7", sky: "Bluebird", windDir: 0, windMph: 4, tempF: 55, start: "06:33", end: "09:10", notes: "Opener 2025. Bluebird and calm. Teal saved it.", counts: { gwt: 6, shoveler: 2, cinnamonTeal: 1 } },
  { date: "2025-11-15", locationKind: "refuge", refugeId: "sac-nwr", locationName: "Sacramento NWR", blind: "Pond 21", party: ["Chris", "Luis R."], teamCode: "BUTTE-7", sky: "Mostly cloudy", windDir: 330, windMph: 15, tempF: 41, start: "06:00", end: "10:30", notes: "First real north wind of the year. New pintail everywhere.", counts: { pintail: 4, mallardDrake: 3, widgeon: 3, gwt: 2, spec: 3 } },
  { date: "2025-11-22", locationKind: "refuge", refugeId: "san-luis-nwr", locationName: "San Luis NWR", blind: "Spaced Blind 4", party: ["Danny K.", "Marcus T.", "Sam P."], teamCode: "YOLO-DAWN", sky: "Tule fog", windDir: 290, windMph: 3, tempF: 38, start: "06:10", end: "11:20", notes: "Fog held until 8:30, then teal by the dozen.", counts: { gwt: 9, shoveler: 4, pintail: 3, gadwall: 2 } },
  { date: "2025-12-06", locationKind: "refuge", refugeId: "howard-slough", locationName: "Howard Slough", blind: "Free roam · timber", party: ["Chris", "Jake M."], teamCode: "BUTTE-7", sky: "Overcast", windDir: 315, windMph: 11, tempF: 37, start: "06:20", end: "10:00", notes: "Specs piled into the flooded ag at first light.", counts: { spec: 4, mallardDrake: 4, mallardHen: 1, woodDuck: 2, gwt: 3 } },
  { date: "2025-12-13", locationKind: "refuge", refugeId: "colusa-nwr", locationName: "Colusa NWR", blind: "Spaced Blind 9", party: ["Chris"], teamCode: "", sky: "Rain", windDir: 165, windMph: 16, tempF: 44, start: "06:24", end: "09:40", notes: "Solo. Storm day — limit of mixed bag.", counts: { pintail: 3, mallardDrake: 2, widgeon: 1, canvasback: 1 } },
  { date: "2025-12-20", locationKind: "refuge", refugeId: "grizzly-island", locationName: "Grizzly Island WA", blind: "Unit 12", party: ["Marcus T.", "Sam P."], teamCode: "YOLO-DAWN", sky: "Partly cloudy", windDir: 270, windMph: 20, tempF: 46, start: "06:31", end: "10:30", notes: "Bluebill and cans on the open water side.", counts: { scaup: 3, canvasback: 2, gadwall: 3, mallardDrake: 3 } },
  { date: "2025-12-27", locationKind: "refuge", refugeId: "gray-lodge", locationName: "Gray Lodge WA", blind: "Pond 23", party: ["Chris", "Luis R.", "Jake M."], teamCode: "BUTTE-7", sky: "Overcast", windDir: 320, windMph: 13, tempF: 36, start: "06:45", end: "10:50", notes: "Cold and gray. Snows working high, a few dropped to the floaters.", counts: { snowRoss: 6, pintail: 5, mallardDrake: 4, gwt: 4, widgeon: 3 } },
  { date: "2026-01-03", locationKind: "refuge", refugeId: "yolo-bypass", locationName: "Yolo Bypass WA", blind: "Lot G free roam", party: ["Danny K.", "Sam P."], teamCode: "YOLO-DAWN", sky: "Bluebird", windDir: 10, windMph: 6, tempF: 34, start: "06:50", end: "09:30", notes: "Frost on the decoys. Slow.", counts: { gwt: 3, shoveler: 2, mallardDrake: 1 } },
  { date: "2026-01-17", locationKind: "refuge", refugeId: "little-dry-creek", locationName: "Little Dry Creek", blind: "Walk-in unit 2", party: ["Chris", "Jake M."], teamCode: "BUTTE-7", sky: "Mostly cloudy", windDir: 310, windMph: 12, tempF: 39, start: "06:46", end: "10:10", notes: "Long walk in the dark — breadcrumb trail paid for itself on the way out.", counts: { mallardDrake: 5, mallardHen: 2, gwt: 3, ringneck: 2, spec: 2 } },
  { date: "2026-01-31", locationKind: "refuge", refugeId: "los-banos", locationName: "Los Banos WA", blind: "Pond 4", party: ["Danny K.", "Marcus T."], teamCode: "YOLO-DAWN", sky: "Rain", windDir: 150, windMph: 17, tempF: 45, start: "06:44", end: "11:00", notes: "Closer. Storm day, pintail and spoonies.", counts: { pintail: 4, shoveler: 5, gwt: 3, redhead: 1 } },
];

/** Sample hunts shipped for first-run preview carry a `seed-` id. */
export function isSeedHunt(h: HuntLog): boolean {
  return h.id.startsWith("seed-");
}

export function seedLogs(): HuntLog[] {
  return SEED.map((s, i) => ({ ...s, id: `seed-${i}`, createdAt: Date.parse(`${s.date}T12:00:00`) }));
}

export async function loadHunts(): Promise<HuntLog[]> {
  const seeded = await readJSON<boolean>(KEYS.huntsSeeded, false);
  if (!seeded) {
    const logs = seedLogs();
    await writeJSON(KEYS.hunts, logs);
    await writeJSON(KEYS.huntsSeeded, true);
    return sortHunts(logs);
  }
  return sortHunts(await readJSON<HuntLog[]>(KEYS.hunts, []));
}

export async function saveHunts(list: HuntLog[]): Promise<void> {
  await writeJSON(KEYS.hunts, list);
}

export function sortHunts(list: HuntLog[]): HuntLog[] {
  return list.slice().sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
}

// ── Analytics ──────────────────────────────────────────────────────────────

export type SeasonStats = {
  hunts: number;
  birds: number;
  hunterDays: number;
  avgPerHunt: number;
  avgPerHunter: number;
  species: { name: string; count: number }[];
  refuges: { name: string; hunts: number; perHunter: number }[];
  winds: { dir: string; hunts: number; perHunter: number }[];
  teams: { code: string; hunts: number; birds: number; perHunter: number; members: number }[];
};

export function seasonStats(logs: HuntLog[]): SeasonStats {
  const birds = logs.reduce((a, h) => a + total(h.counts), 0);
  const hunterDays = logs.reduce((a, h) => a + Math.max(1, h.party.length), 0);

  const sp = new Map<string, number>();
  for (const h of logs) {
    for (const s of SPECIES) {
      const n = h.counts[s.id] ?? 0;
      if (n) sp.set(s.chartName, (sp.get(s.chartName) ?? 0) + n);
    }
  }

  const group = <K extends string>(key: (h: HuntLog) => K | null) => {
    const m = new Map<K, { hunts: number; birds: number; hunters: number; members: Set<string> }>();
    for (const h of logs) {
      const k = key(h);
      if (!k) continue;
      const g = m.get(k) ?? { hunts: 0, birds: 0, hunters: 0, members: new Set<string>() };
      g.hunts++;
      g.birds += total(h.counts);
      g.hunters += Math.max(1, h.party.length);
      h.party.forEach((p) => g.members.add(p));
      m.set(k, g);
    }
    return m;
  };

  const refuges = [...group((h) => locationLabel(h))].map(([name, g]) => ({ name, hunts: g.hunts, perHunter: g.birds / g.hunters }));
  const winds = [...group((h) => (h.windMph < 3 ? "Calm" : cardinal(h.windDir)))].map(([dir, g]) => ({ dir, hunts: g.hunts, perHunter: g.birds / g.hunters }));
  const teams = [...group((h) => h.teamCode || null)].map(([code, g]) => ({ code, hunts: g.hunts, birds: g.birds, perHunter: g.birds / g.hunters, members: g.members.size }));

  return {
    hunts: logs.length,
    birds,
    hunterDays,
    avgPerHunt: logs.length ? birds / logs.length : 0,
    avgPerHunter: hunterDays ? birds / hunterDays : 0,
    species: [...sp].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    refuges: refuges.sort((a, b) => b.perHunter - a.perHunter),
    winds: winds.sort((a, b) => b.perHunter - a.perHunter),
    teams: teams.sort((a, b) => b.perHunter - a.perHunter),
  };
}

export function normalizeTeamCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16);
}
