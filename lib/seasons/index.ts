import { californiaSeasons } from "./california";
import { calendarDateInTimeZone, isDisplayableSeason, isOpenNow } from "./open";
import { seasonStateCode, sourcedSeasons } from "./sourced";
import type { SeasonRecord } from "./types";

export { OPEN_NOW_MAX_CHECK_AGE_DAYS, calendarDateInTimeZone, formatIsoDate, isDisplayableSeason, isOpenNow } from "./open";
export { droppedSeasons } from "./sourced";
export type { SeasonPeriod, SeasonRecord } from "./types";

/**
 * Archive rows the 2026-11-23 California file already covers.
 * The sourced row is the one that can be shown. These stay in california.ts and are not listed twice.
 * C-zone archery, X zones, scaup, collared-dove, statewide quail archery, snipe, pigeon, grouse, sage-grouse, and wild pig are not in that file, so they stay.
 */
const coveredBySourcedFile = new Set([
  "ca-deer-a-archery",
  "ca-deer-a-general",
  "ca-deer-b-group-archery",
  "ca-deer-b-group-general",
  "ca-deer-b4-archery",
  "ca-deer-b4-general",
  "ca-deer-c1-general",
  "ca-deer-c2-c3-general",
  "ca-deer-c4-general",
  "ca-deer-d-archery",
  "ca-deer-d-general",
  "ca-duck-bos",
  "ca-duck-ne",
  "ca-goose-bos-early-canada",
  "ca-goose-bos",
  "ca-goose-bos-late-canada",
  "ca-goose-bos-late-white",
  "ca-goose-ne-canada",
  "ca-goose-ne-white",
  "ca-goose-ne-late-white",
  "ca-dove-early",
  "ca-dove-late",
  "ca-quail-q1-mountain",
  "ca-quail-q1",
  "ca-quail-q2",
  "ca-quail-q3",
  "ca-pheasant",
  "ca-chukar",
  "ca-turkey-fall",
  "ca-turkey-spring",
  "ca-turkey-spring-archery",
  "ca-turkey-junior",
  "ca-turkey-junior-extension",
]);

const keptArchiveSeasons = californiaSeasons.filter((record) => !coveredBySourcedFile.has(record.id));

export const seasons: SeasonRecord[] = [...sourcedSeasons, ...keptArchiveSeasons];

export function seasonsForState(state: string) {
  const code = seasonStateCode[state];
  return seasons.filter((record) => record.state === state || record.state === code);
}

export function visibleSeasonsForState(state: string) {
  return seasonsForState(state).filter(isDisplayableSeason);
}

export function stateHasVisibleSeasons(state: string) {
  return visibleSeasonsForState(state).length > 0;
}

export function openNowForState(state: string, timeZone: string, now = new Date()) {
  const today = calendarDateInTimeZone(timeZone, now);
  return visibleSeasonsForState(state).filter((record) => isOpenNow(record, today));
}
