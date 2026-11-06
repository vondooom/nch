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
// Harvest
// figures are DESK FIGURES: entered by the editors from the weekly CDFW / USFWS
// waterfowl harvest summaries (wildlife.ca.gov → Waterfowl → Hunting Results)
// and shown with that caveat in the UI. Update `harvest` each week — the
// "Recent Hunter Reports" sub-score reads straight from birdsPerHunter.

export type SpeciesShare = { species: string; pct: number };

export type Harvest = {
  week: string;              // which shoot days these averages cover
  birdsPerHunter: number;
  hunters: number;           // hunters checked through
  quota: string;             // how you get in
  species: SpeciesShare[];   // top species, % of the bag
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
  harvest: Harvest;
  /** A line from the desk on how the place hunts. */
  character: string;
  /** Agency page for the area. */
  url?: string;
};

export const AGENCY_LABEL: Record<Refuge["agency"], string> = { USFWS: "Federal", CDFW: "State" };

const OPENER = "Opener weekend · Oct 24–25, 2026";
// Areas added in Build 4 carry seed numbers until the desk enters a real week.
const DESK_SEED = "Desk seed · first weekly report not entered yet";

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
    harvest: {
      week: OPENER,
      birdsPerHunter: 3.9,
      hunters: 412,
      quota: "Reservation draw + first-come line · assigned ponds & spaced blinds",
      species: [
        { species: "Northern Pintail", pct: 24 },
        { species: "Green-winged Teal", pct: 21 },
        { species: "Mallard", pct: 16 },
        { species: "American Widgeon", pct: 14 },
        { species: "White-fronted Goose", pct: 9 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 3.4,
      hunters: 248,
      quota: "Reservation draw + first-come line · assigned blinds & free roam",
      species: [
        { species: "Green-winged Teal", pct: 26 },
        { species: "Northern Pintail", pct: 22 },
        { species: "Northern Shoveler", pct: 15 },
        { species: "Mallard", pct: 13 },
        { species: "White-fronted Goose", pct: 8 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 3.1,
      hunters: 186,
      quota: "Reservation draw + first-come line · spaced blinds",
      species: [
        { species: "Northern Pintail", pct: 23 },
        { species: "Green-winged Teal", pct: 22 },
        { species: "American Widgeon", pct: 16 },
        { species: "Mallard", pct: 14 },
        { species: "White-fronted Goose", pct: 7 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 2.8,
      hunters: 164,
      quota: "Type A area · reservation draw + sweat line at the check station",
      species: [
        { species: "Mallard", pct: 22 },
        { species: "Green-winged Teal", pct: 20 },
        { species: "Northern Pintail", pct: 18 },
        { species: "Wood Duck", pct: 9 },
        { species: "White-fronted Goose", pct: 12 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 2.7,
      hunters: 78,
      quota: "Type A area · reservation draw + morning lottery + sweat line · ~78 hunters · check station at Seven Mile Lane & Nelson Rd",
      species: [
        { species: "Mallard", pct: 21 },
        { species: "Green-winged Teal", pct: 21 },
        { species: "Northern Pintail", pct: 18 },
        { species: "American Widgeon", pct: 11 },
        { species: "White-fronted Goose", pct: 11 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 2.6,
      hunters: 132,
      quota: "Type A area · reservation draw + sweat line",
      species: [
        { species: "Green-winged Teal", pct: 24 },
        { species: "Mallard", pct: 19 },
        { species: "Northern Pintail", pct: 17 },
        { species: "American Widgeon", pct: 12 },
        { species: "White-fronted Goose", pct: 10 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 3.2,
      hunters: 388,
      quota: "Type A area · reservation draw + large sweat line · free roam",
      species: [
        { species: "Northern Pintail", pct: 21 },
        { species: "Green-winged Teal", pct: 20 },
        { species: "Mallard", pct: 17 },
        { species: "American Widgeon", pct: 13 },
        { species: "Snow/Ross's Goose", pct: 10 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 2.4,
      hunters: 210,
      quota: "Type A area · reservation draw + first-come · Wed/Sat/Sun",
      species: [
        { species: "Northern Shoveler", pct: 23 },
        { species: "Green-winged Teal", pct: 21 },
        { species: "Mallard", pct: 18 },
        { species: "Gadwall", pct: 11 },
        { species: "Northern Pintail", pct: 10 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 2.1,
      hunters: 154,
      quota: "Type A area · reservation draw · tidal Suisun Marsh units",
      species: [
        { species: "Mallard", pct: 24 },
        { species: "Gadwall", pct: 18 },
        { species: "Northern Shoveler", pct: 17 },
        { species: "Green-winged Teal", pct: 15 },
        { species: "American Widgeon", pct: 11 },
      ],
    },
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
    harvest: {
      week: DESK_SEED,
      birdsPerHunter: 2.6,
      hunters: 120,
      quota: "State wildlife area · China Island, Gadwall & Salt Slough units · check CDFW for entry type & reservations",
      species: [
        { species: "Green-winged Teal", pct: 25 },
        { species: "Northern Shoveler", pct: 19 },
        { species: "Northern Pintail", pct: 17 },
        { species: "Gadwall", pct: 12 },
        { species: "Mallard", pct: 10 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 3.5,
      hunters: 236,
      quota: "Reservation draw + first-come · spaced blinds & free roam units",
      species: [
        { species: "Green-winged Teal", pct: 27 },
        { species: "Northern Shoveler", pct: 19 },
        { species: "Northern Pintail", pct: 18 },
        { species: "Mallard", pct: 12 },
        { species: "American Widgeon", pct: 9 },
      ],
    },
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
    harvest: {
      week: OPENER,
      birdsPerHunter: 3.0,
      hunters: 198,
      quota: "Type A area · reservation draw + sweat line",
      species: [
        { species: "Green-winged Teal", pct: 25 },
        { species: "Northern Shoveler", pct: 20 },
        { species: "Northern Pintail", pct: 17 },
        { species: "Gadwall", pct: 11 },
        { species: "Mallard", pct: 10 },
      ],
    },
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
    harvest: {
      week: DESK_SEED,
      birdsPerHunter: 2.6,
      hunters: 90,
      quota: "Type A area · reservation draw + sweat line",
      species: [
        { species: "Green-winged Teal", pct: 26 },
        { species: "Northern Shoveler", pct: 20 },
        { species: "Northern Pintail", pct: 16 },
        { species: "Gadwall", pct: 11 },
        { species: "Mallard", pct: 10 },
      ],
    },
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
    harvest: {
      week: DESK_SEED,
      birdsPerHunter: 2.4,
      hunters: 110,
      quota: "State wildlife area · check CDFW for entry type & reservations · 30431 W Whitesbridge Ave, Mendota",
      species: [
        { species: "Green-winged Teal", pct: 24 },
        { species: "Northern Shoveler", pct: 21 },
        { species: "Northern Pintail", pct: 16 },
        { species: "Gadwall", pct: 12 },
        { species: "Mallard", pct: 9 },
      ],
    },
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
    harvest: {
      week: DESK_SEED,
      birdsPerHunter: 2.2,
      hunters: 60,
      quota: "State wildlife area · check CDFW for entry type & access",
      species: [
        { species: "Mallard", pct: 26 },
        { species: "Gadwall", pct: 18 },
        { species: "American Widgeon", pct: 16 },
        { species: "Green-winged Teal", pct: 14 },
        { species: "Canada Goose", pct: 12 },
      ],
    },
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
    harvest: {
      week: DESK_SEED,
      birdsPerHunter: 2.1,
      hunters: 70,
      quota: "State wildlife area · Dakin & Fleming units · check CDFW for entry type & access",
      species: [
        { species: "Mallard", pct: 24 },
        { species: "Gadwall", pct: 19 },
        { species: "American Widgeon", pct: 15 },
        { species: "Green-winged Teal", pct: 13 },
        { species: "Canada Goose", pct: 14 },
      ],
    },
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
