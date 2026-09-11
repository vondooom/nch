import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "Dog of the Week" };

export default function DogsPage() {
  const dogs = published(getStore().dogs);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/dog-of-the-week" />
      <section className="mx-auto max-w-[1180px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Dog of the Week
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          The best hunting partners have four legs
        </h1>
        <p className="mb-8 max-w-[640px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          Every issue features one NorCal hunting dog and the story behind it. Send us yours and we&apos;ll put it in
          front of the whole pack.
        </p>
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dogs.map((d) => (
            <Link key={d.id} href={`/dog-of-the-week/${d.slug}`} className="flex flex-col border border-[#D8CDB4] bg-[#FBF8F0]">
              <div className="h-[230px] bg-[#1C2B1A]">
                {d.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.image} alt={d.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-heading text-[24px] font-bold uppercase text-[#1C2B1A]">{d.name}</div>
                  <div className="text-right text-[12px] font-medium uppercase tracking-[0.08em] text-[#8A8163]">
                    {d.week}
                  </div>
                </div>
                <div className="font-heading text-[14px] font-semibold uppercase tracking-[0.08em] text-[#2F4A2C]">
                  {d.breed}
                </div>
                <div className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{d.story}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-[#211D14] bg-[#FBF8F0] px-7 py-6">
          <div>
            <div className="mb-1.5 font-heading text-[22px] font-bold uppercase">Nominate a dog</div>
            <div className="max-w-[520px] font-serif text-[15px] leading-relaxed text-[#5C543F]">
              A photo, the dog&apos;s name and breed, and the story — a retrieve, a point, a lesson.
            </div>
          </div>
          <Link href="/dog-of-the-week/nominate" className="bg-[#C75B12] px-6 py-3.5 font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Nominate
          </Link>
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
