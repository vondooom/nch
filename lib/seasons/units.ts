/** Unit or hunt-area tokens, such as 2, 4A, or 12. */
export function unitTokens(zone: string) {
  return (zone.match(/\d+[A-Za-z]*/g) ?? []).map((token) => token.toLowerCase());
}

/**
 * A numeric search matches that unit number exactly.
 * "2" matches "Units 1, 2, 3" and does not match 12 or 20.
 * "10" matches "Unit 10" and does not match "Unit 11" or "HD 100".
 * "4a" matches 4A only.
 * A name search matches the unit text, such as "Zion" or "Beaver".
 */
export function zoneMatchesUnit(zone: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (/^\d+[a-z]*$/.test(q)) {
    const gmu = zone.match(/^GMU\s+(\d+[A-Za-z]*)/i);
    if (gmu) return gmu[1].toLowerCase() === q;
    return unitTokens(zone).some((token) => token === q);
  }
  return zone.toLowerCase().includes(q);
}
