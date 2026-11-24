import az from "@/data/seasons/az.json";
import ca from "@/data/seasons/ca.json";
import co from "@/data/seasons/co.json";
import idRecords from "@/data/seasons/id.json";
import ks from "@/data/seasons/ks.json";
import mt from "@/data/seasons/mt.json";
import nd from "@/data/seasons/nd.json";
import ne from "@/data/seasons/ne.json";
import nm from "@/data/seasons/nm.json";
import nv from "@/data/seasons/nv.json";
import ok from "@/data/seasons/ok.json";
import orRecords from "@/data/seasons/or.json";
import sd from "@/data/seasons/sd.json";
import tx from "@/data/seasons/tx.json";
import ut from "@/data/seasons/ut.json";
import wa from "@/data/seasons/wa.json";
import wy from "@/data/seasons/wy.json";
import { validateSeasonFile, type DroppedSeason } from "./validate";
import type { SeasonRecord } from "./types";

const files = [
  ["ca.json", ca],
  ["or.json", orRecords],
  ["wa.json", wa],
  ["nv.json", nv],
  ["ut.json", ut],
  ["az.json", az],
  ["id.json", idRecords],
  ["mt.json", mt],
  ["wy.json", wy],
  ["co.json", co],
  ["nm.json", nm],
  ["ks.json", ks],
  ["ne.json", ne],
  ["nd.json", nd],
  ["sd.json", sd],
  ["tx.json", tx],
  ["ok.json", ok],
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
  idaho: "ID",
  montana: "MT",
  wyoming: "WY",
  colorado: "CO",
  "new-mexico": "NM",
  kansas: "KS",
  nebraska: "NE",
  "north-dakota": "ND",
  "south-dakota": "SD",
  texas: "TX",
  oklahoma: "OK",
};
