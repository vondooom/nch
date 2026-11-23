import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { GuideDetail } from "@/components/site/guide-page";
import { findState } from "@/lib/geo/states";
import { findZone, zones } from "@/lib/guides";
import { absoluteUrl, pageMeta } from "@/lib/site";

export function generateStaticParams() {
  return zones.map((zone) => ({ state: zone.state, slug: zone.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; slug: string }>;
}): Promise<Metadata> {
  const { state, slug } = await params;
  const zone = findZone(slug);
  if (!zone || zone.state !== state) return { title: "Zone" };
  return pageMeta({
    title: zone.title,
    description: zone.lede,
    path: `/hunt/${state}/zones/${zone.slug}`,
    image: zone.image,
  });
}

export default async function StateZonePage({ params }: { params: Promise<{ state: string; slug: string }> }) {
  const { state, slug } = await params;
  const item = findState(state);
  const zone = findZone(slug);
  if (!item || !zone || zone.state !== item.slug) notFound();
  const path = `/hunt/${item.slug}/zones/${zone.slug}`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: zone.title,
          description: zone.lede,
          image: zone.image,
          url: absoluteUrl(path),
        }}
      />
      <GuideDetail
        current={`/hunt/${item.slug}/zones`}
        backHref={`/hunt/${item.slug}/zones`}
        backLabel={`${item.name} zones`}
        guide={zone}
      />
    </>
  );
}
