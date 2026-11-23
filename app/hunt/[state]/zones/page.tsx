import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideIndex } from "@/components/site/guide-page";
import { findState, states } from "@/lib/geo/states";
import { zones } from "@/lib/guides";
import { pageMeta } from "@/lib/site";

export function generateStaticParams() {
  return states
    .filter((item) => zones.some((zone) => zone.state === item.slug))
    .map((item) => ({ state: item.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const item = findState((await params).state);
  if (!item) return { title: "Zones" };
  return pageMeta({
    title: `${item.name} hunt zones`,
    description: `Zone guides for ${item.name}. How the ground feels, and what to confirm with the agency before you go.`,
    path: `/hunt/${item.slug}/zones`,
  });
}

export default async function StateZonesPage({ params }: { params: Promise<{ state: string }> }) {
  const item = findState((await params).state);
  const guides = item ? zones.filter((zone) => zone.state === item.slug) : [];
  if (!item || guides.length === 0) notFound();
  return (
    <GuideIndex
      current={`/hunt/${item.slug}/zones`}
      kicker={item.name}
      title={`${item.name} hunt zones`}
      lede="The ground comes first. These are the zones the briefing already covers: what they feel like, how we hunt them, and what to confirm before the truck leaves."
      items={guides}
      basePath={`/hunt/${item.slug}/zones`}
    />
  );
}
