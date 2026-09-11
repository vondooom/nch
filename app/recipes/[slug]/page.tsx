import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { getStore, published } from "@/lib/store";

function findRecipe(slug: string) {
  return published(getStore().recipes).find((item) => item.slug === slug || item.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const recipe = findRecipe((await params).slug);
  if (!recipe) return { title: "Recipe" };
  return pageMeta({
    title: recipe.title,
    description: recipe.lede,
    path: `/recipes/${recipe.slug}`,
    image: recipe.image,
  });
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const recipe = findRecipe((await params).slug);
  if (!recipe) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Recipe",
          name: recipe.title,
          description: recipe.lede,
          image: recipe.image,
          recipeIngredient: recipe.need,
          recipeInstructions: recipe.method.map((step) => ({
            "@type": "HowToStep",
            name: step.h,
            text: step.t,
          })),
          url: absoluteUrl(`/recipes/${recipe.slug}`),
        }}
      />
      <SiteBanner />
      <SiteHeader current="/recipes" />
      <article className="mx-auto max-w-[780px] px-6 py-10 pb-20">
        <Link href="/recipes" className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]">
          ← All recipes
        </Link>
        {recipe.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image} alt={recipe.title} className="mt-6 mb-8 aspect-[16/9] w-full border border-[#D8CDB4] object-cover" />
        ) : null}
        <h1 className="mb-3 font-heading text-[clamp(34px,4.6vw,54px)] font-bold uppercase leading-tight">{recipe.title}</h1>
        <p className="mb-8 font-serif text-[19px] leading-relaxed text-[#5C543F]">{recipe.lede}</p>
        <div className="grid gap-0.5 bg-[#211D14] md:grid-cols-2">
          <div className="bg-[#FBF8F0] p-6">
            <div className="mb-3 font-heading text-[15px] font-bold uppercase tracking-[0.14em]">You will need</div>
            <ul className="grid list-disc gap-1 pl-5 font-serif text-[15px] leading-relaxed">
              {recipe.need.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div className="bg-[#FBF8F0] p-6">
            <div className="mb-3 font-heading text-[15px] font-bold uppercase tracking-[0.14em]">The method</div>
            <ol className="grid list-decimal gap-2 pl-5 font-serif text-[15px] leading-relaxed">
              {recipe.method.map((m) => (
                <li key={m.h}>
                  <strong>{m.h}</strong> {m.t}
                </li>
              ))}
            </ol>
          </div>
        </div>
        {recipe.note ? <p className="mt-6 font-serif text-[15px] leading-relaxed text-[#3B3526]">{recipe.note}</p> : null}
      </article>
      <SiteFooter compact />
    </>
  );
}
