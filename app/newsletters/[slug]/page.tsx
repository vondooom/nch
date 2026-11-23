import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RichBody } from "@/components/site/rich-body";
import { pageMeta } from "@/lib/site";
import { getStore, published } from "@/lib/store";
import { GameBirdGuidance } from "@/components/site/game-bird-guidance";

function findIssue(slug: string) {
  return published(getStore().issues).find((i) => i.slug === slug || i.id === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const issue = findIssue((await params).slug);
  if (!issue) return { title: "Issue" };
  return pageMeta({
    title: `Issue #${issue.number}: ${issue.title}`,
    description: issue.blurb,
    path: `/newsletters/${issue.slug}`,
    image: issue.image,
  });
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = findIssue(slug);
  if (!issue) notFound();
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/newsletters" />
      <article className="mx-auto max-w-[780px] px-6 py-10 pb-20">
        <Link href="/newsletters" className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8A8163]">
          ← All briefings
        </Link>
        <div className="mt-4 mb-3 flex flex-wrap items-baseline gap-3">
          <span className="bg-[#2F4A2C] px-2.5 py-1 font-heading text-[13px] font-bold uppercase tracking-[0.12em] text-[#FFF6E8]">
            Issue #{issue.number}
          </span>
          <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#8A8163]">
            {issue.date} · {issue.read}
          </span>
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(34px,4.6vw,54px)] font-bold uppercase leading-tight">
          {issue.title}
        </h1>
        <p className="mb-7 max-w-[680px] font-serif text-[19px] leading-relaxed text-[#5C543F]">{issue.blurb}</p>
        {issue.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issue.image} alt="" className="mb-8 aspect-video w-full border border-[#D8CDB4] object-cover" />
        ) : null}
        {[3, 13, 16, 17, 20, 21, 22, 23].includes(issue.number) ? <GameBirdGuidance archived /> : null}
        <RichBody body={issue.body} />
        {issue.body.includes("The Local Hunts Team") ? null : (
          <p className="mt-10 font-heading text-[18px] font-semibold uppercase tracking-[0.08em] text-[#1C2B1A]">
            The Local Hunts Team
          </p>
        )}
      </article>
      <SiteFooter compact />
    </>
  );
}
