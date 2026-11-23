import { formatIsoDate, isOpenNow, type SeasonRecord } from "@/lib/seasons";
import { calendarDateInTimeZone } from "@/lib/seasons/open";

export function SeasonList({ records, timeZone }: { records: SeasonRecord[]; timeZone: string }) {
  const today = calendarDateInTimeZone(timeZone);
  if (records.length === 0) return null;
  return (
    <div className="grid gap-4">
      {records.map((record) => {
        const open = isOpenNow(record, today);
        return (
          <article key={record.id} className="border border-[#D8CDB4] bg-[#FBF8F0] p-5">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h3 className="font-heading text-[22px] font-bold uppercase text-[#1C2B1A]">
                {record.species}
                {record.zone ? ` · ${record.zone}` : ""}
              </h3>
              {open ? (
                <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-[#FFF6E8]">
                  Open now
                </span>
              ) : null}
            </div>
            <p className="font-serif text-[16px] text-[#3B3526]">
              {record.seasonName}, {record.seasonYear}
            </p>
            <ul className="mt-2 grid gap-1 font-serif text-[16px] text-[#3B3526]">
              {record.periods.map((period) => (
                <li key={`${period.open}-${period.close}`}>
                  {formatIsoDate(period.open)} to {formatIsoDate(period.close)}
                  {period.note ? ` (${period.note})` : ""}
                </li>
              ))}
            </ul>
            {record.bagLimit ? <p className="mt-2 font-serif text-[15px] text-[#3B3526]">Daily bag: {record.bagLimit}</p> : null}
            {record.possessionLimit ? (
              <p className="font-serif text-[15px] text-[#3B3526]">Possession: {record.possessionLimit}</p>
            ) : null}
            {record.notes ? <p className="mt-2 font-serif text-[15px] leading-relaxed text-[#5C543F]">{record.notes}</p> : null}
            <blockquote className="mt-3 border-l-4 border-[#C75B12] pl-3 font-serif text-[15px] leading-relaxed text-[#3B3526]">
              &ldquo;{record.sourceQuote}&rdquo;
            </blockquote>
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
  );
}
