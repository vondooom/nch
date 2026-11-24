import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeerElkBrowser } from "@/components/site/deer-elk-browser";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { findState } from "@/lib/geo/states";
import { pageMeta } from "@/lib/site";

const pages = {
  idaho: {
    title: "Idaho deer and elk by unit",
    lede: "Deer and elk seasons from the Idaho Department of Fish and Game, one unit or group of units at a time.",
  },
  wyoming: {
    title: "Wyoming deer and elk by hunt area",
    lede: "Deer and elk seasons from the Wyoming Game and Fish Department, one hunt area or group of areas at a time.",
  },
} as const;

export function generateStaticParams() {
  return [{ state: "idaho" }, { state: "wyoming" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const page = pages[state as keyof typeof pages];
  if (!page) return { title: "Deer and elk" };
  return pageMeta({
    title: page.title,
    description: page.lede,
    path: `/hunt/${state}/deer-elk`,
  });
}

export default async function DeerElkPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const page = pages[state as keyof typeof pages];
  const item = page ? findState(state) : undefined;
  if (!page || !item || (state !== "idaho" && state !== "wyoming")) notFound();

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
        <p className="mb-4 font-serif text-[16px] font-medium text-[#1C2B1A]">Confirm with the agency before you hunt.</p>
        {item.regulationsUrl ? (
          <p className="mb-8">
            <a className="font-heading text-[14px] font-semibold uppercase tracking-[0.08em] text-[#C75B12] underline" href={item.regulationsUrl}>
              {item.agency} regulations
            </a>
          </p>
        ) : null}
        <DeerElkBrowser state={state} timeZone={item.timeZone} />
      </section>
      <SiteFooter compact />
    </>
  );
}
