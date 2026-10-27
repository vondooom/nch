import { LatLon, destination } from "./geo";

// The ten public waterfowl areas the NorCalHunt Index tracks, north to south.
//
// Coordinates are the refuge headquarters / check-station area. Harvest
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
  agency: "USFWS" | "CDFW";
  county: string;
  region: "Sacramento Valley" | "Butte Basin" | "Delta & Suisun" | "Grasslands";
  coords: LatLon;
  /** Inside the Sacramento Valley Special Management Area (3 white-fronts/day). */
  svsma: boolean;
  harvest: Harvest;
  /** A line from the desk on how the place hunts. */
  character: string;
};

const OPENER = "Opener weekend · Oct 24–25, 2026";

export const REFUGES: Refuge[] = [
  {
    id: "sac-nwr",
    name: "Sacramento NWR",
    short: "Sac NWR",
    agency: "USFWS",
    county: "Glenn / Colusa",
    region: "Sacramento Valley",
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
  },
  {
    id: "little-dry-creek",
    name: "Little Dry Creek (LDC)",
    short: "LDC",
    agency: "CDFW",
    county: "Butte",
    region: "Butte Basin",
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
  },
  {
    id: "gray-lodge",
    name: "Gray Lodge WA",
    short: "Gray Lodge",
    agency: "CDFW",
    county: "Butte",
    region: "Butte Basin",
    coords: { lat: 39.3156, lon: -121.8128 },
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
    coords: { lat: 38.5539, lon: -121.6308 },
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
    id: "san-luis-nwr",
    name: "San Luis NWR",
    short: "San Luis",
    agency: "USFWS",
    county: "Merced",
    region: "Grasslands",
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
    coords: { lat: 37.0997, lon: -120.8314 },
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
