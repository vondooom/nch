import type { Metadata } from "next";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write the NorCalHunt desk — corrections, hunts, and people we should know about.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/contact" />
      <section className="mx-auto max-w-[720px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          The desk
        </div>
        <h1 className="mb-3 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">Write us</h1>
        <p className="mb-8 font-serif text-[17px] leading-relaxed text-[#5C543F]">
          A wrong date, a hunt worth reading, a processor we should know. Editors see every note. We answer the ones
          that need an answer.
        </p>
        <form action="/api/submissions" method="post" className="grid gap-3 border-2 border-[#211D14] bg-[#FBF8F0] p-6">
          <input type="hidden" name="kind" value="contact" />
          <input name="name" required placeholder="Name" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
          <input name="email" type="email" required placeholder="Email" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
          <input name="title" required placeholder="Subject" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
          <textarea name="body" required rows={6} placeholder="What should we know?" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
          <button type="submit" className="bg-[#C75B12] px-6 py-3 font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Send to the desk
          </button>
          {query.error ? <p className="text-[14px] text-[#8C2F14]">Add a name, email, and a note.</p> : null}
        </form>
      </section>
      <SiteFooter compact />
    </>
  );
}
