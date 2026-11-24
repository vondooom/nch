import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConditionsPanel } from "@/components/site/conditions-panel";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { HuntMap } from "@/components/site/hunt-map";
import { SeasonList } from "@/components/site/season-list";
import { SubscribeForm } from "@/components/site/subscribe-form";
import { findRegion } from "@/lib/geo/regions";
import { findState, states } from "@/lib/geo/states";
import { species, zones } from "@/lib/guides";
import { huntUnitMaps } from "@/lib/maps/unit-maps";
import { pageMeta } from "@/lib/site";
import { visibleSeasonsForState } from "@/lib/seasons";

export function generateStaticParams() {
  return states.map((item) => ({ state: item.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const item = findState((await params).state);
  if (!item) return { title: "State" };
  return pageMeta({
    title: `${item.name} hunting`,
    description: `${item.name} hunting hub for Local Hunts. Wildlife agency links, a forecast for ${item.forecast.label}, and season dates only when we can quote the agency.`,
    path: `/hunt/${item.slug}`,
  });
}

export default async function StateHubPage({ params }: { params: Promise<{ state: string }> }) {
  const item = findState((await params).state);
  if (!item) notFound();
  const region = findRegion(item.region);
  const seasons = visibleSeasonsForState(item.slug);
  const stateZones = zones.filter((zone) => zone.state === item.slug);
  const stateSpecies = species.filter((animal) => animal.state === item.slug);

  return (
    <>
      <SiteBanner />
      <SiteHeader current="/hunt" />
      <section className="mx-auto max-w-[860px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          {region ? (
            <Link href={`/regions/${region.slug}`} className="hover:underline">
              {region.name}
            </Link>
          ) : (
            "State"
          )}
        </div>
        <h1 className="mb-3 font-heading text-[clamp(40px,6vw,64px)] font-bold uppercase leading-none">{item.name}</h1>
        <p className="mb-8 max-w-[640px] font-serif text-[18px] leading-relaxed text-[#5C543F]">
          {item.name} is in the {region?.name ?? "national"} region. Confirm every season, tag, and limit with the state
          wildlife agency before you hunt.
        </p>

        <div className="mb-8 border-2 border-[#211D14] bg-[#FBF8F0] p-6">
          <div className="mb-1 font-heading text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8A8163]">
            Wildlife agency
          </div>
          <h2 className="mb-3 font-heading text-[26px] font-bold uppercase">{item.agency}</h2>
          <div className="flex flex-wrap gap-4 font-heading text-[15px] font-semibold uppercase tracking-[0.08em]">
            {item.website ? (
              <a className="text-[#C75B12] underline" href={item.website}>
                Agency website
              </a>
            ) : (
              <span className="text-[#8A8163]">Agency website not confirmed yet</span>
            )}
            {item.regulationsUrl ? (
              <a className="text-[#C75B12] underline" href={item.regulationsUrl}>
                Hunting regulations
              </a>
            ) : (
              <span className="text-[#8A8163]">Regulations page not confirmed yet</span>
            )}
          </div>
        </div>

        {item.slug === "california" ? (
          <div className="mb-10">
            <h2 className="mb-3 font-heading text-[28px] font-bold uppercase">Hunt zones</h2>
            <HuntMap variant="california" />
            <div className="mt-4 grid gap-3 font-serif text-[14px] leading-relaxed text-[#5C543F]">
              <p>
                Deer zones: California Department of Fish and Wildlife, Wildlife Branch. Deer Hunt Zones, Title 14,
                Section 360 [ds342]. November 2014. Biogeographic Information and Observation System (BIOS). Retrieved
                November 23, 2026.{" "}
                <a className="text-[#C75B12] underline" href="https://creativecommons.org/licenses/by/4.0/">
                  CC BY 4.0
                </a>
                .
              </p>
              <p>
                Waterfowl zones: California Department of Fish and Wildlife. Waterfowl Hunt Zone [ds2906]. 2020.
                Biogeographic Information and Observation System (BIOS). Retrieved November 23, 2026.{" "}
                <a className="text-[#C75B12] underline" href="https://creativecommons.org/licenses/by/4.0/">
                  CC BY 4.0
                </a>
                .{" "}
                <a className="text-[#C75B12] underline" href="https://www.wildlife.ca.gov/Data/BIOS/Citing-BIOS">
                  How CDFW asks for BIOS to be cited
                </a>
                .
              </p>
              <p>These lines are approximate. Title 14 of the California Code of Regulations controls.</p>
              <p>
                Basemap: OpenFreeMap, OpenMapTiles, and OpenStreetMap contributors.{" "}
                <a className="text-[#C75B12] underline" href="https://openfreemap.org/tos/">
                  OpenFreeMap terms
                </a>
                .
              </p>
            </div>
          </div>
        ) : null}
        {huntUnitMaps[item.slug] ? (
          <p className="mb-8 font-serif text-[16px] leading-relaxed text-[#3B3526]">
            Hunt unit boundaries are not drawn here.{" "}
            <a className="text-[#C75B12] underline" href={huntUnitMaps[item.slug].href}>
              {huntUnitMaps[item.slug].name}
            </a>{" "}
            is the agency map.
          </p>
        ) : null}

        <div className="mb-8">
          <h2 className="mb-3 font-heading text-[28px] font-bold uppercase">Seasons</h2>
          {seasons.length > 0 ? (
            <SeasonList records={seasons} timeZone={item.timeZone} />
          ) : (
            <div className="border border-[#D8CDB4] bg-[#FBF8F0] p-6">
              <p className="font-serif text-[17px] leading-relaxed text-[#3B3526]">
                Season dates for {item.name} are coming. We publish a date only after we can quote the state agency.
              </p>
              {item.slug === "california" ? (
                <p className="mt-3 font-serif text-[16px] leading-relaxed text-[#5C543F]">
                  The older California briefing is still on the{" "}
                  <Link className="text-[#C75B12] underline" href="/regulations">
                    Board
                  </Link>{" "}
                  and the{" "}
                  <Link className="text-[#C75B12] underline" href="/bag-limits">
                    bag limits page
                  </Link>
                  . Those notes are not sourced season records.
                </p>
              ) : null}
              <div className="mt-5">
                <SubscribeForm source={`state-${item.slug}`} align="start" />
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <ConditionsPanel state={item.slug} />
        </div>

        {stateZones.length > 0 ? (
          <div className="mb-6">
            <Link href={`/hunt/${item.slug}/zones`} className="font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
              {item.name} zones
            </Link>
          </div>
        ) : null}
        {stateSpecies.length > 0 ? (
          <div>
            <Link href={`/hunt/${item.slug}/species`} className="font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
              {item.name} game
            </Link>
          </div>
        ) : null}
      </section>
      <SiteFooter compact />
    </>
  );
}
