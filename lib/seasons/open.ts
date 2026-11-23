import type { SeasonRecord } from "./types";

/**
 * An "Open now" badge is allowed only when checkedDate is this many days old or newer.
 * Change this one number to tighten or loosen the badge.
 */
export const OPEN_NOW_MAX_CHECK_AGE_DAYS = 30;

export function isDisplayableSeason(record: SeasonRecord) {
  return Boolean(record.sourceUrl.trim() && record.sourceQuote.trim() && record.checkedDate.trim());
}

export function calendarDateInTimeZone(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Whole calendar days from earlier to later. Negative when later is before earlier. */
export function calendarDaysBetween(earlier: string, later: string) {
  const [ey, em, ed] = earlier.split("-").map(Number);
  const [ly, lm, ld] = later.split("-").map(Number);
  const start = Date.UTC(ey, em - 1, ed);
  const end = Date.UTC(ly, lm - 1, ld);
  return Math.round((end - start) / 86_400_000);
}

export function periodContains(open: string, close: string, day: string) {
  return open <= day && day <= close;
}

/**
 * True only when the record may be shown, today falls inside a period,
 * and the agency quote was checked within OPEN_NOW_MAX_CHECK_AGE_DAYS.
 */
export function isOpenNow(record: SeasonRecord, today: string) {
  if (!isDisplayableSeason(record)) return false;
  const age = calendarDaysBetween(record.checkedDate, today);
  if (age < 0 || age > OPEN_NOW_MAX_CHECK_AGE_DAYS) return false;
  return record.periods.some((period) => periodContains(period.open, period.close, today));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
