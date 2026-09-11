import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "From Field to Table" };

export default function RecipesPage() {
  const recipes = published(getStore().recipes);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/recipes" />
      <section className="mx-auto max-w-[980px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          From Field to Table
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Recipes worth the freezer space
        </h1>
        <p className="mb-10 max-w-[640px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          The weekly recipe used to live only inside the briefing. It now has a home you can cook from all season.
        </p>
        <div className="grid gap-6">
          {recipes.map((r) => (
            <Link key={r.id} href={`/recipes/${r.slug}`} className="block border-2 border-[#211D14] bg-[#FBF8F0]">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="aspect-[21/9] w-full object-cover" />
              ) : null}
              <div className="p-6 md:p-8">
                <h2 className="mb-2 font-heading text-[32px] font-bold uppercase text-[#1C2B1A]">{r.title}</h2>
                <p className="font-serif text-[17px] leading-relaxed text-[#5C543F]">{r.lede}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
