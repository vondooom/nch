import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "Local Boys" };

export default function LocalBoysPage() {
  const listings = published(getStore().locals);
  const groups = [...new Set(listings.map((l) => l.group))];
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/local-boys" />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Local Boys — Services
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          People we&apos;d send our own family to
        </h1>
        <p className="mb-10 max-w-[660px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          Trusted local guides, processors, trainers, and taxidermists who hunt the same ground you do.
        </p>
        {groups.map((group) => (
          <div key={group} className="mb-10">
            <h2 className="mb-4 border-b-2 border-[#211D14] pb-2.5 font-heading text-[25px] font-bold uppercase">
              {group}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {listings
                .filter((l) => l.group === group)
                .map((b) => (
                  <div key={b.id} className="border border-[#D8CDB4] bg-[#FBF8F0] p-5">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <div className="font-heading text-[20px] font-bold text-[#1C2B1A]">{b.name}</div>
                      {b.featured ? (
                        <span className="bg-[#C75B12] px-2 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-[#FFF6E8]">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <div className="mb-3 text-[13px] font-medium uppercase tracking-[0.06em] text-[#8A8163]">{b.where}</div>
                    <div className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{b.desc}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </section>
      <SiteFooter compact />
    </>
  );
}
