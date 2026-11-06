// 2026–27 California waterfowl seasons by zone. Source of truth: CDFW
// "2026-2027 Regulations" at https://wildlife.ca.gov/hunting/waterfowl
// (fetched Nov 2026). Bag figures below are from the NorCalHunt desk (Issue #2
// "The Duck Calendar Is Locked", Issue #20, the site's Bag Limits guide).
// Always confirm in the CDFW Waterfowl Regulations booklet — the app is a
// field reference, not law.

export const SEASON_YEAR = "2026–27";
export const SEASON_SOURCE = "https://wildlife.ca.gov/hunting/waterfowl";

export type WaterfowlZoneId =
  | "northeastern"
  | "balance-of-state"
  | "southern-san-joaquin"
  | "southern-california"
  | "colorado-river";

export type Game = "duck" | "goose";

export type SeasonRow = {
  label: string;
  dates: string;
  start: string;
  end: string;
  note?: string;
  /** Which status line this row feeds. Scaup / SMA rows feed neither. */
  game: Game[];
  /** Set when the row only opens part of the season (youth, one species…). */
  limited?: string;
};

export type Zone = { id: WaterfowlZoneId; name: string; short: string; seasons: SeasonRow[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-24" → "Oct 24" (plus ", 2026" when asked). */
export function shortDate(iso: string, withYear = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}${withYear ? `, ${y}` : ""}`;
}

function rangeLabel(start: string, end: string): string {
  const sy = start.slice(0, 4);
  const ey = end.slice(0, 4);
  return sy === ey ? `${shortDate(start)} – ${shortDate(end)}, ${ey}` : `${shortDate(start, true)} – ${shortDate(end, true)}`;
}

function row(label: string, start: string, end: string, game: Game[], extra: Partial<SeasonRow> = {}): SeasonRow {
  return { label, dates: rangeLabel(start, end), start, end, game, ...extra };
}

const DUCK: Game[] = ["duck"];
const GOOSE: Game[] = ["goose"];
const BOTH: Game[] = ["duck", "goose"];
const NONE: Game[] = [];

// ISO dates are inclusive and interpreted as Pacific calendar days.
export const ZONES: Zone[] = [
  {
    id: "northeastern",
    name: "Northeastern Zone",
    short: "Northeastern",
    seasons: [
      row("Youth Hunt Days", "2026-09-19", "2026-09-20", BOTH, { limited: "youth only" }),
      row("Ducks", "2026-10-03", "2027-01-13", DUCK),
      row("Scaup (Bluebill)", "2026-10-03", "2026-11-29", NONE, { note: "Split — part 1" }),
      row("Scaup (Bluebill)", "2026-12-17", "2027-01-13", NONE, { note: "Split — part 2" }),
      row("Canada Geese", "2026-10-03", "2027-01-10", GOOSE),
      row("White & White-fronted Geese", "2026-10-03", "2026-11-29", GOOSE, { note: "Split — part 1" }),
      row("White & White-fronted Geese", "2027-01-01", "2027-01-13", GOOSE, { note: "Split — part 2" }),
      row("Veterans Hunt Days", "2027-01-16", "2027-01-17", DUCK, { note: "Ducks only", limited: "veterans only" }),
      row("Late White & White-fronted Geese", "2027-02-05", "2027-03-10", GOOSE, { limited: "late white & white-fronted geese" }),
    ],
  },
  {
    id: "balance-of-state",
    name: "Balance of State Zone",
    short: "Balance of State",
    seasons: [
      row("Early Large Canada Goose", "2026-10-03", "2026-10-05", GOOSE, { note: "Large Canada geese only", limited: "large Canadas only" }),
      row("Ducks", "2026-10-24", "2027-01-31", DUCK, { note: "Coots & moorhens open alongside, 25/day" }),
      row("Geese", "2026-10-24", "2027-01-31", GOOSE),
      row("Scaup (Bluebill)", "2026-11-07", "2027-01-31", NONE, { note: "2 per day inside the 7" }),
      row("Veterans Hunt Days", "2027-02-06", "2027-02-07", DUCK, { note: "Ducks only", limited: "veterans only" }),
      row("Youth Hunt Days", "2027-02-13", "2027-02-14", BOTH, { limited: "youth only" }),
      row("Late Canada Goose", "2027-02-20", "2027-02-21", GOOSE, { limited: "late Canadas" }),
      row("Late White-fronted & White Geese", "2027-02-20", "2027-02-24", GOOSE, { limited: "late white & white-fronted geese" }),
    ],
  },
  {
    id: "southern-san-joaquin",
    name: "Southern San Joaquin Valley Zone",
    short: "Southern SJ Valley",
    seasons: [
      row("Ducks", "2026-10-24", "2027-01-31", DUCK),
      row("Geese", "2026-10-24", "2027-01-31", GOOSE),
      row("Scaup (Bluebill)", "2026-11-07", "2027-01-31", NONE),
      row("Veterans Hunt Days", "2027-02-06", "2027-02-07", DUCK, { limited: "veterans only" }),
      row("Youth Hunt Days", "2027-02-13", "2027-02-14", BOTH, { limited: "youth only" }),
    ],
  },
  {
    // No mapped refuges here — listed so the Intel screen covers the state.
    id: "southern-california",
    name: "Southern California Zone",
    short: "Southern California",
    seasons: [
      row("Ducks", "2026-10-24", "2027-01-31", DUCK),
      row("Geese", "2026-10-24", "2027-01-31", GOOSE),
      row("Scaup (Bluebill)", "2026-11-07", "2027-01-31", NONE),
      row("Veterans Hunt Days", "2027-02-06", "2027-02-07", DUCK, { limited: "veterans only" }),
      row("Youth Hunt Days", "2027-02-13", "2027-02-14", BOTH, { limited: "youth only" }),
    ],
  },
  {
    id: "colorado-river",
    name: "Colorado River Zone",
    short: "Colorado River",
    seasons: [
      row("Ducks", "2026-10-23", "2027-01-31", DUCK),
      row("Geese", "2026-10-23", "2027-01-31", GOOSE),
      row("Scaup (Bluebill)", "2026-11-07", "2027-01-31", NONE),
      // CDFW lists no Colorado River veterans days for 2026–27.
      row("Youth Hunt Days", "2027-02-13", "2027-02-14", BOTH, { limited: "youth only" }),
    ],
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<WaterfowlZoneId, Zone>;

/** Special management areas — reference rows for the Intel screen, not a zoneId. */
export const SMA_SEASONS: SeasonRow[] = [
  row("White-fronted Geese · Sacramento Valley SMA", "2026-10-24", "2026-12-21", NONE, {
    note: "Open with the general goose season, closes after Dec 21 · 3/day",
  }),
  row("Canada Geese · North Coast SMA", "2026-10-03", "2026-12-19", NONE),
  row("Canada Geese · North Coast SMA (late)", "2027-02-12", "2027-03-10", NONE, { note: "Large Canada geese closed in the late season" }),
  row("Canada Geese · Klamath Basin SMA", "2026-10-03", "2027-01-10", NONE),
  row("White & White-fronted Geese · Klamath Basin SMA", "2026-10-03", "2027-01-15", NONE),
  row("Black Brant · Northern Brant", "2026-11-29", "2026-12-14", NONE),
  row("Black Brant · Balance of State Brant", "2026-11-30", "2026-12-15", NONE),
];

export const BAG_LIMITS = {
  ducksTotal: 7,
  mallardHens: 2,
  // The desk's 2026–27 calendar (Issue #2, Issue #20): "Pintail stays at 3 per
  // day (any sex)." Change here if the federal frameworks move.
  pintail: 3,
  canvasback: 2,
  redhead: 2,
  scaup: 2,
  geeseTotal: 30,
  whiteGeese: 20,
  darkGeese: 10,
  whiteFronted: 6,
  whiteFrontedSVSMA: 3,
  coots: 25,
  possessionMultiplier: 3,
} as const;

/**
 * Hen-only daily limits, per hunter, keyed by tracker species id. These count
 * hens alone; the species and overall duck totals still count both sexes.
 * Pintail is 3 of either sex this season, so it has no entry here — add one
 * (e.g. `pintail: 1`) if the frameworks bring back a hen restriction.
 */
export const HEN_LIMITS: Record<string, number> = {
  mallard: BAG_LIMITS.mallardHens,
};

export const BAG_REFERENCE: { label: string; value: string }[] = [
  { label: "Ducks", value: "7 / day · 21 possession" },
  { label: "Mallards", value: "Up to 7, no more than 2 hens" },
  { label: "Pintail", value: `${BAG_LIMITS.pintail} (any sex)` },
  { label: "Canvasback · Redhead", value: "2 each" },
  { label: "Scaup", value: "2 — inside the scaup window only (Nov 7 – Jan 31; split in the Northeastern Zone)" },
  { label: "Geese", value: "30 / day · 90 possession" },
  { label: "White geese (Snow / Ross's)", value: "Up to 20" },
  { label: "Dark geese (Spec / Canada)", value: "Up to 10" },
  { label: "White-fronted (Spec)", value: "6 · only 3 in the Sacramento Valley SMA (closes after Dec 21)" },
  { label: "Coots & moorhens", value: "25 / day" },
];

export const FIELD_RULES: string[] = [
  "Legal shooting: 30 minutes before sunrise to sunset.",
  "Non-toxic shot only (steel, bismuth, tungsten). Certified non-lead ammunition is required for all firearm hunting in California.",
  "Shotgun plugged to three shells total.",
  "Carry your hunting license, California Duck Validation, a Federal Duck Stamp signed across the face (16+), and your free HIP validation.",
  "State areas: reservation drawings close 17 days before each hunt ($1.34 per hunt choice). Results post at least 7 days out.",
  "Refuge check-in: sign in at the check station, take your card or blind assignment, and check out with your birds — every bird, every time.",
  "Stay inside your assigned unit or spaced blind zone; respect closed zones and posted boundaries.",
  "Sacramento Valley Special Management Area: 3 white-fronted geese per day; white-fronts close there after December 21.",
];

/** "YYYY-MM-DD" for a Date in device-local time. */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function inSeason(row: SeasonRow, day: string): boolean {
  return day >= row.start && day <= row.end;
}

export function seasonStatus(row: SeasonRow, today: string): "open" | "upcoming" | "closed" {
  if (inSeason(row, today)) return "open";
  return today < row.start ? "upcoming" : "closed";
}

/** Scaup has its own window inside the duck season (split in the Northeastern Zone). */
export function scaupRows(zoneId: WaterfowlZoneId = "balance-of-state"): SeasonRow[] {
  return ZONE_BY_ID[zoneId].seasons.filter((r) => r.label.startsWith("Scaup"));
}

export function scaupOpen(day: string, zoneId: WaterfowlZoneId = "balance-of-state"): boolean {
  return scaupRows(zoneId).some((r) => inSeason(r, day));
}

export type GameStatus = { status: "open" | "upcoming" | "closed"; label: string; nextDate?: string };

function gameStatus(zoneId: WaterfowlZoneId, game: Game, today: string): GameStatus {
  const rows = ZONE_BY_ID[zoneId].seasons.filter((r) => r.game.includes(game));
  // A full season beats a youth/late day if both cover today.
  const open = rows.filter((r) => inSeason(r, today)).sort((a, b) => Number(!!a.limited) - Number(!!b.limited))[0];
  if (open) return { status: "open", label: `open today${open.limited ? ` · ${open.limited}` : ""}` };
  const next = rows.filter((r) => r.start > today).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (next) return { status: "upcoming", label: `opens ${shortDate(next.start)}${next.limited ? ` · ${next.limited}` : ""}`, nextDate: next.start };
  return { status: "closed", label: "closed" };
}

export function duckStatusForZone(zoneId: WaterfowlZoneId, today: string): GameStatus {
  return gameStatus(zoneId, "duck", today);
}

export function gooseStatusForZone(zoneId: WaterfowlZoneId, today: string): GameStatus {
  return gameStatus(zoneId, "goose", today);
}
