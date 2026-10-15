import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { GuideDetail } from "@/components/site/guide-page";
import { findSpecies } from "@/lib/guides";
import { absoluteUrl, pageMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const animal = findSpecies((await params).slug);
  if (!animal) return { title: "Species" };
  return pageMeta({
    title: animal.title,
    description: animal.lede,
    path: `/species/${animal.slug}`,
    image: animal.image,
  });
}

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const animal = findSpecies((await params).slug);
  if (!animal) notFound();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: animal.title,
          description: animal.lede,
          image: animal.image,
          url: absoluteUrl(`/species/${animal.slug}`),
        }}
      />
      <GuideDetail current="/species" backHref="/species" backLabel="All species" guide={animal} />
    </>
  );
}
