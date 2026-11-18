import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { deskDisclaimer } from "@/lib/guides";
import { conditionSources } from "@/lib/condition-sources";

export const metadata = { title: "Conditions" };

export default function ConditionsPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/conditions" />
      <section className="bg-[#1C2B1A] text-[#D9D2BA]">
        <div className="mx-auto max-w-[1180px] px-6 py-10">
          <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#E8A05C]">
            Conditions dashboard
          </div>
          <h1 className="font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase text-[#F7F2E4]">
            Hunt-day conditions
          </h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1180px] gap-4 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {conditionSources.map((c) => (
          <div key={c.id} className="border-2 border-[#211D14] bg-[#FBF8F0] p-5">
            <div className="mb-2 font-heading text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8A8163]">
              {c.label}
            </div>
            <div className="font-heading text-[26px] font-bold uppercase text-[#1C2B1A]">{c.value}</div>
            <p className="mt-3 font-serif text-[15px] leading-relaxed text-[#3B3526]">{c.detail}</p>
            <a href={c.href} className="mt-4 inline-block text-sm text-[#C75B12] underline">{c.source} →</a>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-[780px] px-6 pb-20 font-serif text-[17px] leading-relaxed text-[#3B3526]">
        <p>
          We do not currently have verified, date- and location-specific conditions to display. Use the official sources
          above for your hunt date and location. Always confirm fire closures, refuge draws, and legal shoot times
          with CDFW and the refuge you&apos;re hunting.
        </p>
        <p className="mt-4">{deskDisclaimer}</p>
        <Link href="/checklist" className="mt-6 inline-block font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
          Driveway checklist →
        </Link>
      </section>
      <SiteFooter compact />
    </>
  );
}
