import ak from "@/data/seasons/ak.json";
import al from "@/data/seasons/al.json";
import ar from "@/data/seasons/ar.json";
import az from "@/data/seasons/az.json";
import ca from "@/data/seasons/ca.json";
import co from "@/data/seasons/co.json";
import ct from "@/data/seasons/ct.json";
import de from "@/data/seasons/de.json";
import fl from "@/data/seasons/fl.json";
import ga from "@/data/seasons/ga.json";
import hi from "@/data/seasons/hi.json";
import ia from "@/data/seasons/ia.json";
import idRecords from "@/data/seasons/id.json";
import il from "@/data/seasons/il.json";
import inRecords from "@/data/seasons/in.json";
import ks from "@/data/seasons/ks.json";
import ky from "@/data/seasons/ky.json";
import la from "@/data/seasons/la.json";
import ma from "@/data/seasons/ma.json";
import md from "@/data/seasons/md.json";
import me from "@/data/seasons/me.json";
import mi from "@/data/seasons/mi.json";
import mo from "@/data/seasons/mo.json";
import ms from "@/data/seasons/ms.json";
import mn from "@/data/seasons/mn.json";
import mt from "@/data/seasons/mt.json";
import nc from "@/data/seasons/nc.json";
import nd from "@/data/seasons/nd.json";
import nh from "@/data/seasons/nh.json";
import nj from "@/data/seasons/nj.json";
import ny from "@/data/seasons/ny.json";
import ne from "@/data/seasons/ne.json";
import nm from "@/data/seasons/nm.json";
import nv from "@/data/seasons/nv.json";
import oh from "@/data/seasons/oh.json";
import ok from "@/data/seasons/ok.json";
import orRecords from "@/data/seasons/or.json";
import ri from "@/data/seasons/ri.json";
import pa from "@/data/seasons/pa.json";
import sc from "@/data/seasons/sc.json";
import sd from "@/data/seasons/sd.json";
import tn from "@/data/seasons/tn.json";
import tx from "@/data/seasons/tx.json";
import ut from "@/data/seasons/ut.json";
import vt from "@/data/seasons/vt.json";
import va from "@/data/seasons/va.json";
import wa from "@/data/seasons/wa.json";
import wv from "@/data/seasons/wv.json";
import wi from "@/data/seasons/wi.json";
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
  ["il.json", il],
  ["in.json", inRecords],
  ["ia.json", ia],
  ["mi.json", mi],
  ["mn.json", mn],
  ["oh.json", oh],
  ["wi.json", wi],
  ["al.json", al],
  ["ar.json", ar],
  ["ky.json", ky],
  ["la.json", la],
  ["ms.json", ms],
  ["mo.json", mo],
  ["tn.json", tn],
  ["fl.json", fl],
  ["ga.json", ga],
  ["nc.json", nc],
  ["sc.json", sc],
  ["de.json", de],
  ["md.json", md],
  ["nj.json", nj],
  ["ny.json", ny],
  ["pa.json", pa],
  ["va.json", va],
  ["wv.json", wv],
  ["ak.json", ak],
  ["hi.json", hi],
  ["ct.json", ct],
  ["me.json", me],
  ["ma.json", ma],
  ["nh.json", nh],
  ["ri.json", ri],
  ["vt.json", vt],
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
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  michigan: "MI",
  minnesota: "MN",
  ohio: "OH",
  wisconsin: "WI",
  alabama: "AL",
  arkansas: "AR",
  kentucky: "KY",
  louisiana: "LA",
  mississippi: "MS",
  missouri: "MO",
  tennessee: "TN",
  florida: "FL",
  georgia: "GA",
  "north-carolina": "NC",
  "south-carolina": "SC",
  delaware: "DE",
  maryland: "MD",
  "new-jersey": "NJ",
  "new-york": "NY",
  pennsylvania: "PA",
  virginia: "VA",
  "west-virginia": "WV",
  alaska: "AK",
  hawaii: "HI",
  connecticut: "CT",
  maine: "ME",
  massachusetts: "MA",
  "new-hampshire": "NH",
  "rhode-island": "RI",
  vermont: "VT",
};
