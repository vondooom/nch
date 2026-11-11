import { LatLon, destination } from "./geo";
import type { WaterfowlZoneId } from "./regs";

// The public waterfowl areas the NorCalHunt Index tracks — federal refuges
// (USFWS) and state wildlife areas (CDFW).
//
// Coordinates are the refuge headquarters / check-station area. Sources:
//   - Existing ten: NorCalHunt desk, nudged where OSM / Wikidata disagree —
//     Gray Lodge (OSM 39.3255,-121.8178), Yolo Bypass (Wikidata 38.5505,-121.6260),
//     Los Banos (CDFW office 37.0999,-120.8184).
//   - Llano Seco: OSM "Llano Seco Unit Seven Mile View Station Parking";
//     https://wildlife.ca.gov/Lands/Places-to-Visit/Upper-Butte-Basin-WA
//   - Volta: OSM nature_reserve; https://wildlife.ca.gov/Lands/Places-to-Visit/Volta-WA
//   - Mendota: OSM protected_area; https://wildlife.ca.gov/Lands/Places-to-Visit/Mendota-WA
//   - Ash Creek: OSM park; https://wildlife.ca.gov/Lands/Places-to-Visit/Ash-Creek-WA
//   - Honey Lake: Wikidata Q140963418 (P625); https://wildlife.ca.gov/Lands/Places-to-Visit/Honey-Lake-WA
//   - North Grasslands: OSM nature_reserve; https://wildlife.ca.gov/Lands/Places-to-Visit/North-Grasslands-WA
// Zones per CDFW 2026–27 waterfowl regulations (https://wildlife.ca.gov/hunting/waterfowl).
//
// ── Harvest ────────────────────────────────────────────────────────────────
// OFFICIAL CDFW WEEKLY TOTALS. Every area uses the same report so the
// "Recent Hunter Reports" sub-score compares like with like:
//   CDFW "2026-2027 Waterfowl Hunt Results", shoot days Oct 21–25, 2026
//   https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=247861&inline=
//   (catalog: https://nrm.dfg.ca.gov/documents/ContextDocs.aspx?cat=WLB-WaterfowlHunting)
// Balance of State / Southern SJ Valley areas shot Oct 24–25 (opener weekend);
// Northeastern areas also shot Wed Oct 21.
//
// hunters   = sum of "# OF HUNTERS" across the week's listed days
// waterfowl = sum of "# OF WATERFOWL" across the same days
// birdsPerHunter = waterfowl / hunters (precise ratio; the UI rounds)
//
// CDFW publishes only the #1 and #2 species code per day — not bag shares —
// so `species` lists the codes seen that week, by name, with no percentages.
// An area missing from the report gets `harvest: null` and the Index hides its
// score rather than pretending reports were zero.
//
// ── Entry type ─────────────────────────────────────────────────────────────
// Type A / B / C from Cal. Code Regs. tit. 14, § 551 (amendments filed
// 6-7-2024, operative 7-1-2024, Register 2024 No. 23):
// https://www.law.cornell.edu/regulations/california/14-CCR-551
// State areas are listed under §551(b); the federal refuges here are Type A
// under §551(c).

export const HARVEST_SOURCE_URL = "https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=247861&inline=";
export const HARVEST_SOURCE_LABEL = "CDFW 2026-27 Waterfowl Hunt Results · Oct 21–25, 2026";
export const ENTRY_TYPE_SOURCE_URL = "https://www.law.cornell.edu/regulations/california/14-CCR-551";

/** pct is optional: CDFW's weekly report names top species but not bag shares. */
export type SpeciesShare = { species: string; pct?: number };

export type Harvest = {
  week: string;              // which report / shoot days these totals cover
  birdsPerHunter: number;    // waterfowl / hunters for the week
  hunters: number;           // hunters checked through, week total
  waterfowl: number;         // waterfowl checked through, week total
  species: SpeciesShare[];   // top species codes seen that week (names only)
};

export type Refuge = {
  id: string;
  name: string;
  short: string;
  /** USFWS = federal refuge, CDFW = state wildlife area. */
  agency: "USFWS" | "CDFW";
  county: string;
  region: "Northeastern" | "Sacramento Valley" | "Butte Basin" | "Delta & Suisun" | "Grasslands" | "San Joaquin Valley";
  /** CDFW waterfowl zone — drives the season status lines. */
  zoneId: WaterfowlZoneId;
  coords: LatLon;
  /** Inside the Sacramento Valley Special Management Area (3 white-fronts/day). */
  svsma: boolean;
  /** How you get in — entry type per 14 CCR § 551. Shown even with no harvest. */
  quota: string;
  /** Latest official weekly totals, or null when the area wasn't in the report. */
  harvest: Harvest | null;
  /** A line from the desk on how the place hunts. */
  character: string;
  /** Agency page for the area. */
  url?: string;
};

export const AGENCY_LABEL: Record<Refuge["agency"], string> = { USFWS: "Federal", CDFW: "State" };

const WEEK_OPENER = "CDFW weekly results · Oct 24–25, 2026";
const WEEK_NE = "CDFW weekly results · Oct 21–25, 2026";

// CDFW species codes → names.
const SPECIES_CODE = {
  MALL: "Mallard",
  AGWT: "Green-winged Teal",
  NSHO: "Northern Shoveler",
  NOPI: "Northern Pintail",
  AMWI: "American Wigeon",
  GADW: "Gadwall",
  GWFG: "White-fronted Goose",
  CITE: "Cinnamon Teal",
  WODU: "Wood Duck",
} as const;
type SpeciesCode = keyof typeof SPECIES_CODE;

function week(label: string, hunters: number, waterfowl: number, codes: SpeciesCode[]): Harvest {
  return {
    week: label,
    hunters,
    waterfowl,
    birdsPerHunter: waterfowl / hunters,
    species: codes.map((c) => ({ species: SPECIES_CODE[c] })),
  };
}

const TYPE_A = "Type A area · daily entry permit by reservation drawing or first-come line";
const TYPE_A_FED = "Federal refuge · Type A under 14 CCR §551(c) · reservation drawing or first-come line";
const TYPE_B =
  "Type B area · buy a Type A or B season pass in advance and exchange it for an entry permit · reservations required opening weekend · shoot days Wed/Sat/Sun";
const UPPER_BUTTE = `${TYPE_A} · Upper Butte Basin WA (Howard Slough, Little Dry Creek & Llano Seco units) · 14 CCR §551(b)(102)`;

export const REFUGES: Refuge[] = [
  {
    id: "sac-nwr",
    name: "Sacramento NWR",
    short: "Sac NWR",
    agency: "USFWS",
    county: "Glenn / Colusa",
    region: "Sacramento Valley",
    zoneId: "balance-of-state",
    coords: { lat: 39.4028, lon: -122.1836 },
    svsma: true,
    quota: `${TYPE_A_FED} · assigned ponds & spaced blinds`,
    // "Sacramento": 10/24 188 hunters / 521 wf; 10/25 108 / 264 → 296 / 785 = 2.65
    harvest: week(WEEK_OPENER, 296, 785, ["NSHO", "MALL", "AGWT"]),
    character: "Big water and big flights. The spaced blinds reward a tight spread and a hunter who stays still.",
  },
  {
    id: "delevan-nwr",
    name: "Delevan NWR",
    short: "Delevan",
    agency: "USFWS",
    county: "Colusa",
    region: "Sacramento Valley",
    zoneId: "balance-of-state",
    coords: { lat: 39.3183, lon: -122.1069 },
    svsma: true,
    quota: `${TYPE_A_FED} · assigned blinds & free roam`,
    // 10/24 142 / 609; 10/25 112 / 330 → 254 / 939 = 3.70
    harvest: week(WEEK_OPENER, 254, 939, ["NOPI", "NSHO"]),
    character: "Teal factory early. Free-roam hunters who scout the tule edges the day before do best.",
  },
  {
    id: "colusa-nwr",
    name: "Colusa NWR",
    short: "Colusa",
    agency: "USFWS",
    county: "Colusa",
    region: "Sacramento Valley",
    zoneId: "balance-of-state",
    coords: { lat: 39.1706, lon: -122.0469 },
    svsma: true,
    quota: `${TYPE_A_FED} · spaced blinds`,
    // 10/24 121 / 415; 10/25 69 / 196 → 190 / 611 = 3.22
    harvest: week(WEEK_OPENER, 190, 611, ["AGWT", "NSHO", "GWFG"]),
    character: "Smaller units that burn out fast under pressure. Midweek and post-front days shine.",
  },
  {
    id: "howard-slough",
    name: "Howard Slough (Upper Butte Basin)",
    short: "Howard Slough",
    agency: "CDFW",
    county: "Butte / Glenn",
    region: "Butte Basin",
    zoneId: "balance-of-state",
    coords: { lat: 39.4614, lon: -121.8783 },
    svsma: true,
    quota: UPPER_BUTTE,
    // 10/24 50 / 156; 10/25 29 / 58 → 79 / 214 = 2.71
    harvest: week(WEEK_OPENER, 79, 214, ["AMWI", "GWFG", "AGWT"]),
    character: "Butte Creek timber and flooded ag. Specs pile in after the first real north wind.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Upper-Butte-Basin-WA",
  },
  {
    id: "llano-seco",
    name: "Llano Seco (Upper Butte Basin WA)",
    short: "Llano Seco",
    agency: "CDFW",
    county: "Butte / Glenn",
    region: "Butte Basin",
    zoneId: "balance-of-state",
    coords: { lat: 39.6052, lon: -121.9103 },
    svsma: true,
    quota: UPPER_BUTTE,
    // 10/24 29 / 50; 10/25 25 / 39 → 54 / 89 = 1.65
    harvest: week(WEEK_OPENER, 54, 89, ["GWFG", "AMWI"]),
    character: "The third Upper Butte unit — the one Tad kept asking for. Butte Basin timber and wetlands; quieter than Howard Slough once the lottery shakes out.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Upper-Butte-Basin-WA",
  },
  {
    id: "little-dry-creek",
    name: "Little Dry Creek (LDC)",
    short: "LDC",
    agency: "CDFW",
    county: "Butte",
    region: "Butte Basin",
    zoneId: "balance-of-state",
    coords: { lat: 39.3931, lon: -121.8839 },
    svsma: true,
    quota: UPPER_BUTTE,
    // 10/24 58 / 192; 10/25 44 / 113 → 102 / 305 = 2.99
    harvest: week(WEEK_OPENER, 102, 305, ["MALL", "AMWI"]),
    character: "Walk-in water off the Butte Basin. Waders, a headlamp, and the breadcrumb trail earn their keep here.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Upper-Butte-Basin-WA",
  },
  {
    id: "gray-lodge",
    name: "Gray Lodge WA",
    short: "Gray Lodge",
    agency: "CDFW",
    county: "Butte",
    region: "Butte Basin",
    zoneId: "balance-of-state",
    coords: { lat: 39.3255, lon: -121.8178 },
    svsma: true,
    quota: `${TYPE_A} · 14 CCR §551(b)(40)`,
    // 10/24 170 / 335; 10/25 81 / 137 → 251 / 472 = 1.88
    harvest: week(WEEK_OPENER, 251, 472, ["MALL", "GADW", "NSHO"]),
    character: "The Buttes on the horizon and birds in every direction. Busy — get away from the parking-lot ponds.",
  },
  {
    id: "yolo-bypass",
    name: "Yolo Bypass WA",
    short: "Yolo Bypass",
    agency: "CDFW",
    county: "Yolo",
    region: "Delta & Suisun",
    zoneId: "balance-of-state",
    coords: { lat: 38.5505, lon: -121.6260 },
    svsma: false,
    quota: `${TYPE_A} · 14 CCR §551(b)(109)`,
    // Report name "Yolo": 10/24 212 / 914; 10/25 135 / 352 → 347 / 1266 = 3.65
    harvest: week(WEEK_OPENER, 347, 1266, ["NSHO", "AGWT"]),
    character: "In sight of the Causeway. Shallow, windy, and better the morning after a storm pushes birds off the rice.",
  },
  {
    id: "grizzly-island",
    name: "Grizzly Island WA",
    short: "Grizzly Island",
    agency: "CDFW",
    county: "Solano",
    region: "Delta & Suisun",
    zoneId: "balance-of-state",
    coords: { lat: 38.1419, lon: -121.9769 },
    svsma: false,
    quota:
      "Mixed entry types by unit · Type A: Crescent, Crescent Family, Grizzly Island, Joice Island · Type B: Goodyear Slough, Island Slough, West Family · Type C: Grey Goose · 14 CCR §551(b)(42)",
    // 10/24 278 / 779; 10/25 95 / 128 → 373 / 907 = 2.43
    harvest: week(WEEK_OPENER, 373, 907, ["NSHO", "AGWT"]),
    character: "Suisun wind is the whole game. On a howler the birds stay low and decoy hard to the lee side.",
  },
  {
    id: "north-grasslands",
    name: "North Grasslands WA",
    short: "North Grasslands",
    agency: "CDFW",
    county: "Merced / Stanislaus",
    region: "Grasslands",
    zoneId: "southern-san-joaquin",
    coords: { lat: 37.3188, lon: -120.9600 },
    svsma: false,
    quota: `${TYPE_A} · China Island, Gadwall & Salt Slough units · 14 CCR §551(b)(71)`,
    // Three-unit total (CDFW reports each unit separately):
    //   China Island 10/24 10 / 13;  10/25 1 / 7
    //   Gadwall      10/24 36 / 150; 10/25 25 / 60
    //   Salt Slough  10/24 72 / 178; 10/25 47 / 52
    //   → 191 hunters / 460 waterfowl = 2.41
    harvest: week(WEEK_OPENER, 191, 460, ["MALL", "AGWT", "NSHO", "WODU"]),
    character: "Three units strung along the San Joaquin. Know which one you drew before you leave the truck.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/North-Grasslands-WA",
  },
  {
    id: "san-luis-nwr",
    name: "San Luis NWR",
    short: "San Luis",
    agency: "USFWS",
    county: "Merced",
    region: "Grasslands",
    zoneId: "southern-san-joaquin",
    coords: { lat: 37.1819, lon: -120.8225 },
    svsma: false,
    quota: `${TYPE_A_FED} · spaced blinds & free roam units`,
    // 10/24 123 / 272; 10/25 79 / 113 → 202 / 385 = 1.91
    harvest: week(WEEK_OPENER, 202, 385, ["MALL", "AGWT"]),
    character: "Grasslands teal on the opener and big pintail flights later. Tule fog can hold shoot light back — be ready.",
  },
  {
    id: "los-banos",
    name: "Los Banos WA",
    short: "Los Banos",
    agency: "CDFW",
    county: "Merced",
    region: "Grasslands",
    zoneId: "southern-san-joaquin",
    coords: { lat: 37.0999, lon: -120.8184 },
    svsma: false,
    quota: `${TYPE_A} · 14 CCR §551(b)(58)`,
    // 10/24 147 / 377; 10/25 60 / 117 → 207 / 494 = 2.39
    harvest: week(WEEK_OPENER, 207, 494, ["MALL", "AGWT"]),
    character: "Oldest state area in the system. Heavy shoveler mix; pass on the spoonies early and the pintail will come.",
  },
  {
    id: "volta",
    name: "Volta WA",
    short: "Volta",
    agency: "CDFW",
    county: "Merced",
    region: "Grasslands",
    zoneId: "southern-san-joaquin",
    coords: { lat: 37.1313, lon: -120.9246 },
    svsma: false,
    quota: `${TYPE_A} · 14 CCR §551(b)(103)`,
    // 10/24 160 / 640; 10/25 108 / 370 → 268 / 1010 = 3.77
    harvest: week(WEEK_OPENER, 268, 1010, ["MALL", "AGWT", "CITE"]),
    character: "Small Merced grasslands marsh. Tight ponds, so a short spread and a good hide beat a big decoy show.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Volta-WA",
  },
  {
    id: "mendota",
    name: "Mendota WA",
    short: "Mendota",
    agency: "CDFW",
    county: "Fresno",
    region: "San Joaquin Valley",
    zoneId: "southern-san-joaquin",
    coords: { lat: 36.6950, lon: -120.3078 },
    svsma: false,
    quota: `${TYPE_A} · 14 CCR §551(b)(62) · 30431 W Whitesbridge Ave, Mendota`,
    // Not listed in the Oct 21–25, 2026 report (DocumentID 247861). No other
    // week or season average is substituted — the Index hides Mendota's score.
    harvest: null,
    character: "Way down off Whitesbridge, south of the Grasslands. Fog sits on it some mornings — bring the GPS trail.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Mendota-WA",
  },
  {
    id: "ash-creek",
    name: "Ash Creek WA",
    short: "Ash Creek",
    agency: "CDFW",
    county: "Lassen / Modoc",
    region: "Northeastern",
    zoneId: "northeastern",
    coords: { lat: 41.1885, lon: -121.0558 },
    svsma: false,
    quota: `${TYPE_B} · 14 CCR §551(b)(2)`,
    // 10/21 16 / 57; 10/24 22 / 95; 10/25 6 / 14 → 44 / 166 = 3.77
    harvest: week(WEEK_NE, 44, 166, ["MALL", "NOPI", "AMWI", "AGWT"]),
    character: "Big Valley meadow marsh up in the Northeastern Zone. Opens early and freezes early — hunt it before the ice.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Ash-Creek-WA",
  },
  {
    id: "honey-lake",
    name: "Honey Lake WA",
    short: "Honey Lake",
    agency: "CDFW",
    county: "Lassen",
    region: "Northeastern",
    zoneId: "northeastern",
    coords: { lat: 40.2986, lon: -120.3764 },
    svsma: false,
    quota: `${TYPE_B} · Dakin & Fleming units · 14 CCR §551(b)(47)`,
    // Dakin + Fleming combined (CDFW reports each unit separately):
    //   Dakin   10/21 5 / 20; 10/24 7 / 19; 10/25 4 / 18
    //   Fleming 10/21 1 / 6;  10/24 3 / 1;  10/25 3 / 3
    //   → 23 hunters / 67 waterfowl = 2.91
    harvest: week(WEEK_NE, 23, 67, ["AGWT", "MALL", "NOPI", "AMWI"]),
    character: "High desert water east of Susanville. Wind off the lake is real — the Dakin and Fleming units hunt differently on it.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Honey-Lake-WA",
  },
];

export const REFUGE_BY_ID: Record<string, Refuge> = Object.fromEntries(REFUGES.map((r) => [r.id, r]));

// ── Tactical-map schematics ────────────────────────────────────────────────
// Real unit boundaries aren't published in a form we can bundle, so the
// tactical map draws a schematic per refuge: ponds, the check station and the
// lots, laid out deterministically from the refuge id. It is clearly labeled
// "schematic" in the UI — the GPS trail and your waypoints are the real data.

export type Pond = { id: string; label: string; center: LatLon; rx: number; ry: number; rot: number };
export type Landmark = { id: string; label: string; kind: "check" | "parking" | "levee"; at: LatLon };
export type Schematic = { ponds: Pond[]; landmarks: Landmark[] };

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const schematicCache: Record<string, Schematic> = {};

export function schematicFor(r: Refuge): Schematic {
  if (schematicCache[r.id]) return schematicCache[r.id];
  const rnd = seeded(r.id);
  const ponds: Pond[] = [];
  const count = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < count; i++) {
    const bearing = (i / count) * 360 + rnd() * 30;
    const dist = 450 + rnd() * 900;
    ponds.push({
      id: `${r.id}-p${i + 1}`,
      label: `Unit ${String.fromCharCode(65 + Math.floor(i / 3))}${(i % 3) + 1}`,
      center: destination(r.coords, bearing, dist),
      rx: 140 + rnd() * 160,
      ry: 90 + rnd() * 120,
      rot: rnd() * 180,
    });
  }
  const landmarks: Landmark[] = [
    { id: `${r.id}-check`, label: "Check Station", kind: "check", at: r.coords },
    { id: `${r.id}-lot1`, label: "Lot 1", kind: "parking", at: destination(r.coords, 200 + rnd() * 40, 320) },
    { id: `${r.id}-lot2`, label: "Lot 2", kind: "parking", at: destination(r.coords, 40 + rnd() * 60, 1100) },
  ];
  return (schematicCache[r.id] = { ponds, landmarks });
}
