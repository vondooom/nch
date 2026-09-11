import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "Newsletters" };

export default function NewslettersPage() {
  const issues = published(getStore().issues).sort((a, b) => b.number - a.number);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/newsletters" />
      <section className="mx-auto max-w-[900px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          The archive
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Every briefing so far
        </h1>
        <p className="mb-5 max-w-[620px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          Every issue covers NorCal seasons, draw dates, regulations, gear, and migration updates — published every
          Tuesday since June 2026, without a gap.
        </p>
        <div className="mb-10 flex flex-wrap items-center gap-3 border-2 border-[#211D14] bg-[#FBF8F0] px-5 py-4">
          <span className="min-w-[220px] flex-1 font-serif text-[15px] text-[#3B3526]">
            Drop your email and never miss a beat.
          </span>
          <Link href="/subscribe" className="bg-[#C75B12] px-5 py-2.5 font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Subscribe free
          </Link>
        </div>
        <div className="grid gap-3.5">
          {issues.map((it) => (
            <Link
              key={it.id}
              href={`/newsletters/${it.slug}`}
              className="block border border-[#D8CDB4] border-l-4 border-l-[#2F4A2C] bg-[#FBF8F0] px-6 py-5"
            >
              <div className="mb-2 flex flex-wrap items-baseline gap-3">
                <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[13px] font-bold uppercase tracking-[0.12em] text-[#FFF6E8]">
                  Issue {it.number}
                </span>
                <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#8A8163]">
                  {it.date} · {it.read}
                </span>
              </div>
              <div className="mb-2 font-heading text-[22px] font-semibold leading-snug text-[#1C2B1A]">{it.title}</div>
              <div className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{it.blurb}</div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
