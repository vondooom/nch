import type { Metadata } from "next";
import { GuideIndex } from "@/components/site/guide-page";
import { zones } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Hunt zones",
  description: "A, B, C, D, and X deer zones plus Sacramento Valley refuge country — how NorCalHunt reads the ground.",
};

export default function ZonesPage() {
  return (
    <GuideIndex
      current="/zones"
      kicker="The map"
      title="NorCal hunt zones"
      lede="The ground comes first. These are the zones we brief every week — what they feel like, how we hunt them, and what to confirm before the truck leaves."
      items={zones}
      basePath="/zones"
    />
  );
}
