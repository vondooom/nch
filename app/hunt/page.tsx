import type { Metadata } from "next";
import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { regionsWithStates } from "@/lib/geo/states";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Hunt by state",
  description: "All 50 states, grouped by region. Each state hub links to the wildlife agency. Season dates appear only when we can quote that agency.",
  path: "/hunt",
});

export default function HuntPage() {
  const groups = regionsWithStates();
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/hunt" />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          The country
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Hunt by state
        </h1>
        <p className="mb-10 max-w-[680px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          Twelve regions, all 50 states. Open a state for the wildlife agency and its regulations page. Season dates
          show up only after we can quote the agency.
        </p>
        <div className="grid gap-8">
          {groups.map(({ region, states }) => (
            <section key={region.slug}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-[#211D14] pb-2">
                <h2 className="font-heading text-[28px] font-bold uppercase">
                  <Link href={`/regions/${region.slug}`} className="hover:text-[#C75B12]">
                    {region.name}
                  </Link>
                </h2>
                <Link href={`/regions/${region.slug}`} className="font-heading text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C75B12]">
                  Region hub
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {states.map((item) => (
                  <Link key={item.slug} href={`/hunt/${item.slug}`} className="border border-[#D8CDB4] bg-[#FBF8F0] p-4 hover:bg-[#F2ECDB]">
                    <div className="font-heading text-[22px] font-bold uppercase text-[#1C2B1A]">{item.name}</div>
                    <div className="mt-1 font-serif text-[14px] leading-relaxed text-[#5C543F]">{item.agency}</div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
