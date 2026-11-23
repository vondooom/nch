import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideIndex } from "@/components/site/guide-page";
import { findState, states } from "@/lib/geo/states";
import { species } from "@/lib/guides";
import { pageMeta } from "@/lib/site";

export function generateStaticParams() {
  return states
    .filter((item) => species.some((animal) => animal.state === item.slug))
    .map((item) => ({ state: item.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const item = findState((await params).state);
  if (!item) return { title: "Game" };
  return pageMeta({
    title: `${item.name} game`,
    description: `Game notes for ${item.name}. Seasons on the state hub appear only when we can quote the agency.`,
    path: `/hunt/${item.slug}/species`,
  });
}

export default async function StateSpeciesPage({ params }: { params: Promise<{ state: string }> }) {
  const item = findState((await params).state);
  const guides = item ? species.filter((animal) => animal.state === item.slug) : [];
  if (!item || guides.length === 0) notFound();
  return (
    <GuideIndex
      current={`/hunt/${item.slug}/species`}
      kicker={item.name}
      title={`${item.name} game`}
      lede="Notes on the animals this desk already writes about. Season dates, if we have a quote from the agency, live on the state hub."
      items={guides}
      basePath={`/hunt/${item.slug}/species`}
    />
  );
}
