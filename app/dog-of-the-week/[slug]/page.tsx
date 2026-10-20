import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RichBody } from "@/components/site/rich-body";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { getStore, published } from "@/lib/store";

function findDog(slug: string) {
  return published(getStore().dogs).find((item) => item.slug === slug || item.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const dog = findDog((await params).slug);
  if (!dog) return { title: "Dog of the Week" };
  return pageMeta({
    title: dog.name,
    description: dog.story,
    path: `/dog-of-the-week/${dog.slug}`,
    image: dog.image,
  });
}

export default async function DogPage({ params }: { params: Promise<{ slug: string }> }) {
  const dog = findDog((await params).slug);
  if (!dog) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${dog.name} — Dog of the Week`,
          description: dog.story,
          image: dog.image,
          url: absoluteUrl(`/dog-of-the-week/${dog.slug}`),
        }}
      />
      <SiteBanner />
      <SiteHeader current="/dog-of-the-week" />
      <article className="mx-auto max-w-[780px] px-6 py-10 pb-20">
        <Link
          href="/dog-of-the-week"
          className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]"
        >
          ← All dogs
        </Link>
        {dog.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dog.image} alt={dog.name} className="mt-6 mb-6 aspect-[16/9] w-full border border-[#D8CDB4] object-cover" />
        ) : null}
        {dog.credit ? <p className="mb-4 text-[13px] text-[#8A8163]">{dog.credit}</p> : null}
        <div className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#8A8163]">{dog.week}</div>
        <h1 className="mb-2 font-heading text-[clamp(34px,4.6vw,54px)] font-bold uppercase leading-tight">{dog.name}</h1>
        <p className="mb-6 font-heading text-[16px] font-semibold uppercase tracking-[0.08em] text-[#2F4A2C]">{dog.breed}</p>
        <RichBody body={dog.story} />
        <Link
          href="/dog-of-the-week/nominate"
          className="mt-10 inline-block bg-[#C75B12] px-6 py-3 font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]"
        >
          Nominate a dog
        </Link>
      </article>
      <SiteFooter compact />
    </>
  );
}
