import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeerElkBrowser } from "@/components/site/deer-elk-browser";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { findState } from "@/lib/geo/states";
import { deerElkPages, type DeerElkState } from "@/lib/seasons/deer-elk-pages";
import { pageMeta } from "@/lib/site";

export function generateStaticParams() {
  return (Object.keys(deerElkPages) as DeerElkState[]).map((state) => ({ state }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const page = deerElkPages[state as DeerElkState];
  if (!page) return { title: "Deer and elk" };
  return pageMeta({
    title: page.title,
    description: page.lede,
    path: `/hunt/${state}/deer-elk`,
  });
}

export default async function DeerElkPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const page = deerElkPages[state as DeerElkState];
  const item = page ? findState(state) : undefined;
  if (!page || !item) notFound();

  return (
    <>
      <SiteBanner />
      <SiteHeader current="/hunt" />
      <section className="mx-auto max-w-[860px] px-6 py-12 pb-20">
        <Link href={`/hunt/${item.slug}`} className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]">
          {item.name}
        </Link>
        <h1 className="mt-4 mb-3 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">{page.title}</h1>
        <p className="mb-3 max-w-[640px] font-serif text-[17px] leading-relaxed text-[#5C543F]">{page.lede}</p>
        {"drawLine" in page ? (
          <p className="mb-3 max-w-[640px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
            {page.drawLine}{" "}
            <a className="text-[#C75B12] underline" href={page.drawHref}>
              {page.drawLabel}
            </a>
          </p>
        ) : null}
        <p className="mb-4 font-serif text-[16px] font-medium text-[#1C2B1A]">Confirm with the agency before you hunt.</p>
        {item.regulationsUrl ? (
          <p className="mb-8">
            <a className="font-heading text-[14px] font-semibold uppercase tracking-[0.08em] text-[#C75B12] underline" href={item.regulationsUrl}>
              {item.agency} regulations
            </a>
          </p>
        ) : null}
        <DeerElkBrowser state={state as DeerElkState} timeZone={item.timeZone} />
      </section>
      <SiteFooter compact />
    </>
  );
}
