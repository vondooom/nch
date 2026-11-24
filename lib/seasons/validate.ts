import type { SeasonRecord } from "./types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CODES = new Set(["CA", "OR", "WA", "NV", "UT", "AZ", "ID", "MT", "WY", "CO", "NM", "KS", "NE", "ND", "SD", "TX", "OK"]);

export type DroppedSeason = { id: string; file: string; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalText(value: unknown) {
  return value === null || typeof value === "string";
}

/** Keep a row only when it matches the season record shape. Values are not rewritten. */
export function validateSeasonRecord(value: unknown, file: string): { record?: SeasonRecord; dropped?: DroppedSeason } {
  const id = isRecord(value) && typeof value.id === "string" ? value.id : "(missing id)";
  if (!isRecord(value)) return { dropped: { id, file, reason: "Record is not an object." } };

  const reasons: string[] = [];
  if (!text(value.id)) reasons.push("id");
  if (!text(value.state) || !CODES.has(String(value.state))) reasons.push("state");
  if (!text(value.species)) reasons.push("species");
  if (!text(value.seasonName)) reasons.push("seasonName");
  if (value.zone !== null && !text(value.zone)) reasons.push("zone");
  if (!text(value.seasonYear)) reasons.push("seasonYear");
  if (!optionalText(value.bagLimit)) reasons.push("bagLimit");
  if (!optionalText(value.possessionLimit)) reasons.push("possessionLimit");
  if (!text(value.agency)) reasons.push("agency");
  if (!text(value.sourceTitle)) reasons.push("sourceTitle");
  if (!text(value.sourceUrl) || !String(value.sourceUrl).startsWith("https://")) reasons.push("sourceUrl");
  if (!text(value.sourceQuote)) reasons.push("sourceQuote");
  if (!text(value.checkedDate) || !DATE.test(String(value.checkedDate))) reasons.push("checkedDate");
  if (!optionalText(value.notes)) reasons.push("notes");

  if (!Array.isArray(value.periods)) {
    reasons.push("periods");
  } else {
    value.periods.forEach((period, index) => {
      if (!isRecord(period)) {
        reasons.push(`periods[${index}]`);
        return;
      }
      if (!DATE.test(String(period.open))) reasons.push(`periods[${index}].open`);
      if (!DATE.test(String(period.close))) reasons.push(`periods[${index}].close`);
      if (period.note !== null && typeof period.note !== "string") reasons.push(`periods[${index}].note`);
      if (DATE.test(String(period.open)) && DATE.test(String(period.close)) && String(period.open) > String(period.close)) {
        reasons.push(`periods[${index}] open after close`);
      }
    });
  }

  if (reasons.length > 0) return { dropped: { id, file, reason: reasons.join(", ") } };
  return { record: value as SeasonRecord };
}

export function validateSeasonFile(rows: unknown, file: string) {
  const records: SeasonRecord[] = [];
  const dropped: DroppedSeason[] = [];
  if (!Array.isArray(rows)) {
    return { records, dropped: [{ id: "(file)", file, reason: "File is not a list of records." }] };
  }
  const seen = new Set<string>();
  for (const row of rows) {
    const result = validateSeasonRecord(row, file);
    if (result.dropped) {
      dropped.push(result.dropped);
      continue;
    }
    const record = result.record as SeasonRecord;
    if (seen.has(record.id)) {
      dropped.push({ id: record.id, file, reason: "duplicate id" });
      continue;
    }
    seen.add(record.id);
    records.push(record);
  }
  return { records, dropped };
}
