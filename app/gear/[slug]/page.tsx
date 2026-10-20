import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RichBody } from "@/components/site/rich-body";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { getStore, published } from "@/lib/store";

function findGear(slug: string) {
  return published(getStore().gear).find((item) => item.slug === slug || item.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = findGear((await params).slug);
  if (!item) return { title: "Gear" };
  return pageMeta({
    title: item.name,
    description: item.why,
    path: `/gear/${item.slug}`,
    image: item.image,
  });
}

export default async function GearDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const item = findGear((await params).slug);
  if (!item) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Review",
          itemReviewed: { "@type": "Product", name: item.name, category: item.category, image: item.image },
          reviewBody: item.why,
          author: { "@type": "Organization", name: "NorCalHunt" },
          url: absoluteUrl(`/gear/${item.slug}`),
        }}
      />
      <SiteBanner />
      <SiteHeader current="/gear" />
      <article className="mx-auto max-w-[780px] px-6 py-10 pb-20">
        <Link href="/gear" className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]">
          ← All gear
        </Link>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="mt-6 mb-8 aspect-[16/9] w-full border border-[#D8CDB4] object-cover" />
        ) : null}
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#FFF6E8]">
            {item.category}
          </span>
          <span className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#C75B12]">{item.badge}</span>
        </div>
        <h1 className="mb-3 font-heading text-[clamp(34px,4.6vw,54px)] font-bold uppercase leading-tight">{item.name}</h1>
        {item.price ? <p className="mb-2 font-heading text-[22px] font-bold text-[#C75B12]">{item.price}</p> : null}
        <p className="mb-8 text-[13px] uppercase tracking-[0.08em] text-[#8A8163]">{item.issue}</p>
        <RichBody body={item.body} />
      </article>
      <SiteFooter compact />
    </>
  );
}
