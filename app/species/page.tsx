import type { Metadata } from "next";
import { GuideIndex } from "@/components/site/guide-page";
import { species } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Game species",
  description: "Blacktail, dove, waterfowl, turkey, pig, quail, and pheasant. How NorCal hunters actually chase them.",
};

export default function SpeciesPage() {
  return (
    <GuideIndex
      current="/species"
      kicker="What we hunt"
      title="Game species"
      lede="A page for each animal the Sunday briefing keeps coming back to. Seasons live on the Board. These notes are how the hunt feels."
      items={species}
      basePath="/species"
    />
  );
}
