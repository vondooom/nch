/** Unit or hunt-area tokens, such as 2, 4A, or 12. */
export function unitTokens(zone: string) {
  return (zone.match(/\d+[A-Za-z]*/g) ?? []).map((token) => token.toLowerCase());
}

/**
 * A numeric search matches that unit number exactly.
 * "2" matches "Units 1, 2, 3" and does not match 12 or 20.
 * "4a" matches 4A only.
 */
export function zoneMatchesUnit(zone: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return unitTokens(zone).some((token) => token === q);
}
