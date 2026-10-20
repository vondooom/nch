import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { archiveShowcase } from "@/lib/archive";

export const metadata = { title: "The Showcase" };

export default function ShowcasePage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/showcase" />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Subscriber photos
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          The Showcase
        </h1>
        <p className="mb-10 max-w-[680px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          Every week we pick one reader photo or clip that stopped us in our tracks. Reply to the Tuesday briefing with
          a shot, a sentence, and how you want the credit to read.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {archiveShowcase.map((item) => (
            <article key={item.slug} className="border border-[#D8CDB4] bg-[#FBF8F0]">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : null}
              <div className="p-5">
                <div className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#8A8163]">
                  {item.week || "Showcase"}
                </div>
                <h2 className="mb-2 font-heading text-[24px] font-bold uppercase leading-tight text-[#1C2B1A]">
                  {item.title}
                </h2>
                <p className="font-serif text-[16px] leading-relaxed text-[#3B3526]">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
