import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";

export const metadata = { title: "You're in" };

export default function SubscribeConfirmedPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/subscribe" />
      <section className="mx-auto max-w-[720px] px-6 py-16 text-center">
        <div className="bg-[#2F4A2C] p-6 font-heading text-[20px] font-semibold text-[#F2EDDD]">
          You&apos;re in. First briefing lands Tuesday morning. See you in the field.
        </div>
        <p className="mt-5 font-serif text-[16px] text-[#5C543F]">
          We logged the address on the desk. When Beehiiv is connected, Tuesday mail goes out from there.
        </p>
      </section>
      <SiteFooter compact />
    </>
  );
}
