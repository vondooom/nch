import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { deskDisclaimer, type FieldGuide } from "@/lib/guides";

export function GuideIndex({
  current,
  kicker,
  title,
  lede,
  items,
  basePath,
}: {
  current: string;
  kicker: string;
  title: string;
  lede: string;
  items: FieldGuide[];
  basePath: string;
}) {
  return (
    <>
      <SiteBanner />
      <SiteHeader current={current} />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">{kicker}</div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">{title}</h1>
        <p className="mb-8 max-w-[680px] font-serif text-[17px] leading-relaxed text-[#5C543F]">{lede}</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.slug} href={`${basePath}/${item.slug}`} className="flex flex-col border border-[#D8CDB4] bg-[#FBF8F0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-[180px] w-full object-cover" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#C75B12]">{item.kicker}</div>
                <div className="font-heading text-[22px] font-bold uppercase text-[#1C2B1A]">{item.title}</div>
                <p className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{item.lede}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-[680px] font-serif text-[14px] leading-relaxed text-[#8A8163]">{deskDisclaimer}</p>
      </section>
      <SiteFooter compact />
    </>
  );
}

export function GuideDetail({
  current,
  backHref,
  backLabel,
  guide,
}: {
  current: string;
  backHref: string;
  backLabel: string;
  guide: FieldGuide;
}) {
  return (
    <>
      <SiteBanner />
      <SiteHeader current={current} />
      <article className="mx-auto max-w-[780px] px-6 py-10 pb-20">
        <Link href={backHref} className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]">
          ← {backLabel}
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={guide.image} alt="" className="mt-6 mb-8 aspect-[16/9] w-full border border-[#D8CDB4] object-cover" />
        <div className="mb-2 font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#C75B12]">{guide.kicker}</div>
        <h1 className="mb-4 font-heading text-[clamp(34px,4.6vw,54px)] font-bold uppercase leading-tight">{guide.title}</h1>
        <p className="mb-8 font-serif text-[19px] leading-relaxed text-[#5C543F]">{guide.lede}</p>
        <div className="grid gap-8">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 font-heading text-[24px] font-bold uppercase">{section.heading}</h2>
              <div className="grid gap-4 font-serif text-[17px] leading-[1.75] text-[#3B3526]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-10 border-t border-[#D8CDB4] pt-4 font-serif text-[14px] leading-relaxed text-[#8A8163]">{deskDisclaimer}</p>
      </article>
      <SiteFooter compact />
    </>
  );
}
