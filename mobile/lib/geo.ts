// Small geodesy kit for walking a marsh in the dark: distance, bearing,
// cardinal labels, and a local flat projection for the tactical map.

export type LatLon = { lat: number; lon: number };

const R = 6371008.8; // mean Earth radius, meters
const rad = Math.PI / 180;

// Magnetic declination across the Sacramento & San Joaquin valleys is ~12–13.5°
// east for 2026 (NOAA WMM). A linear fit on latitude is well inside a compass
// needle's error across our ten refuges.
export function declinationAt(lat: number): number {
  return 12.3 + (lat - 37.1) * 0.43;
}

export function distanceMeters(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Initial true bearing a → b, 0–360°. */
export function bearingTrue(a: LatLon, b: LatLon): number {
  const φ1 = a.lat * rad;
  const φ2 = b.lat * rad;
  const Δλ = (b.lon - a.lon) * rad;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return norm360(Math.atan2(y, x) / rad);
}

/** Bearing as a hand compass would read it (true minus east declination). */
export function bearingMagnetic(a: LatLon, b: LatLon): number {
  return norm360(bearingTrue(a, b) - declinationAt(a.lat));
}

/** Point `meters` away from `p` on true bearing `deg`. */
export function destination(p: LatLon, deg: number, meters: number): LatLon {
  const δ = meters / R;
  const θ = deg * rad;
  const φ1 = p.lat * rad;
  const λ1 = p.lon * rad;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: φ2 / rad, lon: λ2 / rad };
}

export function norm360(d: number): number {
  return ((d % 360) + 360) % 360;
}

/** Signed smallest angle from a to b, -180..180. */
export function angleDiff(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}

const CARD16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const CARD8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function cardinal(deg: number, points: 8 | 16 = 8): string {
  const list = points === 16 ? CARD16 : CARD8;
  return list[Math.round(norm360(deg) / (360 / list.length)) % list.length];
}

export const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
export function arrowFor(deg: number): string {
  return ARROWS[Math.round(norm360(deg) / 45) % 8];
}

export const metersToYards = (m: number) => m * 1.0936133;
export const metersToMiles = (m: number) => m / 1609.344;
export const mpsToMph = (v: number) => v * 2.2369363;

/** "84 yds" under a quarter mile, "0.62 mi" beyond — how hunters talk distance. */
export function formatDistance(m: number): string {
  if (!Number.isFinite(m)) return "—";
  const yds = metersToYards(m);
  if (yds < 440) return `${Math.round(yds)} yds`;
  return `${metersToMiles(m).toFixed(2)} mi`;
}

export function pathLength(points: LatLon[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceMeters(points[i - 1], points[i]);
  return total;
}

/** Equirectangular projection around `origin`, meters east/north. */
export function toLocalMeters(origin: LatLon, p: LatLon): { x: number; y: number } {
  return {
    x: (p.lon - origin.lon) * rad * R * Math.cos(origin.lat * rad),
    y: (p.lat - origin.lat) * rad * R,
  };
}

export function fromLocalMeters(origin: LatLon, x: number, y: number): LatLon {
  return {
    lat: origin.lat + y / (R * rad),
    lon: origin.lon + x / (R * rad * Math.cos(origin.lat * rad)),
  };
}

export function formatCoord(v: number, pos: string, neg: string): string {
  return `${Math.abs(v).toFixed(6)}° ${v >= 0 ? pos : neg}`;
}
