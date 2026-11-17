import type { Issue } from "./types";

const LA = "America/Los_Angeles";
const PUBLISH_HOUR = 7;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const briefingWhen = "every Sunday at 7am";

export function parseArchiveDate(value: string): string | null {
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTHS.findIndex((name) => name.toLowerCase() === match[1].slice(0, 3).toLowerCase());
  if (month < 0) return null;
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (day < 1 || day > 31) return null;
  return ymd(year, month + 1, day);
}

export function formatArchiveDate(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekdayOfKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addDays(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return ymd(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

function laNow(now: Date) {
  const bag: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: LA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now)) {
    bag[part.type] = part.value;
  }
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(bag.weekday.slice(0, 3));
  return {
    key: ymd(Number(bag.year), Number(bag.month), Number(bag.day)),
    hour: Number(bag.hour),
    weekday,
  };
}

/** Latest Sunday whose 7am Pacific publish time has already passed. */
export function latestDueSunday(now = new Date()): string {
  const la = laNow(now);
  let cursor = addDays(la.key, -la.weekday);
  if (la.weekday === 0 && la.hour < PUBLISH_HOUR) cursor = addDays(cursor, -7);
  return cursor;
}

function sundayKeys(start: string, end: string) {
  const keys: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    keys.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return keys;
}

export type IssueSlot = {
  dateKey: string;
  date: string;
  number: number;
  issueId?: string;
  status?: Issue["status"];
};

/**
 * Sunday issues that should be on the site by `now`, based on the archive's own dates.
 * The run starts at the earliest published Sunday issue. Later Sundays with no copy are gaps.
 */
export function missingIssueSlots(issues: Issue[], now = new Date(), includeDrafts = false): IssueSlot[] {
  const publishedKeys: string[] = [];
  for (const issue of issues) {
    if (issue.status !== "published") continue;
    const key = parseArchiveDate(issue.date);
    if (key && weekdayOfKey(key) === 0) publishedKeys.push(key);
  }
  if (publishedKeys.length === 0) return [];
  const start = publishedKeys.reduce((earliest, key) => (key < earliest ? key : earliest));
  const due = latestDueSunday(now);
  if (due < start) return [];

  const taken = new Set(issues.map((issue) => issue.number));
  let nextNumber = issues.reduce((max, issue) => Math.max(max, issue.number || 0), 0) + 1;
  const slots: IssueSlot[] = [];
  for (const dateKey of sundayKeys(start, due)) {
    const matches = issues.filter((issue) => parseArchiveDate(issue.date) === dateKey);
    const published = matches.find((issue) => issue.status === "published");
    if (published) continue;
    const draft = matches.find((issue) => issue.status === "draft");
    if (draft && includeDrafts) {
      slots.push({
        dateKey,
        date: formatArchiveDate(dateKey),
        number: draft.number,
        issueId: draft.id,
        status: "draft",
      });
      continue;
    }
    if (draft && !includeDrafts) {
      slots.push({
        dateKey,
        date: formatArchiveDate(dateKey),
        number: draft.number,
        status: "draft",
      });
      continue;
    }
    while (taken.has(nextNumber)) nextNumber += 1;
    const number = nextNumber;
    taken.add(number);
    nextNumber += 1;
    slots.push({ dateKey, date: formatArchiveDate(dateKey), number });
  }
  return slots;
}
