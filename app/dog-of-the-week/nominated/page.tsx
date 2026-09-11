import Link from "next/link";

import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";

export const metadata = { title: "Nomination received" };

export default function DogNominatedPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/dog-of-the-week" />
      <section className="mx-auto max-w-[720px] px-6 py-16">
        <div className="bg-[#2F4A2C] p-6 font-heading text-[20px] font-semibold text-[#F2EDDD]">
          Nomination received. Editors will take it from here.
        </div>
        <Link
          href="/dog-of-the-week"
          className="mt-6 inline-block font-heading text-[14px] font-semibold uppercase tracking-[0.12em] text-[#8A8163]"
        >
          ← Back to dogs
        </Link>
      </section>
      <SiteFooter compact />
    </>
  );
}
