import { Refuge } from "./refuges";

// Official hunt maps per area — links only, no invented geometry.
//
// The tactical map used to draw seeded-random "ponds" and parking lots. That
// looked like a map but wasn't one, so it's gone. What we plot now:
//   - the HQ / check-station pin already in REFUGES (sourced there), and
//   - the hunter's own GPS trail and waypoints.
// Neither CDFW nor USFWS publishes blind / parking coordinates we could find
// in a plottable form (no GeoJSON / GIS links on the USFWS hunt pages; the
// Sacramento NWR complex hunt page says flood-up and aerial maps are posted at
// the check stations). Until that exists, every area shows MAP_COMING and an
// "Official map" button.
//
// Verification (Nov 11, 2026):
//   - USFWS PDFs below were fetched and returned application/pdf, linked from
//     the Sacramento NWR Complex "Maps" page and San Luis Complex hunt page.
//   - CDFW FileHandler PDFs: nrm.dfg.ca.gov doesn't resolve from the build box,
//     so Chris opened each DocumentID from another network, confirmed the PDF
//     title, and confirmed the area's Places-to-Visit page links to it. Titles
//     are recorded next to each entry. No DocumentIDs were guessed — Honey Lake
//     Fleming Unit's ID is unconfirmed, so that area keeps its CDFW page link.
//   - Ash Creek's "Printable Map" (87736) is a regional locator, not a hunt
//     map, so Ash Creek stays on its area page.

export type RefugeMap = {
  /** What the button opens. */
  url: string;
  /** "pdf" = the hunt map itself; "page" = agency page listing the hunt maps. */
  kind: "pdf" | "page";
  label: string;
  /** True only when someone opened this URL and saw it resolve. */
  verified: boolean;
};

export const MAP_COMING =
  "Map coming — CDFW/USFWS hasn't published plottable blind coordinates we can use. Use the official hunt map.";

const fws = (file: string) => `https://www.fws.gov/sites/default/files/documents/${encodeURIComponent(file)}`;
const cdfw = (slug: string) => `https://wildlife.ca.gov/Lands/Places-to-Visit/${slug}`;
const nrm = (documentId: number) => `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=${documentId}&inline=`;

const FWS_PDF = (file: string, label: string): RefugeMap => ({ url: fws(file), kind: "pdf", label, verified: true });
const CDFW_PDF = (documentId: number, label: string): RefugeMap => ({ url: nrm(documentId), kind: "pdf", label, verified: true });
const CDFW_PAGE = (slug: string, label = "CDFW area page · hunt maps", verified = false): RefugeMap => ({
  url: cdfw(slug),
  kind: "page",
  label,
  verified,
});

/** Official map links per area, primary first. */
export const REFUGE_MAPS: Record<string, RefugeMap[]> = {
  // USFWS · Sacramento NWR Complex Maps page: "Hunt Area Map - …"
  "sac-nwr": [FWS_PDF("Sacramento NWR Hunt Area_1.pdf", "USFWS hunt area map (PDF)")],
  "delevan-nwr": [FWS_PDF("Delevan NWR Hunt Area_0.pdf", "USFWS hunt area map (PDF)")],
  "colusa-nwr": [FWS_PDF("Colusa NWR Hunt Area_0.pdf", "USFWS hunt area map (PDF)")],
  // USFWS · San Luis Complex hunt program (unit hunt maps + flood-up maps).
  "san-luis-nwr": [
    {
      url: "https://www.fws.gov/locations/san-luis-national-wildlife-refuge-complex/san-luis-complex-hunt-program",
      kind: "page",
      label: "USFWS hunt program · unit hunt maps",
      verified: true,
    },
  ],

  // CDFW · FileHandler PDFs (titles confirmed Nov 11, 2026).
  // "Gray Lodge Wildlife Area Waterfowl Hunting Map" (GLWA 2026)
  "gray-lodge": [CDFW_PDF(87799, "CDFW waterfowl hunting map (PDF)")],
  // Upper Butte Basin WA page — "WATERFOWL HUNTING MAP - <UNIT> UNIT"
  "howard-slough": [CDFW_PDF(87821, "CDFW Howard Slough Unit waterfowl hunting map (PDF)")],
  "little-dry-creek": [CDFW_PDF(87832, "CDFW Little Dry Creek Unit waterfowl hunting map (PDF)")],
  "llano-seco": [CDFW_PDF(87833, "CDFW Llano Seco Unit waterfowl hunting map (PDF)")],
  // "Yolo Bypass Wildlife Area / Waterfowl and Upland Game Hunting Map / 2026"
  "yolo-bypass": [
    CDFW_PDF(110222, "CDFW waterfowl & upland hunting map 2026 (PDF)"),
    CDFW_PDF(91580, "CDFW assigned blinds map (PDF)"),
    CDFW_PDF(91579, "CDFW disabled-access blinds map (PDF)"),
  ],
  // "Volta Wildlife Area Waterfowl Hunt Map"
  volta: [CDFW_PDF(87913, "CDFW waterfowl hunt map (PDF)")],
  // "Waterfowl Hunt Area Map" — hunt zones, assigned ponds, Zone 6, parking, closed zones
  "los-banos": [CDFW_PDF(184517, "CDFW waterfowl hunt area map (PDF)")],
  // "Mendota Wildlife Area" general hunt map (Dec 2022) — not titled as a waterfowl map
  mendota: [CDFW_PDF(87839, "CDFW general hunt map (PDF)")],
  // "Grizzly Island Wildlife Area Waterfowl Season Map" (rev. 05/2026)
  "grizzly-island": [CDFW_PDF(245149, "CDFW Grizzly Island Unit waterfowl map (PDF)")],
  // North Grasslands WA — one waterfowl hunt map per unit.
  "north-grasslands": [
    CDFW_PDF(247888, "CDFW Salt Slough Unit waterfowl hunt map (PDF)"),
    CDFW_PDF(247885, "CDFW China Island Unit waterfowl hunt map (PDF)"),
    CDFW_PDF(247886, "CDFW Gadwall Unit waterfowl hunt map (PDF)"),
  ],
  // Dakin Unit PDF confirmed; Fleming Unit DocumentID not confirmed → area page.
  "honey-lake": [
    CDFW_PDF(87812, "CDFW Dakin Unit hunt map (PDF)"),
    CDFW_PAGE("Honey-Lake-WA", "CDFW area page · Fleming Unit hunt map"),
  ],
  // No hunt-map PDF confirmed (87736 is a regional locator map).
  "ash-creek": [CDFW_PAGE("Ash-Creek-WA")],
};

/** All official map links for an area, primary first. */
export function mapsFor(r: Refuge): RefugeMap[] {
  const maps = REFUGE_MAPS[r.id];
  if (maps?.length) return maps;
  return r.url ? [{ url: r.url, kind: "page", label: `${r.agency} area page`, verified: false }] : [];
}

/** Primary official map link for an area. */
export function mapFor(r: Refuge): RefugeMap | null {
  return mapsFor(r)[0] ?? null;
}

/** Pins we can honestly plot: just the sourced HQ / check-station point. */
export type Landmark = { id: string; label: string; at: { lat: number; lon: number } };
export function landmarksFor(r: Refuge): Landmark[] {
  return [{ id: `${r.id}-hq`, label: "HQ / check station", at: r.coords }];
}
