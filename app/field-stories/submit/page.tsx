import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { submitPublicAction } from "@/lib/actions";

export const metadata = { title: "Submit a field story" };

export default async function SubmitStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/field-stories" />
      <section className="mx-auto max-w-[720px] px-6 py-16">
        <div className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Field Stories
        </div>
        <h1 className="mb-4 font-heading text-[clamp(36px,5vw,52px)] font-bold uppercase leading-none">
          Send us the hunt
        </h1>
        <p className="mb-8 font-serif text-[17px] leading-relaxed text-[#5C543F]">
          A first buck, a limit in the rain, the dog that finally figured it out. Editors read the inbox; admins publish
          what runs.
        </p>
        {ok ? (
          <div className="bg-[#2F4A2C] p-6 font-heading text-[20px] font-semibold text-[#F2EDDD]">
            Got it. If it runs, you&apos;ll see it in a Tuesday briefing.
          </div>
        ) : (
          <form action={submitPublicAction} className="grid gap-4">
            <input type="hidden" name="kind" value="story" />
            <input name="name" placeholder="Your name" required className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <input name="email" type="email" placeholder="Email" required className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <input name="title" placeholder="Title or where it happened" required className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <textarea name="body" required rows={8} placeholder="The story" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
            <button className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
              Send to the desk
            </button>
          </form>
        )}
      </section>
      <SiteFooter compact />
    </>
  );
}
