import type { Metadata } from "next";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What NorCalHunt does with the email you type into Subscribe free.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/privacy" />
      <article className="mx-auto max-w-[720px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          The list
        </div>
        <h1 className="mb-6 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">Privacy</h1>
        <div className="grid gap-4 font-serif text-[17px] leading-[1.75] text-[#3B3526]">
          <p>
            Subscribe free stores the email address you submit, the time you submitted it, and whether it came from the
            homepage or the subscribe page. Staff can see that list on the desk. We do not sell it, rent it, or hand it
            to a gear company.
          </p>
          <p>
            Tuesday mail is not sending yet. When Beehiiv is connected, that is the tool that will deliver the briefing.
            Until then, the address sits on the desk and the issues stay on the site.
          </p>
          <p>
            Story submissions, dog nominations, and the contact form store the name, email, and note you type. Editors
            use them to decide what to draft. They are not published until an admin says so.
          </p>
          <p>
            To get off the list, email the desk from the same address and say unsubscribe. We will remove it. The local
            seats on this preview are not a public directory.
          </p>
        </div>
      </article>
      <SiteFooter compact />
    </>
  );
}
