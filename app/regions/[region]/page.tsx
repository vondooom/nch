import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { findRegion, regions } from "@/lib/geo/regions";
import { statesInRegion } from "@/lib/geo/states";
import { pageMeta } from "@/lib/site";
import { stateHasVisibleSeasons } from "@/lib/seasons";

export function generateStaticParams() {
  return regions.map((region) => ({ region: region.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const region = findRegion((await params).region);
  if (!region) return { title: "Region" };
  return pageMeta({
    title: region.name,
    description: `${region.name}. ${region.summary} State hubs link to each wildlife agency.`,
    path: `/regions/${region.slug}`,
  });
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const region = findRegion((await params).region);
  if (!region) notFound();
  const members = statesInRegion(region.slug);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/hunt" />
      <section className="mx-auto max-w-[860px] px-6 py-12 pb-20">
        <Link href="/hunt" className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]">
          All states
        </Link>
        <div className="mt-4 mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Region
        </div>
        <h1 className="mb-3 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">{region.name}</h1>
        <p className="mb-8 font-serif text-[18px] leading-relaxed text-[#5C543F]">{region.summary}</p>
        <div className="grid gap-3">
          {members.map((item) => (
            <Link key={item.slug} href={`/hunt/${item.slug}`} className="block border border-[#D8CDB4] bg-[#FBF8F0] p-5 hover:bg-[#F2ECDB]">
              <div className="font-heading text-[24px] font-bold uppercase">{item.name}</div>
              <div className="mt-1 font-serif text-[15px] text-[#5C543F]">{item.agency}</div>
              <div className="mt-2 font-serif text-[14px] text-[#8A8163]">
                {stateHasVisibleSeasons(item.slug) ? "Season dates are posted." : "Season dates are coming."}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
