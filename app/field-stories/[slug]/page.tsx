import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { getStore, published } from "@/lib/store";

function findStory(slug: string) {
  return published(getStore().stories).find((item) => item.slug === slug || item.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const story = findStory((await params).slug);
  if (!story) return { title: "Story" };
  return pageMeta({
    title: story.title,
    description: story.excerpt,
    path: `/field-stories/${story.slug}`,
    image: story.image,
  });
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const story = findStory((await params).slug);
  if (!story) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: story.title,
          description: story.excerpt,
          image: story.image,
          author: { "@type": "Person", name: story.author },
          datePublished: story.date,
          url: absoluteUrl(`/field-stories/${story.slug}`),
        }}
      />
      <SiteBanner />
      <SiteHeader current="/field-stories" />
      <article className="mx-auto max-w-[780px] px-6 py-10 pb-20">
        <Link
          href="/field-stories"
          className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]"
        >
          ← All stories
        </Link>
        <div className="mt-4 mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#8A8163]">
          {story.species} · {story.date}
        </div>
        <h1 className="mb-3 font-heading text-[clamp(34px,4.6vw,54px)] font-bold uppercase leading-tight">
          {story.title}
        </h1>
        <p className="mb-7 font-serif italic text-[#C75B12]">{story.author}</p>
        {story.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.image} alt="" className="mb-8 aspect-video w-full border border-[#D8CDB4] object-cover" />
        ) : null}
        <div className="grid gap-4 font-serif text-[17px] leading-[1.75] text-[#3B3526]">
          {story.body.split("\n\n").map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </article>
      <SiteFooter compact />
    </>
  );
}
