import type { SeasonPeriod, SeasonRecord } from "./types";

const YEAR = "2026-2027";
const AGENCY = "California Department of Fish and Wildlife";
const HIDDEN =
  "Mapped from the existing Local Hunts California archive. Hidden until an agency source URL and a verbatim quote are attached.";

function period(open: string, close: string, note: string | null = ""): SeasonPeriod {
  return { open, close, note };
}

function record(
  input: Pick<SeasonRecord, "id" | "species" | "seasonName" | "zone" | "periods" | "bagLimit" | "possessionLimit"> & {
    notes?: string;
  },
): SeasonRecord {
  return {
    ...input,
    state: "california",
    seasonYear: YEAR,
    agency: AGENCY,
    sourceTitle: "",
    sourceUrl: "",
    sourceQuote: "",
    checkedDate: "",
    notes: input.notes ? `${input.notes} ${HIDDEN}` : HIDDEN,
  };
}

const duckCaps =
  "Archive bag guide, inside the daily bag: up to 7 mallards (no more than 2 hens), 3 pintail, 2 canvasback, 2 redheads, and 2 scaup. Coots and moorhens are listed at 25 per day and 75 in possession.";
const gooseCaps =
  "Archive bag guide, inside the daily bag: up to 20 white geese and up to 10 dark geese. No more than 6 white-fronted geese. Sacramento Valley Special Management Area is listed at 3 white-fronted geese per day.";

/**
 * Existing California dates and limits, copied from the archive seasons and bag-limits sections.
 * None of these rows have a verbatim agency quote, so the state hub does not show them.
 */
export const californiaSeasons: SeasonRecord[] = [
  record({ id: "ca-deer-a-archery", species: "Deer", seasonName: "Archery", zone: "A", periods: [period("2026-07-11", "2026-08-02")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-a-general", species: "Deer", seasonName: "General rifle", zone: "A", periods: [period("2026-08-08", "2026-09-20")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-b-group-archery", species: "Deer", seasonName: "Archery", zone: "B1, B2, B3, B5, B6", periods: [period("2026-08-15", "2026-09-06")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-b-group-general", species: "Deer", seasonName: "General rifle", zone: "B1, B2, B3, B5, B6", periods: [period("2026-09-19", "2026-10-25")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-b4-archery", species: "Deer", seasonName: "Archery", zone: "B4", periods: [period("2026-07-25", "2026-08-16")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-b4-general", species: "Deer", seasonName: "General rifle", zone: "B4", periods: [period("2026-08-22", "2026-09-27")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-c1-archery", species: "Deer", seasonName: "Archery", zone: "C1", periods: [period("2026-08-15", "2026-08-30")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-c1-general", species: "Deer", seasonName: "General rifle", zone: "C1", periods: [period("2026-09-19", "2026-10-25")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-c2-c3-archery", species: "Deer", seasonName: "Archery", zone: "C2, C3", periods: [period("2026-08-15", "2026-09-05")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-c2-c3-general", species: "Deer", seasonName: "General rifle", zone: "C2, C3", periods: [period("2026-09-19", "2026-10-25")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-c4-archery", species: "Deer", seasonName: "Archery", zone: "C4", periods: [period("2026-08-15", "2026-08-30")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-c4-general", species: "Deer", seasonName: "General rifle", zone: "C4", periods: [period("2026-09-19", "2026-10-04")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-d-archery", species: "Deer", seasonName: "Archery", zone: "D3, D4, D5", periods: [period("2026-08-15", "2026-09-06")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-d-general", species: "Deer", seasonName: "General rifle", zone: "D3, D4, D5", periods: [period("2026-09-26", "2026-11-01")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x1-archery", species: "Deer", seasonName: "Archery", zone: "X1, X2, X3a, X3b, X4", periods: [period("2026-08-15", "2026-09-05")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x1-general", species: "Deer", seasonName: "General rifle", zone: "X1, X2, X3a, X3b, X4", periods: [period("2026-10-03", "2026-10-18")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x5-archery", species: "Deer", seasonName: "Archery", zone: "X5a, X5b", periods: [period("2026-08-15", "2026-09-05")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x5-general", species: "Deer", seasonName: "General rifle", zone: "X5a, X5b", periods: [period("2026-10-03", "2026-10-18")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x6-archery", species: "Deer", seasonName: "Archery", zone: "X6a, X6b", periods: [period("2026-08-15", "2026-09-05")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x6-general", species: "Deer", seasonName: "General rifle", zone: "X6a, X6b", periods: [period("2026-10-03", "2026-10-18")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x7-archery", species: "Deer", seasonName: "Archery", zone: "X7a, X7b", periods: [period("2026-08-15", "2026-09-05")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-deer-x7-general", species: "Deer", seasonName: "General rifle", zone: "X7a, X7b", periods: [period("2026-10-03", "2026-10-18")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-duck-bos", species: "Duck", seasonName: "General", zone: "Balance of State", periods: [period("2026-10-24", "2027-01-31")], bagLimit: "7", possessionLimit: "21", notes: duckCaps }),
  record({ id: "ca-scaup-bos", species: "Scaup", seasonName: "General", zone: "Balance of State", periods: [period("2026-11-07", "2027-01-31")], bagLimit: "2, inside the 7-duck daily bag", possessionLimit: "" }),
  record({ id: "ca-goose-bos-early-canada", species: "Canada goose", seasonName: "Early season, large Canada geese only", zone: "Balance of State", periods: [period("2026-10-03", "2026-10-05")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-goose-bos", species: "Goose", seasonName: "General", zone: "Balance of State", periods: [period("2026-10-24", "2027-01-31")], bagLimit: "30", possessionLimit: "90", notes: gooseCaps }),
  record({ id: "ca-goose-bos-late-canada", species: "Canada goose", seasonName: "Late season", zone: "Balance of State", periods: [period("2027-02-20", "2027-02-21")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-goose-bos-late-white", species: "White-fronted and white goose", seasonName: "Late season", zone: "Balance of State", periods: [period("2027-02-20", "2027-02-24")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-duck-ne", species: "Duck", seasonName: "General", zone: "Northeastern", periods: [period("2026-10-03", "2027-01-13")], bagLimit: "7", possessionLimit: "21", notes: duckCaps }),
  record({ id: "ca-scaup-ne", species: "Scaup", seasonName: "Split", zone: "Northeastern", periods: [period("2026-10-03", "2026-11-29"), period("2026-12-17", "2027-01-13")], bagLimit: "2, inside the 7-duck daily bag", possessionLimit: "" }),
  record({ id: "ca-goose-ne-canada", species: "Canada goose", seasonName: "Regular", zone: "Northeastern", periods: [period("2026-10-03", "2027-01-10")], bagLimit: "30", possessionLimit: "90", notes: `${gooseCaps} Archive bag guide also caps Large Canada geese at 3 in the Northeastern zone.` }),
  record({ id: "ca-goose-ne-white", species: "White and white-fronted goose", seasonName: "Regular", zone: "Northeastern", periods: [period("2026-10-03", "2026-11-29"), period("2027-01-01", "2027-01-13")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-goose-ne-late-white", species: "White and white-fronted goose", seasonName: "Late season", zone: "Northeastern", periods: [period("2027-02-05", "2027-03-10")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-turkey-fall", species: "Wild turkey", seasonName: "Fall general", zone: null, periods: [period("2026-11-14", "2026-12-13")], bagLimit: "1 either sex", possessionLimit: "", notes: "Archive lists 2 per season." }),
  record({ id: "ca-turkey-spring", species: "Wild turkey", seasonName: "Spring general", zone: null, periods: [period("2027-03-27", "2027-05-02")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-turkey-spring-archery", species: "Wild turkey", seasonName: "Spring archery-only extension", zone: null, periods: [period("2027-05-03", "2027-05-16")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-turkey-junior", species: "Wild turkey", seasonName: "Spring junior weekend", zone: null, periods: [period("2027-03-20", "2027-03-21")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-turkey-junior-extension", species: "Wild turkey", seasonName: "Spring additional junior extension", zone: null, periods: [period("2027-05-03", "2027-05-16")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-dove-early", species: "Mourning and white-winged dove", seasonName: "Early split", zone: null, periods: [period("2026-09-01", "2026-09-15")], bagLimit: "15, no more than 10 white-winged", possessionLimit: "45" }),
  record({ id: "ca-dove-late", species: "Mourning and white-winged dove", seasonName: "Late split", zone: null, periods: [period("2026-11-14", "2026-12-28")], bagLimit: "15, no more than 10 white-winged", possessionLimit: "45" }),
  record({ id: "ca-dove-collared", species: "Eurasian collared-dove", seasonName: "Open year-round", zone: null, periods: [period("2026-01-01", "2026-12-31")], bagLimit: "No limit", possessionLimit: "No limit" }),
  record({ id: "ca-quail-archery", species: "Quail", seasonName: "Statewide archery-only", zone: null, periods: [period("2026-08-15", "2026-09-04")], bagLimit: "", possessionLimit: "" }),
  record({ id: "ca-quail-q1-mountain", species: "Mountain quail", seasonName: "Early", zone: "Q1", periods: [period("2026-09-12", "2026-10-16")], bagLimit: "10, any combination of quail species", possessionLimit: "30" }),
  record({ id: "ca-quail-q1", species: "Quail", seasonName: "General", zone: "Q1", periods: [period("2026-10-17", "2027-01-31")], bagLimit: "10, any combination of quail species", possessionLimit: "30" }),
  record({ id: "ca-quail-q2", species: "Quail", seasonName: "General", zone: "Q2", periods: [period("2026-09-26", "2027-01-31")], bagLimit: "10, any combination of quail species", possessionLimit: "30" }),
  record({ id: "ca-quail-q3", species: "Quail", seasonName: "General", zone: "Q3", periods: [period("2026-10-17", "2027-01-31")], bagLimit: "10, any combination of quail species", possessionLimit: "30" }),
  record({ id: "ca-pheasant", species: "Pheasant", seasonName: "General firearm", zone: null, periods: [period("2026-11-14", "2026-12-27")], bagLimit: "2 males per day for the first two days, then 3 males", possessionLimit: "9", notes: "Archive says archery and falconry use separate dates." }),
  record({ id: "ca-chukar", species: "Chukar", seasonName: "General", zone: null, periods: [period("2026-10-17", "2027-01-31")], bagLimit: "6", possessionLimit: "" }),
  record({ id: "ca-snipe", species: "Snipe", seasonName: "General", zone: null, periods: [period("2026-10-17", "2027-01-31")], bagLimit: "8", possessionLimit: "", notes: "Archive says a HIP validation is required." }),
  record({ id: "ca-pigeon", species: "Band-tailed pigeon", seasonName: "North zone", zone: "North", periods: [period("2026-09-19", "2026-09-27")], bagLimit: "2", possessionLimit: "", notes: "Archive says a HIP validation is required." }),
  record({ id: "ca-grouse", species: "Sooty and ruffed grouse", seasonName: "General", zone: null, periods: [period("2026-09-12", "2026-10-12")], bagLimit: "2, all of one species or mixed", possessionLimit: "" }),
  record({ id: "ca-sage-grouse", species: "Sage-grouse", seasonName: "Closed", zone: null, periods: [], bagLimit: "", possessionLimit: "", notes: "Archive says no permits were adopted for 2026-27." }),
  record({ id: "ca-pig", species: "Wild pig", seasonName: "Year-round", zone: null, periods: [], bagLimit: "No bag limit", possessionLimit: "No possession limit", notes: "Archive says there is no closed season, an OTC wild pig tag is required, and both sexes are legal. No open and close dates were stated, so this row has no periods." }),
];
