import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { subscribeAction } from "@/lib/actions";

export const metadata = { title: "Subscribe" };

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const q = await searchParams;
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/subscribe" />
      <section className="mx-auto max-w-[720px] px-6 py-16 text-center">
        <div className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Free · Every Tuesday · Unsubscribe anytime
        </div>
        <h1 className="mb-4 font-heading text-[clamp(38px,6vw,60px)] font-bold uppercase leading-none">
          Spend less time searching. More time hunting.
        </h1>
        <p className="mx-auto mb-8 max-w-[520px] font-serif text-[18px] leading-relaxed text-[#5C543F]">
          Join the NorCal hunters who get the Tuesday briefing — a five-minute read with everything you check before a
          trip, in one place.
        </p>
        {q.ok ? (
          <div className="bg-[#2F4A2C] p-6 font-heading text-[20px] font-semibold text-[#F2EDDD]">
            You&apos;re in. Check your inbox — first briefing lands Tuesday morning. See you in the field.
          </div>
        ) : (
          <form action={subscribeAction} className="mx-auto flex max-w-[560px] flex-wrap justify-center gap-2.5">
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="min-w-[260px] flex-1 border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3.5 text-[16px]"
            />
            <button className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
              Subscribe free
            </button>
          </form>
        )}
        {q.error ? <p className="mt-3 text-[14px] font-medium text-[#8C2F14]">Enter a valid email address.</p> : null}
        <p className="mt-3.5 text-[13px] font-medium text-[#8A8163]">No spam, no selling your address. One email a week.</p>
      </section>
      <SiteFooter compact />
    </>
  );
}
