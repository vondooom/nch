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
            So we built NorCalHunt — a place where hunters can find the tools and information they rely on before every
            hunt.
          </p>
        </div>
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
