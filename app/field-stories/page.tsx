import Link from "next/link";
import { PageHero, SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "Field Stories" };

export default function StoriesPage() {
  const stories = published(getStore().stories);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/field-stories" />
      <PageHero
        kicker="Field Stories"
        title="Real hunts. Real memories."
        lede="Handpicked tales from NorCal hunters — deer camps, duck blinds, turkey ridges, and everything in between."
        image="https://images.unsplash.com/photo-1642017263197-f55a861ab4dd?fm=jpg&q=60&w=1600&auto=format&fit=crop"
      />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-2 border-[#211D14] bg-[#FBF8F0] px-5 py-4">
          <p className="font-serif text-[15px] text-[#3B3526]">Got a hunt worth telling? Editors read every one.</p>
          <Link href="/field-stories/submit" className="bg-[#C75B12] px-5 py-2.5 font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Submit a story
          </Link>
        </div>
        <div className="grid gap-5">
          {stories.map((s) => (
            <Link
              key={s.id}
              href={`/field-stories/${s.slug}`}
              className="block border border-[#D8CDB4] bg-[#FBF8F0] p-6 md:p-8"
            >
              <div className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#8A8163]">
                {s.species} · {s.date}
              </div>
              <h2 className="mb-2 font-heading text-[28px] font-bold uppercase text-[#1C2B1A]">{s.title}</h2>
              <p className="mb-4 font-serif italic text-[#C75B12]">{s.author}</p>
              <p className="max-w-[68ch] font-serif text-[17px] leading-relaxed text-[#3B3526]">{s.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
