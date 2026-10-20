import { ArchiveSections } from "@/components/site/archive-sections";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { archiveAbout, archiveAboutPoster } from "@/lib/archive";

export const metadata = { title: "About" };

export default function AboutPage() {
  const [intro, ...rest] = archiveAbout;
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/about" />
      <section className="mx-auto max-w-[780px] px-6 pt-14">
        <div className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          About NorCalHunt
        </div>
        <h1 className="mb-5 font-heading text-[clamp(38px,5.5vw,58px)] font-bold uppercase leading-none">
          We&apos;re hunters first.
        </h1>
        {archiveAboutPoster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={archiveAboutPoster} alt="" className="mb-8 w-full border border-[#D8CDB4] object-cover" />
        ) : null}
        <div className="grid gap-4 font-serif text-[18px] leading-[1.7] text-[#3B3526]">
          {intro?.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[780px] px-6 py-12 pb-20">
        <ArchiveSections sections={rest} />
      </section>
      <SiteFooter compact />
    </>
  );
}
