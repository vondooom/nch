import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  const listings = published(getStore().market);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/marketplace" />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <div className="font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
            The Marketplace
          </div>
          <span className="bg-[#1C2B1A] px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8A05C]">
            Coming soon — concept preview
          </span>
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Buy, sell & trade inside the pack
        </h1>
        <p className="mb-8 max-w-[660px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          A members&apos; classifieds for NorCal hunters. Illustrative listings — the real board opens to subscribers
          first. The marketplace will not list firearms.
        </p>
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div key={l.id} className="flex flex-col gap-2.5 border border-[#D8CDB4] bg-[#FBF8F0] p-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#FFF6E8]">
                  {l.cat}
                </span>
                <span className="text-[12px] text-[#8A8163]">{l.where}</span>
              </div>
              <div className="flex-1 font-heading text-[20px] font-bold text-[#1C2B1A]">{l.title}</div>
              <div className="font-serif text-[14px] leading-relaxed text-[#5C543F]">{l.desc}</div>
              <div className="border-t border-[#E7DFC9] pt-3 font-heading text-[22px] font-bold text-[#C75B12]">
                {l.price}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 bg-[#1C2B1A] p-8 text-[#D9D2BA]">
          <div className="min-w-[280px] flex-1">
            <div className="mb-2 font-heading text-[26px] font-bold uppercase text-[#F7F2E4]">Get first crack at the board</div>
            <p className="font-serif text-[16px] leading-relaxed">Subscribers get early access when the marketplace opens.</p>
          </div>
          <Link href="/subscribe" className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Subscribe
          </Link>
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
