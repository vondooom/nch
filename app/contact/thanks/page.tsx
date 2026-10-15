import type { Metadata } from "next";
import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Message received" };

export default function ContactThanksPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/contact" />
      <section className="mx-auto max-w-[720px] px-6 py-16 text-center">
        <div className="bg-[#2F4A2C] p-6 font-heading text-[22px] font-semibold text-[#F2EDDD]">
          Got it. The desk will read it.
        </div>
        <Link href="/" className="mt-6 inline-block font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
          Back to the briefing
        </Link>
      </section>
      <SiteFooter compact />
    </>
  );
}