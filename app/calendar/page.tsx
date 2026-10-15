import type { Metadata } from "next";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { JsonLd } from "@/components/site/json-ld";
import { calendar, deskDisclaimer } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Season calendar",
  description: "A twelve-month read of the NorCal hunting year, from license day in July through turkey and pigs.",
};

export default function CalendarPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "NorCal hunting year",
          itemListElement: calendar.map((month, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${month.month}: ${month.focus}`,
          })),
        }}
      />
      <SiteBanner />
      <SiteHeader current="/calendar" />
      <section className="mx-auto max-w-[860px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          The year
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          A hunting calendar for NorCal
        </h1>
        <p className="mb-10 max-w-[640px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          What the desk is thinking about each month. Open dates still live on the Board and at CDFW — this is the rhythm,
          not the regulation.
        </p>
        <div className="grid gap-4">
          {calendar.map((month) => (
            <article key={month.month} className="border border-[#D8CDB4] bg-[#FBF8F0] p-6">
              <div className="mb-1 font-heading text-[13px] font-bold uppercase tracking-[0.14em] text-[#C75B12]">
                {month.month}
              </div>
              <h2 className="mb-3 font-heading text-[26px] font-bold uppercase">{month.focus}</h2>
              <ul className="grid list-disc gap-2 pl-5 font-serif text-[16px] leading-relaxed text-[#3B3526]">
                {month.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 font-serif text-[14px] leading-relaxed text-[#8A8163]">{deskDisclaimer}</p>
      </section>
      <SiteFooter compact />
    </>
  );
}
