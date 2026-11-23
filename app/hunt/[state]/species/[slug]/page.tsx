import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { GuideDetail } from "@/components/site/guide-page";
import { findState } from "@/lib/geo/states";
import { findSpecies, species } from "@/lib/guides";
import { absoluteUrl, pageMeta } from "@/lib/site";

export function generateStaticParams() {
  return species.map((animal) => ({ state: animal.state, slug: animal.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; slug: string }>;
}): Promise<Metadata> {
  const { state, slug } = await params;
  const animal = findSpecies(slug);
  if (!animal || animal.state !== state) return { title: "Game" };
  return pageMeta({
    title: animal.title,
    description: animal.lede,
    path: `/hunt/${state}/species/${animal.slug}`,
    image: animal.image,
  });
}

export default async function StateSpeciesDetailPage({
  params,
}: {
  params: Promise<{ state: string; slug: string }>;
}) {
  const { state, slug } = await params;
  const item = findState(state);
  const animal = findSpecies(slug);
  if (!item || !animal || animal.state !== item.slug) notFound();
  const path = `/hunt/${item.slug}/species/${animal.slug}`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: animal.title,
          description: animal.lede,
          image: animal.image,
          url: absoluteUrl(path),
        }}
      />
      <GuideDetail
        current={`/hunt/${item.slug}/species`}
        backHref={`/hunt/${item.slug}/species`}
        backLabel={`${item.name} game`}
        guide={animal}
      />
    </>
  );
}
