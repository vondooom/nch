import type { ReactNode } from "react";
import { formatIsoDate, formatPeriod, isOpenNow, type SeasonRecord } from "@/lib/seasons";
import { calendarDateInTimeZone } from "@/lib/seasons/open";

const speciesLabels: Record<string, string> = {
  snipe: "Wilson's snipe",
  pigeon: "Band-tailed pigeon",
  grouse: "Grouse",
  "sage-grouse": "Greater sage-grouse",
  pig: "Wild pig",
  partridge: "Gray partridge",
  sharptail: "Sharp-tailed grouse",
  "prairie-chicken": "Prairie chicken",
  woodcock: "Woodcock",
  ptarmigan: "Ptarmigan",
  francolin: "Francolin",
};

export type SpeciesNote = { species: string; content: ReactNode };

function speciesHeading(species: string) {
  const key = species.toLowerCase();
  return speciesLabels[key] ?? species.charAt(0).toUpperCase() + species.slice(1);
}

function groupsFor(records: SeasonRecord[]) {
  const groups: { species: string; records: SeasonRecord[] }[] = [];
  for (const record of records) {
    const key = record.species.toLowerCase();
    const existing = groups.find((group) => group.species.toLowerCase() === key);
    if (existing) existing.records.push(record);
    else groups.push({ species: record.species, records: [record] });
  }
  return groups;
}

/**
 * Empty periods are not open windows. The label comes from the agency quote.
 * "Closed on" a forest or refuge is a place rule, not a closed season.
 */
function emptyPeriodLabel(record: SeasonRecord) {
  const fragments = sourceFragments(record.sourceQuote.toLowerCase());
  const seasonClosed = fragments.some((fragment) => fragment.includes("closed") && !/\bclosed on\b/.test(fragment));
  if (seasonClosed) return "Closed for 2026-27";
  if (fragments.some((fragment) => fragment.includes("all year"))) return "Open all year";
  return null;
}

function sourceFragments(quote: string) {
  return quote.includes(" | ") ? quote.split(" | ") : [quote];
}

export function SeasonList({
  records,
  timeZone,
  notes = [],
}: {
  records: SeasonRecord[];
  timeZone: string;
  notes?: SpeciesNote[];
}) {
  const today = calendarDateInTimeZone(timeZone);
  if (records.length === 0) return null;
  return (
    <div className="grid gap-10">
      {groupsFor(records).map((group) => (
        <section key={group.species.toLowerCase()}>
          <h3 className="mb-3 border-b-2 border-[#211D14] pb-2 font-heading text-[26px] font-bold uppercase">
            {speciesHeading(group.species)}
          </h3>
          <div className="grid gap-4">
            {group.records.map((record) => {
              const open = isOpenNow(record, today);
              const closedOrYearRound = record.periods.length === 0 ? emptyPeriodLabel(record) : null;
              return (
                <article key={record.id} className="border border-[#D8CDB4] bg-[#FBF8F0] p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h4 className="font-heading text-[20px] font-bold uppercase text-[#1C2B1A]">
                      {record.seasonName}
                      {record.zone ? ` · ${record.zone}` : ""}
                    </h4>
                    {open ? (
                      <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-[#FFF6E8]">
                        Open now
                      </span>
                    ) : null}
                  </div>
                  <p className="font-serif text-[16px] text-[#3B3526]">{record.seasonYear}</p>
                  {record.periods.length > 0 ? (
                    <ul className="mt-2 grid gap-1 font-serif text-[16px] text-[#3B3526]">
                      {record.periods.map((period, index) => {
                        const line = formatPeriod(period);
                        if (!line) return null;
                        return <li key={`${record.id}-period-${index}`}>{line}</li>;
                      })}
                    </ul>
                  ) : closedOrYearRound ? (
                    <p className="mt-2 font-serif text-[16px] text-[#3B3526]">{closedOrYearRound}</p>
                  ) : null}
                  {record.bagLimit ? <p className="mt-2 font-serif text-[15px] text-[#3B3526]">Daily bag: {record.bagLimit}</p> : null}
                  {record.possessionLimit ? (
                    <p className="font-serif text-[15px] text-[#3B3526]">Possession: {record.possessionLimit}</p>
                  ) : null}
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
                        <div className="font-heading text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8A8163]">
                          Source notes
                        </div>
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
                  <p className="mt-2 text-[14px] font-medium text-[#8A8163]">Confirm with the agency before you hunt.</p>
                </article>
              );
            })}
          </div>
          {notes
            .filter((note) => note.species.toLowerCase() === group.species.toLowerCase())
            .map((note) => (
              <div key={note.species} className="mt-4 font-serif text-[16px] leading-relaxed text-[#3B3526]">
                {note.content}
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
