import { LatLon } from "./geo";
import type { WaterfowlZoneId } from "./regs";
import { HarvestWeek, INDEX_WEEK, SPECIES_CODE, WeekRow, WEEKS_NEWEST_FIRST } from "./harvestWeeks";

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
// OFFICIAL CDFW WEEKLY TOTALS — see lib/harvestWeeks.ts for every number, its
// DocumentID and the daily rows behind it. The Index week is Nov 4–8, 2026
// (DocumentID 248028). Each area takes the newest week that lists it; Honey
// Lake is absent from Nov 4–8 and Oct 28–Nov 1, so it keeps its Oct 21–25
// totals and the UI labels them with those dates, not the Index week.
// An area missing from every week gets `harvest: null` and the Index hides its
// score rather than pretending reports were zero.
//
// ── Entry type ─────────────────────────────────────────────────────────────
// Type A / B / C from Cal. Code Regs. tit. 14, § 551 (amendments filed
// 6-7-2024, operative 7-1-2024, Register 2024 No. 23):
// https://www.law.cornell.edu/regulations/california/14-CCR-551
// State areas are listed under §551(b); the federal refuges here are Type A
// under §551(c).

export const HARVEST_SOURCE_URL = INDEX_WEEK.url;
export const HARVEST_SOURCE_LABEL = `CDFW 2026-27 Waterfowl Hunt Results · ${INDEX_WEEK.range}`;
export const ENTRY_TYPE_SOURCE_URL = "https://www.law.cornell.edu/regulations/california/14-CCR-551";

/** pct is optional: CDFW's weekly report names top species but not bag shares. */
export type SpeciesShare = { species: string; pct?: number };

export type Harvest = {
  week: string;              // display label, e.g. "CDFW weekly results · Nov 4–8, 2026"
  range: string;             // "Nov 4–8, 2026"
  docId: number;             // CDFW FileHandler DocumentID
  sourceUrl: string;         // the PDF these totals came from
  /** False when the area is on an older week than the Index default. */
  isIndexWeek: boolean;
  birdsPerHunter: number;    // waterfowl / hunters for the week
  hunters: number;           // hunters checked through, week total
  waterfowl: number;         // waterfowl checked through, week total
  species: SpeciesShare[];   // top species codes seen that week (names only)
  /** The next-older official week that lists this area, for context. */
  prior?: Harvest;
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

function toHarvest(w: HarvestWeek, row: WeekRow): Harvest {
  return {
    week: w.label,
    range: w.range,
    docId: w.docId,
    sourceUrl: w.url,
    isIndexWeek: w.id === INDEX_WEEK.id,
    hunters: row.hunters,
    waterfowl: row.waterfowl,
    birdsPerHunter: row.waterfowl / row.hunters,
    species: row.codes.map((c) => ({ species: SPECIES_CODE[c] })),
  };
}

/** Newest official week listing this area (plus the one before it), or null. */
export function harvestFor(id: string): Harvest | null {
  const hits = WEEKS_NEWEST_FIRST.filter((x) => x.rows[id]);
  if (!hits.length) return null;
  const h = toHarvest(hits[0].week, hits[0].rows[id]);
  if (hits[1]) h.prior = toHarvest(hits[1].week, hits[1].rows[id]);
  return h;
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
    harvest: harvestFor("sac-nwr"),
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
    harvest: harvestFor("delevan-nwr"),
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
    harvest: harvestFor("colusa-nwr"),
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
    harvest: harvestFor("howard-slough"),
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
    harvest: harvestFor("llano-seco"),
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
    harvest: harvestFor("little-dry-creek"),
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
    harvest: harvestFor("gray-lodge"),
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
    harvest: harvestFor("yolo-bypass"),
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
    harvest: harvestFor("grizzly-island"),
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
    harvest: harvestFor("north-grasslands"),
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
    harvest: harvestFor("san-luis-nwr"),
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
    harvest: harvestFor("los-banos"),
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
    harvest: harvestFor("volta"),
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
    harvest: harvestFor("mendota"),
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
    harvest: harvestFor("ash-creek"),
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
    harvest: harvestFor("honey-lake"),
    character: "High desert water east of Susanville. Wind off the lake is real — the Dakin and Fleming units hunt differently on it.",
    url: "https://wildlife.ca.gov/Lands/Places-to-Visit/Honey-Lake-WA",
  },
];

export const REFUGE_BY_ID: Record<string, Refuge> = Object.fromEntries(REFUGES.map((r) => [r.id, r]));

