import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { SubscribeForm } from "@/components/site/subscribe-form";

export const metadata = { title: "Subscribe" };

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
        <SubscribeForm />
        {q.error ? <p className="mt-3 text-[14px] font-medium text-[#8C2F14]">Enter a valid email address.</p> : null}
        <p className="mt-3.5 text-[13px] font-medium text-[#8A8163]">
          No spam, no selling your address. One email a week. Addresses land on the desk until Beehiiv is connected.
        </p>
      </section>
      <SiteFooter compact />
    </>
  );
}
