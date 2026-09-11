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
        <div className="grid gap-8">
          {recipes.map((r) => (
            <article key={r.id} id={r.slug} className="border-2 border-[#211D14] bg-[#FBF8F0]">
              <div className="border-b border-[#D8CDB4] p-6 md:p-8">
                <h2 className="mb-2 font-heading text-[32px] font-bold uppercase text-[#1C2B1A]">{r.title}</h2>
                <p className="font-serif text-[17px] leading-relaxed text-[#5C543F]">{r.lede}</p>
              </div>
              <div className="grid gap-0.5 bg-[#211D14] md:grid-cols-2">
                <div className="bg-[#FBF8F0] p-6">
                  <div className="mb-3 font-heading text-[15px] font-bold uppercase tracking-[0.14em]">You will need</div>
                  <ul className="grid list-disc gap-1 pl-5 font-serif text-[15px] leading-relaxed">
                    {r.need.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#FBF8F0] p-6">
                  <div className="mb-3 font-heading text-[15px] font-bold uppercase tracking-[0.14em]">The method</div>
                  <ol className="grid list-decimal gap-2 pl-5 font-serif text-[15px] leading-relaxed">
                    {r.method.map((m) => (
                      <li key={m.h}>
                        <strong>{m.h}</strong> {m.t}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              {r.note ? <p className="p-6 font-serif text-[15px] leading-relaxed text-[#3B3526]">{r.note}</p> : null}
            </article>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
