import { californiaSeasons } from "./california";
import { calendarDateInTimeZone, isDisplayableSeason, isOpenNow } from "./open";
import type { SeasonRecord } from "./types";

export { OPEN_NOW_MAX_CHECK_AGE_DAYS, calendarDateInTimeZone, formatIsoDate, isDisplayableSeason, isOpenNow } from "./open";
export type { SeasonPeriod, SeasonRecord } from "./types";

export const seasons: SeasonRecord[] = [...californiaSeasons];

export function seasonsForState(state: string) {
  return seasons.filter((record) => record.state === state);
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
