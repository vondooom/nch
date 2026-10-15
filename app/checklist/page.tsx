import type { Metadata } from "next";
import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { checklist, deskDisclaimer } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Before you leave",
  description: "The driveway checklist: paper, non-lead, shoot light, fire closures, and a plan for the meat.",
};

export default function ChecklistPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/checklist" />
      <section className="mx-auto max-w-[860px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Driveway
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Before you leave
        </h1>
        <p className="mb-10 max-w-[640px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          The list we want in your head when the coffee is still too hot. If one box is empty, the hunt can wait ten
          minutes.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {checklist.map((group) => (
            <article key={group.title} className="border-2 border-[#211D14] bg-[#FBF8F0] p-6">
              <h2 className="mb-3 font-heading text-[22px] font-bold uppercase">{group.title}</h2>
              <ul className="grid list-disc gap-2 pl-5 font-serif text-[16px] leading-relaxed">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/conditions" className="bg-[#C75B12] px-5 py-3 font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Today&apos;s conditions
          </Link>
          <Link href="/regulations" className="border-2 border-[#211D14] px-5 py-3 font-heading text-[15px] font-semibold uppercase tracking-[0.1em]">
            The Board
          </Link>
        </div>
        <p className="mt-8 font-serif text-[14px] leading-relaxed text-[#8A8163]">{deskDisclaimer}</p>
      </section>
      <SiteFooter compact />
    </>
  );
}
