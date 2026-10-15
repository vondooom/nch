import type { Metadata } from "next";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { JsonLd } from "@/components/site/json-ld";
import { faqs } from "@/lib/guides";

export const metadata: Metadata = {
  title: "FAQ",
  description: "What NorCalHunt is, how subscribe works, and why you still check CDFW before you hunt.",
};

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <SiteBanner />
      <SiteHeader current="/faq" />
      <section className="mx-auto max-w-[780px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Questions
        </div>
        <h1 className="mb-8 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Asked before every opener
        </h1>
        <div className="grid gap-4">
          {faqs.map((item) => (
            <article key={item.q} className="border border-[#D8CDB4] bg-[#FBF8F0] p-6">
              <h2 className="mb-2 font-heading text-[22px] font-bold uppercase leading-snug">{item.q}</h2>
              <p className="font-serif text-[17px] leading-relaxed text-[#3B3526]">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
