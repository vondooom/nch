import Link from "next/link";
import { ArchiveSections } from "@/components/site/archive-sections";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { archiveBagLimits } from "@/lib/archive";

export const metadata = { title: "Bag limits" };

export default function BagLimitsPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/bag-limits" />
      <section className="mx-auto max-w-[860px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          2026–27 season
        </div>
        <h1 className="mb-4 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Northern California bag limits
        </h1>
        <p className="mb-8 font-serif text-[17px] leading-relaxed text-[#5C543F]">
          The quick reference from the old field desk. This is a plain-language summary, not the regulation booklet.{" "}
          <Link href="/regulations" className="text-[#C75B12]">
            Season dates live with the board.
          </Link>
        </p>
        <ArchiveSections sections={archiveBagLimits} />
      </section>
      <SiteFooter compact />
    </>
  );
}
