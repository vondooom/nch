import az from "@/data/seasons/az.json";
import ca from "@/data/seasons/ca.json";
import nv from "@/data/seasons/nv.json";
import orRecords from "@/data/seasons/or.json";
import ut from "@/data/seasons/ut.json";
import wa from "@/data/seasons/wa.json";
import { validateSeasonFile, type DroppedSeason } from "./validate";
import type { SeasonRecord } from "./types";

const files = [
  ["ca.json", ca],
  ["or.json", orRecords],
  ["wa.json", wa],
  ["nv.json", nv],
  ["ut.json", ut],
  ["az.json", az],
] as const;

const loaded = files.map(([file, rows]) => validateSeasonFile(rows, file));

export const sourcedSeasons: SeasonRecord[] = loaded.flatMap((file) => file.records);
export const droppedSeasons: DroppedSeason[] = loaded.flatMap((file) => file.dropped);

/** Postal codes as published in the season files. Hubs match these without rewriting the rows. */
export const seasonStateCode: Record<string, string> = {
  california: "CA",
  oregon: "OR",
  washington: "WA",
  nevada: "NV",
  utah: "UT",
  arizona: "AZ",
};
