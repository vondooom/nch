import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { PublicSubmitForm } from "@/components/site/public-submit-form";

export const metadata = { title: "Nominate a dog" };

export default function NominatePage() {
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
        <PublicSubmitForm
          kind="dog"
          namePlaceholder="Your name"
          titlePlaceholder="Dog name, breed, town"
          bodyPlaceholder="What they hunt and the story"
          submitLabel="Nominate"
        />
      </section>
      <SiteFooter compact />
    </>
  );
}
