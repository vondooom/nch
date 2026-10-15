import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { GuideDetail } from "@/components/site/guide-page";
import { findZone } from "@/lib/guides";
import { absoluteUrl, pageMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const zone = findZone((await params).slug);
  if (!zone) return { title: "Zone" };
  return pageMeta({ title: zone.title, description: zone.lede, path: `/zones/${zone.slug}`, image: zone.image });
}

export default async function ZonePage({ params }: { params: Promise<{ slug: string }> }) {
  const zone = findZone((await params).slug);
  if (!zone) notFound();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: zone.title,
          description: zone.lede,
          image: zone.image,
          url: absoluteUrl(`/zones/${zone.slug}`),
        }}
      />
      <GuideDetail current="/zones" backHref="/zones" backLabel="All zones" guide={zone} />
    </>
  );
}
