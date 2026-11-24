import type { Metadata } from "next";
import Link from "next/link";
import { HuntMap } from "@/components/site/hunt-map";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Map",
  description: "A map of the 50 states. Click a state to open its hunting hub.",
  path: "/map",
});

export default function MapPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/map" />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          The country
        </div>
        <h1 className="mb-3 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">Map</h1>
        <p className="mb-6 max-w-[680px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          State outlines for the 50 states. California hunt zones are on the{" "}
          <Link className="text-[#C75B12] underline" href="/hunt/california">
            California hub
          </Link>
          .
        </p>
        <HuntMap variant="national" />
        <p className="mt-4 max-w-[760px] font-serif text-[14px] leading-relaxed text-[#5C543F]">
          Basemap: OpenFreeMap, OpenMapTiles, and OpenStreetMap contributors. The OpenFreeMap public map allows
          commercial use with no API key.{" "}
          <a className="text-[#C75B12] underline" href="https://openfreemap.org/tos/">
            OpenFreeMap terms
          </a>
          . State outlines: U.S. Census Bureau, 2024 Cartographic Boundary File (cb_2024_us_state_20m), public domain.
        </p>
      </section>
      <SiteFooter compact />
    </>
  );
}
