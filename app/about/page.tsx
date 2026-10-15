import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";

export const metadata = { title: "About" };

export default function AboutPage() {
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
        <div className="grid gap-4 font-serif text-[18px] leading-[1.7] text-[#3B3526]">
          <p>
            We&apos;re just two local boys who grew up chasing game across Northern California. From blacktail deer in
            the timber to waterfowl in the marsh, hunting has been a way of life for us for more than 50 years.
          </p>
          <p>
            Like many hunters, we grew tired of bouncing between websites to find the information we needed before every
            trip. Weather was on one site, regulations on another, sunrise and sunset times somewhere else.
          </p>
          <p className="font-semibold text-[#1C2B1A]">We believed there had to be a better way.</p>
          <p>
            So we built NorCalHunt — a Tuesday briefing and a field desk. Zones, species, gear, recipes, dogs, and the
            people we would send our own family to. One place, written like we talk in the truck.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-[980px] gap-4 px-6 pb-4 md:grid-cols-3">
        {[
          ["What we cover", "Deer zones, valley refuges, dove through pheasant, and the pigs that do not wait for a draw."],
          ["How the desk works", "Editors draft. Admins publish. A half-finished issue does not go out on Tuesday."],
          ["What we will not do", "We do not sell tags, book hunts, or list firearms. CDFW is still the law."],
        ].map(([title, copy]) => (
          <div key={title} className="border-2 border-[#211D14] bg-[#FBF8F0] p-5">
            <h2 className="mb-2 font-heading text-[20px] font-bold uppercase">{title}</h2>
            <p className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{copy}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-[780px] px-6 py-12 text-center">
        <Link href="/subscribe" className="inline-block bg-[#C75B12] px-8 py-4 font-heading text-[18px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
          Join the Tuesday briefing
        </Link>
      </section>
      <SiteFooter compact />
    </>
  );
}
