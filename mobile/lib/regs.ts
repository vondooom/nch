// 2026–27 California waterfowl regulations as the NorCalHunt desk published
// them (Issue #2 "The Duck Calendar Is Locked", Issue #20, and the site's
// Bag Limits guide). Balance of State Zone unless noted. Always confirm in the
// CDFW Waterfowl Regulations booklet — the app is a field reference, not law.

export type SeasonRow = { label: string; dates: string; start: string; end: string; note?: string };

// ISO dates are inclusive and interpreted as Pacific calendar days.
export const BOS_SEASONS: SeasonRow[] = [
  { label: "Early Goose", dates: "Oct 3 – Oct 5, 2026", start: "2026-10-03", end: "2026-10-05", note: "Large Canada geese only" },
  { label: "Regular Duck Season", dates: "Oct 24, 2026 – Jan 31, 2027", start: "2026-10-24", end: "2027-01-31", note: "Coots & moorhens open alongside, 25/day" },
  { label: "Regular Goose Season", dates: "Oct 24, 2026 – Jan 31, 2027", start: "2026-10-24", end: "2027-01-31" },
  { label: "Scaup (Bluebill)", dates: "Nov 7, 2026 – Jan 31, 2027", start: "2026-11-07", end: "2027-01-31", note: "2 per day inside the 7" },
  { label: "Veterans Hunt Days", dates: "Feb 6 – Feb 7, 2027", start: "2027-02-06", end: "2027-02-07", note: "Ducks only" },
  { label: "Youth Hunt Days", dates: "Feb 13 – Feb 14, 2027", start: "2027-02-13", end: "2027-02-14" },
  { label: "Late White-front & White Goose", dates: "Feb 20 – Feb 24, 2027", start: "2027-02-20", end: "2027-02-24" },
  { label: "Late Canada Goose", dates: "Feb 20 – Feb 21, 2027", start: "2027-02-20", end: "2027-02-21" },
];

export const NE_SEASONS: SeasonRow[] = [
  { label: "Ducks (Northeastern)", dates: "Oct 3, 2026 – Jan 13, 2027", start: "2026-10-03", end: "2027-01-13" },
  { label: "Youth Days (Northeastern)", dates: "Sep 19 – Sep 20, 2026", start: "2026-09-19", end: "2026-09-20" },
  { label: "Veteran Days (Northeastern)", dates: "Jan 17 – Jan 18, 2027", start: "2027-01-17", end: "2027-01-18", note: "Ducks only" },
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

export const BAG_REFERENCE: { label: string; value: string }[] = [
  { label: "Ducks", value: "7 / day · 21 possession" },
  { label: "Mallards", value: "Up to 7, no more than 2 hens" },
  { label: "Pintail", value: `${BAG_LIMITS.pintail} (any sex)` },
  { label: "Canvasback · Redhead", value: "2 each" },
  { label: "Scaup", value: "2 — Nov 7 to Jan 31 only" },
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

export function scaupOpen(day: string): boolean {
  return inSeason(BOS_SEASONS[3], day);
}

export function seasonStatus(row: SeasonRow, today: string): "open" | "upcoming" | "closed" {
  if (inSeason(row, today)) return "open";
  return today < row.start ? "upcoming" : "closed";
}
