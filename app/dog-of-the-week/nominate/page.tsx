import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { submitPublicAction } from "@/lib/actions";

export const metadata = { title: "Nominate a dog" };

export default async function NominatePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/dog-of-the-week" />
      <section className="mx-auto max-w-[720px] px-6 py-16">
        <div className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Dog of the Week
        </div>
        <h1 className="mb-4 font-heading text-[clamp(36px,5vw,52px)] font-bold uppercase leading-none">
          Put your dog in the briefing
        </h1>
        {ok ? (
          <div className="bg-[#2F4A2C] p-6 font-heading text-[20px] font-semibold text-[#F2EDDD]">
            Nomination received. Editors will take it from here.
          </div>
        ) : (
          <form action={submitPublicAction} className="grid gap-4">
            <input type="hidden" name="kind" value="dog" />
            <input name="name" placeholder="Your name" required className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <input name="email" type="email" placeholder="Email" required className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <input name="title" placeholder="Dog name, breed, town" required className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <textarea name="body" required rows={6} placeholder="What they hunt and the story" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <button className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
              Nominate
            </button>
          </form>
        )}
      </section>
      <SiteFooter compact />
    </>
  );
}
