import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RichBody } from "@/components/site/rich-body";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { getStore, published } from "@/lib/store";

function findLocal(slug: string) {
  return published(getStore().locals).find((item) => item.slug === slug || item.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const listing = findLocal((await params).slug);
  if (!listing) return { title: "Local Boys" };
  return pageMeta({
    title: listing.name,
    description: listing.desc,
    path: `/local-boys/${listing.slug}`,
    image: listing.image,
  });
}

export default async function LocalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const listing = findLocal((await params).slug);
  if (!listing) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: listing.name,
          description: listing.desc,
          image: listing.image,
          areaServed: listing.where,
          url: absoluteUrl(`/local-boys/${listing.slug}`),
        }}
      />
      <SiteBanner />
      <SiteHeader current="/local-boys" />
      <article className="mx-auto max-w-[780px] px-6 py-10 pb-20">
        <Link
          href="/local-boys"
          className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]"
        >
          ← All Local Boys
        </Link>
        {listing.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.image} alt={listing.name} className="mt-6 mb-8 aspect-[16/9] w-full border border-[#D8CDB4] object-cover" />
        ) : null}
        <div className="mb-2 font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#C75B12]">
          {listing.group}
          {listing.featured ? " · Featured" : ""}
        </div>
        <h1 className="mb-2 font-heading text-[clamp(34px,4.6vw,54px)] font-bold uppercase leading-tight">
          {listing.name}
        </h1>
        <p className="mb-6 text-[13px] font-medium uppercase tracking-[0.08em] text-[#8A8163]">{listing.where}</p>
        <p className="mb-6 font-serif text-[19px] leading-relaxed text-[#5C543F]">{listing.desc}</p>
        {listing.body ? <RichBody body={listing.body} /> : null}
      </article>
      <SiteFooter compact />
    </>
  );
}
