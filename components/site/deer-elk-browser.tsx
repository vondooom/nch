"use client";

import { useEffect, useMemo, useState } from "react";
import { formatIsoDate, formatPeriod, isOpenNow, type SeasonRecord } from "@/lib/seasons";
import { calendarDateInTimeZone } from "@/lib/seasons/open";
import { validateSeasonFile } from "@/lib/seasons/validate";
import { deerElkPages, type DeerElkState } from "@/lib/seasons/deer-elk-pages";
import { zoneMatchesUnit } from "@/lib/seasons/units";

type SpeciesFilter = "both" | "deer" | "elk";

const loaders: Record<DeerElkState, () => Promise<{ default: unknown }>> = {
  idaho: () => import("@/data/seasons/id-deer-elk.json"),
  wyoming: () => import("@/data/seasons/wy-deer-elk.json"),
  colorado: () => import("@/data/seasons/co-deer-elk.json"),
};

function sourceFragments(quote: string) {
  return quote.includes(" | ") ? quote.split(" | ") : [quote];
}

function firstNumber(zone: string) {
  const match = zone.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function RecordCard({ record, today }: { record: SeasonRecord; today: string }) {
  const open = isOpenNow(record, today);
  return (
    <article className="border border-[#D8CDB4] bg-[#FBF8F0] p-4">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h3 className="font-heading text-[18px] font-bold uppercase text-[#1C2B1A]">{record.seasonName}</h3>
        {open ? (
          <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-[#FFF6E8]">
            Open now
          </span>
        ) : null}
      </div>
      <ul className="grid gap-1 font-serif text-[15px] text-[#3B3526]">
        {(record.periods ?? []).map((period, index) => {
          const line = formatPeriod(period);
          if (!line) return null;
          return <li key={`${record.id}-period-${index}`}>{line}</li>;
        })}
      </ul>
      <details className="mt-3 border-t border-[#E7DFC9] pt-3">
        <summary className="cursor-pointer font-heading text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C75B12]">
          Source text
        </summary>
        <ul className="mt-2 grid gap-2 font-serif text-[14px] leading-relaxed text-[#3B3526]">
          {sourceFragments(record.sourceQuote).map((fragment, index) => (
            <li key={`${record.id}-quote-${index}`}>{fragment}</li>
          ))}
        </ul>
        {record.notes ? (
          <div className="mt-3">
            <div className="font-heading text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8A8163]">Source notes</div>
            <p className="mt-1 font-serif text-[14px] leading-relaxed text-[#5C543F]">{record.notes}</p>
          </div>
        ) : null}
      </details>
      <p className="mt-3 font-serif text-[15px] text-[#3B3526]">
        Per {record.agency}, checked {formatIsoDate(record.checkedDate)}.{" "}
        <a className="text-[#C75B12] underline" href={record.sourceUrl}>
          {record.sourceTitle || "Agency source"}
        </a>
      </p>
    </article>
  );
}

export function DeerElkBrowser({
  state,
  timeZone,
}: {
  state: DeerElkState;
  timeZone: string;
}) {
  const page = deerElkPages[state];
  const [records, setRecords] = useState<SeasonRecord[] | null>(null);
  const [species, setSpecies] = useState<SpeciesFilter>("both");
  const [query, setQuery] = useState("");
  const today = calendarDateInTimeZone(timeZone);

  useEffect(() => {
    let cancel = false;
    loaders[state]().then((mod) => {
      if (cancel) return;
      const loaded = validateSeasonFile(mod.default, `${state}-deer-elk.json`);
      setRecords(loaded.records);
    });
    return () => {
      cancel = true;
    };
  }, [state]);

  const groups = useMemo(() => {
    if (!records) return [];
    const filtered = records.filter((record) => {
      if (species !== "both" && record.species !== species) return false;
      return zoneMatchesUnit(record.zone ?? "", query);
    });
    const byZone = new Map<string, SeasonRecord[]>();
    for (const record of filtered) {
      const zone = record.zone ?? "Statewide";
      const list = byZone.get(zone);
      if (list) list.push(record);
      else byZone.set(zone, [record]);
    }
    return [...byZone.entries()]
      .map(([zone, items]) => ({ zone, items }))
      .sort((a, b) => firstNumber(a.zone) - firstNumber(b.zone) || a.zone.localeCompare(b.zone));
  }, [records, species, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["both", "Deer and elk"],
            ["deer", "Deer"],
            ["elk", "Elk"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={species === value}
            onClick={() => setSpecies(value)}
            className={
              species === value
                ? "bg-[#1C2B1A] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.08em] text-[#F7F2E4]"
                : "border border-[#211D14] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.08em]"
            }
          >
            {label}
          </button>
        ))}
      </div>
      <label className="mb-6 block">
        <span className="mb-1 block font-heading text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8A8163]">
          {page.searchLabel}
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          inputMode="text"
          placeholder={page.searchPlaceholder}
          className="w-full max-w-[280px] border-2 border-[#211D14] bg-[#FFFDF7] px-3 py-2 text-[16px]"
        />
      </label>
      {records === null ? <p className="font-serif text-[16px] text-[#5C543F]">Loading seasons.</p> : null}
      {records && groups.length === 0 ? (
        <p className="font-serif text-[16px] text-[#5C543F]">No unit or hunt area matches that number.</p>
      ) : null}
      {records ? (
        <p className="mb-4 font-serif text-[15px] text-[#5C543F]">
          {records.length} seasons loaded. {groups.length} {page.groupLabel} shown.
        </p>
      ) : null}
      <div className="grid gap-3">
        {groups.map((group) => {
          const anyOpen = group.items.some((record) => isOpenNow(record, today));
          return (
            <Group key={group.zone} zone={group.zone} items={group.items} today={today} anyOpen={anyOpen} />
          );
        })}
      </div>
    </div>
  );
}

function Group({
  zone,
  items,
  today,
  anyOpen,
}: {
  zone: string;
  items: SeasonRecord[];
  today: string;
  anyOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="border border-[#D8CDB4] bg-[#FBF8F0]"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer px-4 py-3 font-heading text-[18px] font-bold uppercase">
        {zone}
        <span className="ml-3 font-serif text-[14px] font-normal normal-case text-[#5C543F]">
          {" "}
          {items.length} {items.length === 1 ? "season" : "seasons"}
          {anyOpen ? " · Open now" : ""}
        </span>
      </summary>
      {open ? (
        <div className="grid gap-3 border-t border-[#E7DFC9] p-4">
          {items.map((record) => (
            <RecordCard key={record.id} record={record} today={today} />
          ))}
        </div>
      ) : null}
    </details>
  );
}
