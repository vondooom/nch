import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "Gear" };

export default function GearPage() {
  const items = published(getStore().gear);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/gear" />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Gear Check
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Field-tested gear we actually use
        </h1>
        <p className="mb-8 max-w-[660px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          Every pick has been carried, shot, packed, or worn by us or by readers we trust. We favor the value option that
          holds up.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <Link key={g.id} href={`/gear/${g.slug}`} className="flex flex-col border border-[#D8CDB4] bg-[#FBF8F0]">
              <div className="h-[200px] bg-[#1C2B1A]">
                {g.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image} alt={g.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#FFF6E8]">
                    {g.category}
                  </span>
                  <span className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#C75B12]">
                    {g.badge}
                  </span>
                </div>
                <div className="font-heading text-[21px] font-bold leading-snug text-[#1C2B1A]">{g.name}</div>
                <div className="flex-1 font-serif text-[15px] leading-relaxed text-[#5C543F]">{g.why}</div>
                <div className="flex items-baseline justify-between border-t border-[#E7DFC9] pt-2.5">
                  <span className="font-heading text-[18px] font-bold">{g.price}</span>
                  <span className="text-[13px] text-[#8A8163]">{g.issue}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
