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
//   - wildlife.ca.gov and nrm.dfg.ca.gov did not resolve from the build box, so
//     state areas link to their CDFW Places-to-Visit page (where CDFW lists the
//     hunt maps) rather than a FileHandler PDF we couldn't open. Chris supplied
//     Gray Lodge DocumentID 87799 and Llano Seco 87833 — re-check and wire them
//     as `pdf` once they can be opened.

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

const FWS_PDF = (file: string, label: string): RefugeMap => ({ url: fws(file), kind: "pdf", label, verified: true });
const CDFW_PAGE = (slug: string, label = "CDFW area page · hunt maps"): RefugeMap => ({ url: cdfw(slug), kind: "page", label, verified: false });

export const REFUGE_MAPS: Record<string, RefugeMap> = {
  // USFWS · Sacramento NWR Complex Maps page: "Hunt Area Map - …"
  "sac-nwr": FWS_PDF("Sacramento NWR Hunt Area_1.pdf", "USFWS hunt area map (PDF)"),
  "delevan-nwr": FWS_PDF("Delevan NWR Hunt Area_0.pdf", "USFWS hunt area map (PDF)"),
  "colusa-nwr": FWS_PDF("Colusa NWR Hunt Area_0.pdf", "USFWS hunt area map (PDF)"),
  // USFWS · San Luis Complex hunt program (unit hunt maps + flood-up maps).
  "san-luis-nwr": {
    url: "https://www.fws.gov/locations/san-luis-national-wildlife-refuge-complex/san-luis-complex-hunt-program",
    kind: "page",
    label: "USFWS hunt program · unit hunt maps",
    verified: true,
  },
  // CDFW · Places-to-Visit pages (not reachable from the build box).
  "gray-lodge": CDFW_PAGE("Gray-Lodge-WA"),
  "howard-slough": CDFW_PAGE("Upper-Butte-Basin-WA", "CDFW Upper Butte Basin page · Howard Slough map"),
  "little-dry-creek": CDFW_PAGE("Upper-Butte-Basin-WA", "CDFW Upper Butte Basin page · Little Dry Creek map"),
  "llano-seco": CDFW_PAGE("Upper-Butte-Basin-WA", "CDFW Upper Butte Basin page · Llano Seco map"),
  "yolo-bypass": CDFW_PAGE("Yolo-Bypass-WA"),
  "grizzly-island": CDFW_PAGE("Grizzly-Island-WA"),
  "north-grasslands": CDFW_PAGE("North-Grasslands-WA"),
  "los-banos": CDFW_PAGE("Los-Banos-WA"),
  volta: CDFW_PAGE("Volta-WA"),
  mendota: CDFW_PAGE("Mendota-WA"),
  "ash-creek": CDFW_PAGE("Ash-Creek-WA"),
  "honey-lake": CDFW_PAGE("Honey-Lake-WA"),
};

export function mapFor(r: Refuge): RefugeMap | null {
  return REFUGE_MAPS[r.id] ?? (r.url ? { url: r.url, kind: "page", label: `${r.agency} area page`, verified: false } : null);
}

/** Pins we can honestly plot: just the sourced HQ / check-station point. */
export type Landmark = { id: string; label: string; at: { lat: number; lon: number } };
export function landmarksFor(r: Refuge): Landmark[] {
  return [{ id: `${r.id}-hq`, label: "HQ / check station", at: r.coords }];
}
