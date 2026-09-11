import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { PublicSubmitForm } from "@/components/site/public-submit-form";

export const metadata = { title: "Submit a field story" };

export default function SubmitStoryPage() {
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
        <PublicSubmitForm
          kind="story"
          namePlaceholder="Your name"
          titlePlaceholder="Title or where it happened"
          bodyPlaceholder="The story"
          submitLabel="Send to the desk"
        />
      </section>
      <SiteFooter compact />
    </>
  );
}
