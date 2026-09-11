import Link from "next/link";

import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";

export const metadata = { title: "Story received" };

export default function StorySubmittedPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/field-stories" />
      <section className="mx-auto max-w-[720px] px-6 py-16">
        <div className="bg-[#2F4A2C] p-6 font-heading text-[20px] font-semibold text-[#F2EDDD]">
          Got it. If it runs, you&apos;ll see it in a Tuesday briefing.
        </div>
        <Link
          href="/field-stories"
          className="mt-6 inline-block font-heading text-[14px] font-semibold uppercase tracking-[0.12em] text-[#8A8163]"
        >
          ← Back to stories
        </Link>
      </section>
      <SiteFooter compact />
    </>
  );
}
