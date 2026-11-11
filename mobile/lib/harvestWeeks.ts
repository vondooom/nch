// Official CDFW weekly waterfowl hunt results, 2026–27 season.
//
// Catalog: https://nrm.dfg.ca.gov/documents/ContextDocs.aspx?cat=WLB-WaterfowlHunting
// Each PDF lists, per area and shoot day, "# OF HUNTERS", "# OF WATERFOWL" and
// the day's #1 / #2 species codes. We store the week sums only:
//   hunters   = sum of daily hunters
//   waterfowl = sum of daily waterfowl
//   bph       = waterfowl / hunters (precise; the UI rounds to 2 decimals)
// Species are the codes CDFW listed that week, by name — CDFW publishes no bag
// shares, so there are no percentages anywhere. Nothing here is estimated; an
// area missing from a week's PDF is simply absent from that week's table.

export type HarvestWeek = {
  id: "2026-11-04" | "2026-10-28" | "2026-10-21";
  docId: number;
  url: string;
  /** Short date range, e.g. "Nov 4–8, 2026". */
  range: string;
  /** What the app prints above the numbers. */
  label: string;
};

const fileUrl = (docId: number) => `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=${docId}&inline=`;
const mk = (id: HarvestWeek["id"], docId: number, range: string): HarvestWeek => ({
  id,
  docId,
  url: fileUrl(docId),
  range,
  label: `CDFW weekly results · ${range}`,
});

/** "Waterfowl Hunt Results - November 4-8, 2026" (published Nov 10, 2026). The Index week. */
export const WEEK_NOV_4_8 = mk("2026-11-04", 248028, "Nov 4–8, 2026");
/** "Waterfowl Hunt Results" for Oct 28–Nov 1, 2026. Prior week — history / fallback. */
export const WEEK_OCT_28_NOV_1 = mk("2026-10-28", 247945, "Oct 28–Nov 1, 2026");
/** Opener week, Oct 21–25, 2026. Only Honey Lake still leans on it. */
export const WEEK_OCT_21_25 = mk("2026-10-21", 247861, "Oct 21–25, 2026");

/** The week the Index scores against by default. */
export const INDEX_WEEK = WEEK_NOV_4_8;
export const HARVEST_CATALOG_URL = "https://nrm.dfg.ca.gov/documents/ContextDocs.aspx?cat=WLB-WaterfowlHunting";

export type SpeciesCode = keyof typeof SPECIES_CODE;
export const SPECIES_CODE = {
  MALL: "Mallard",
  AGWT: "Green-winged Teal",
  NSHO: "Northern Shoveler",
  NOPI: "Northern Pintail",
  AMWI: "American Wigeon",
  GADW: "Gadwall",
  GWFG: "White-fronted Goose",
  CITE: "Cinnamon Teal",
  WODU: "Wood Duck",
  RNDU: "Ring-necked Duck",
  REDH: "Redhead",
  BUFF: "Bufflehead",
  CAGO: "Canada Goose",
  OTDU: "Other duck",
} as const;

export type WeekRow = { hunters: number; waterfowl: number; codes: SpeciesCode[] };

// ── Nov 4–8, 2026 · DocumentID 248028 ─────────────────────────────────────
// Shoot days Nov 4 / Nov 7 / Nov 8 (hunters / waterfowl):
//   Sacramento      64/160, 77/144, 73/110
//   Delevan         76/220, 95/229, 72/122
//   Colusa          56/140, 52/135, 39/37
//   Howard Slough   19/15,  25/22,  17/6
//   LDC             47/141, 61/54,  41/61
//   Llano Seco      9/7,    21/33,  16/11
//   Gray Lodge      42/59,  91/113, 39/25
//   Yolo            123/240,134/175,114/95
//   Grizzly Island  47/60,  99/84,  51/45
//   China Island    2/0,    0/0,    0/0     ┐
//   Gadwall         6/2,    17/6,   2/1     ├ North Grasslands (combined)
//   Salt Slough     20/7,   24/7,   20/3    ┘
//   San Luis        45/27,  54/51,  30/5
//   Los Banos       34/23,  63/22,  27/7
//   Volta           30/54,  61/43,  11/3
//   Mendota         71/72,  106/37, 45/11
//   Ash Creek       16/56,  30/73,  23/60
// Honey Lake (Dakin / Fleming) not listed.
// NOTE: CDFW's PDF codes "RNDU" — Ring-necked Duck in the AOU 4-letter scheme
// (Redhead is REDH). Shown as Ring-necked Duck.
export const NOV_4_8: Record<string, WeekRow> = {
  "sac-nwr": { hunters: 214, waterfowl: 414, codes: ["NSHO", "MALL", "NOPI", "RNDU"] },
  "delevan-nwr": { hunters: 243, waterfowl: 571, codes: ["NSHO", "NOPI"] },
  "colusa-nwr": { hunters: 147, waterfowl: 312, codes: ["NOPI", "NSHO"] },
  "howard-slough": { hunters: 61, waterfowl: 43, codes: ["MALL", "GWFG", "NSHO", "AMWI"] },
  "little-dry-creek": { hunters: 149, waterfowl: 256, codes: ["MALL", "NSHO", "AMWI"] },
  "llano-seco": { hunters: 46, waterfowl: 51, codes: ["NSHO", "GADW", "AGWT"] },
  "gray-lodge": { hunters: 172, waterfowl: 197, codes: ["MALL", "RNDU"] },
  "yolo-bypass": { hunters: 371, waterfowl: 510, codes: ["NSHO", "MALL", "BUFF", "NOPI"] },
  "grizzly-island": { hunters: 197, waterfowl: 189, codes: ["NSHO", "AMWI"] },
  "north-grasslands": { hunters: 91, waterfowl: 26, codes: ["AGWT", "MALL", "NSHO"] },
  "san-luis-nwr": { hunters: 129, waterfowl: 83, codes: ["MALL", "AGWT"] },
  "los-banos": { hunters: 124, waterfowl: 52, codes: ["MALL", "AMWI", "NSHO", "AGWT"] },
  volta: { hunters: 102, waterfowl: 100, codes: ["MALL", "AGWT", "GADW"] },
  mendota: { hunters: 222, waterfowl: 120, codes: ["MALL", "NSHO", "AGWT"] },
  "ash-creek": { hunters: 69, waterfowl: 189, codes: ["MALL", "AGWT", "NOPI"] },
};

// ── Oct 28–Nov 1, 2026 · DocumentID 247945 ────────────────────────────────
// Week totals only (species codes not carried over for this week).
// Honey Lake not listed.
export const OCT_28_NOV_1: Record<string, WeekRow> = {
  "sac-nwr": { hunters: 214, waterfowl: 457, codes: [] },
  "delevan-nwr": { hunters: 294, waterfowl: 944, codes: [] },
  "colusa-nwr": { hunters: 145, waterfowl: 294, codes: [] },
  "howard-slough": { hunters: 80, waterfowl: 73, codes: [] },
  "little-dry-creek": { hunters: 139, waterfowl: 303, codes: [] },
  "llano-seco": { hunters: 57, waterfowl: 58, codes: [] },
  "gray-lodge": { hunters: 183, waterfowl: 165, codes: [] },
  "yolo-bypass": { hunters: 344, waterfowl: 761, codes: [] },
  "grizzly-island": { hunters: 240, waterfowl: 363, codes: [] },
  "north-grasslands": { hunters: 138, waterfowl: 157, codes: [] },
  "san-luis-nwr": { hunters: 177, waterfowl: 269, codes: [] },
  "los-banos": { hunters: 176, waterfowl: 190, codes: [] },
  volta: { hunters: 152, waterfowl: 268, codes: [] },
  mendota: { hunters: 255, waterfowl: 202, codes: [] },
  "ash-creek": { hunters: 40, waterfowl: 110, codes: [] },
};

// ── Oct 21–25, 2026 · DocumentID 247861 ───────────────────────────────────
// Kept only for areas absent from both later weeks.
//   Honey Lake = Dakin + Fleming:
//     Dakin   10/21 5/20; 10/24 7/19; 10/25 4/18
//     Fleming 10/21 1/6;  10/24 3/1;  10/25 3/3   → 23 / 67 = 2.91
export const OCT_21_25: Record<string, WeekRow> = {
  "honey-lake": { hunters: 23, waterfowl: 67, codes: ["AGWT", "MALL", "NOPI", "AMWI"] },
};

/** Newest first. The Index uses the first week that lists the area. */
export const WEEKS_NEWEST_FIRST: { week: HarvestWeek; rows: Record<string, WeekRow> }[] = [
  { week: WEEK_NOV_4_8, rows: NOV_4_8 },
  { week: WEEK_OCT_28_NOV_1, rows: OCT_28_NOV_1 },
  { week: WEEK_OCT_21_25, rows: OCT_21_25 },
];
