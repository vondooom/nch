import Link from "next/link";
import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { SubscribeForm } from "@/components/site/subscribe-form";
import { heroSrc } from "@/lib/brand";
import { species, zones } from "@/lib/guides";
import { getStore, published } from "@/lib/store";

export default function HomePage() {
  const data = getStore();
  const issues = published(data.issues).sort((a, b) => b.number - a.number).slice(0, 3);
  const stats = data.conditions.slice(0, 4);
  const recipe = published(data.recipes)[0];
  const stories = published(data.stories).slice(0, 2);
  const gear = published(data.gear).slice(0, 3);
  const pillars = [
    { title: "Weather Conditions", desc: "Hunt-day forecast, wind read, shoot light, and moon — organized by zone and refuge.", href: "/conditions", cta: "View conditions" },
    { title: "Season Dates & Regulations", desc: "Current CA seasons, zone dates, tag deadlines, and rule changes that matter.", href: "/regulations", cta: "View the board" },
    { title: "From Field to Table", desc: "Wild-game recipes worth the freezer space — now a standing section, not just a sidebar.", href: "/recipes", cta: "See recipes" },
    { title: "Gear Recommendations", desc: "Honest, field-tested gear and value picks. No junk, no hype.", href: "/gear", cta: "View gear" },
    { title: "Field Stories", desc: "Reader hunts, campfire tales, and lessons learned the hard way.", href: "/field-stories", cta: "Read stories" },
    { title: "Dog of the Week", desc: "A featured NorCal hunting dog and the story behind it, every week.", href: "/dog-of-the-week", cta: "Meet the dogs" },
  ];

  return (
    <>
      <SiteBanner />
      <SiteHeader />
      <section className="relative min-h-[440px] md:min-h-[580px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,28,18,0.25)] via-[rgba(20,28,18,0.72)] to-[rgba(20,28,18,0.78)]" />
        <div className="relative mx-auto flex min-h-[440px] max-w-[1180px] items-end px-6 pb-14 md:min-h-[580px]">
          <div>
            <div className="mb-3.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#E8A05C]">
              Built by hunters · Improved by hunters
            </div>
            <h1 className="mb-3.5 max-w-[720px] font-heading text-[clamp(44px,6.5vw,76px)] font-bold uppercase leading-[0.98] text-[#F7F2E4]">
              One inbox. Every NorCal hunt, handled.
            </h1>
            <p className="mb-6 max-w-[560px] font-serif text-[clamp(16px,1.6vw,19px)] leading-relaxed text-[#E4DCC6]">
              Weather, season dates, regulations, shoot times, and field-tested gear — one weekly briefing instead of five
              scattered websites.
            </p>
            <div className="flex flex-col gap-3.5">
              <SubscribeForm source="homepage-hero" align="start" tone="dark" />
              <Link href="/newsletters" className="w-fit border border-[#B7AE93] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#F0EAD8]">
                Read the newsletter
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t-[3px] border-[#C75B12] bg-[#24361F]">
        <div className="mx-auto grid max-w-[1180px] items-center gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((q) => (
            <div key={q.id} className="border-l border-[#3C5232] pl-4">
              <div className="mb-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.18em] text-[#9FB18B]">
                {q.label}
              </div>
              <div className="font-heading text-[20px] font-bold leading-tight text-[#F2EDDD]">{q.value}</div>
            </div>
          ))}
          <Link href="/conditions" className="font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#E8A05C] lg:justify-self-end">
            Full dashboard →
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-6 pt-16">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          Every week, you get
        </div>
        <h2 className="mb-3 font-heading text-[clamp(30px,3.6vw,42px)] font-bold uppercase leading-tight">
          What&apos;s inside every issue
        </h2>
        <p className="mb-9 max-w-[640px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
          We gather the crucial information a NorCal hunter needs — your one-stop shop before every trip.
        </p>
        <div className="grid gap-0.5 border-2 border-[#211D14] bg-[#211D14] sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <Link key={p.href} href={p.href} className="block bg-[#FBF8F0] p-6 hover:bg-[#F2ECDB]">
              <div className="mb-2 font-heading text-[21px] font-bold uppercase tracking-[0.03em] text-[#1C2B1A]">
                {p.title}
              </div>
              <div className="mb-3.5 font-serif text-[15px] leading-relaxed text-[#5C543F]">{p.desc}</div>
              <div className="font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#C75B12]">
                {p.cta} →
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-6 pt-16">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-heading text-[clamp(28px,3.2vw,38px)] font-bold uppercase">Latest briefings</h2>
          <Link href="/newsletters" className="font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
            Full archive →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {issues.map((it) => (
            <Link key={it.id} href={`/newsletters/${it.slug}`} className="block border border-[#D8CDB4] border-t-[3px] border-t-[#2F4A2C] bg-[#FBF8F0] p-6">
              <div className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-[#8A8163]">
                {it.date} · {it.read}
              </div>
              <div className="mb-2.5 font-heading text-[20px] font-semibold leading-snug text-[#1C2B1A]">{it.title}</div>
              <div className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{it.blurb}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-6 pt-16">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-heading text-[clamp(28px,3.2vw,38px)] font-bold uppercase">Know the ground</h2>
          <Link href="/zones" className="font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
            All zones →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {zones.slice(0, 3).map((zone) => (
            <Link key={zone.slug} href={`/zones/${zone.slug}`} className="block border border-[#D8CDB4] bg-[#FBF8F0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zone.image} alt="" className="h-[160px] w-full object-cover" />
              <div className="p-5">
                <div className="mb-1 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#C75B12]">{zone.kicker}</div>
                <div className="mb-2 font-heading text-[22px] font-bold uppercase">{zone.title}</div>
                <p className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{zone.lede}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-6 pt-12">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-heading text-[clamp(28px,3.2vw,38px)] font-bold uppercase">The year&apos;s animals</h2>
          <Link href="/species" className="font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
            All species →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {species.slice(0, 4).map((animal) => (
            <Link key={animal.slug} href={`/species/${animal.slug}`} className="border border-[#D8CDB4] bg-[#FBF8F0] p-4">
              <div className="font-heading text-[18px] font-bold uppercase text-[#1C2B1A]">{animal.title}</div>
              <div className="mt-1 font-serif text-[14px] leading-relaxed text-[#5C543F]">{animal.kicker}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-6 pt-12">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-heading text-[clamp(28px,3.2vw,38px)] font-bold uppercase">From the field</h2>
          <Link href="/field-stories" className="font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
            All stories →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <Link key={story.id} href={`/field-stories/${story.slug}`} className="block border border-[#D8CDB4] bg-[#FBF8F0] p-6">
              <div className="mb-2 text-[13px] uppercase tracking-[0.08em] text-[#8A8163]">{story.species}</div>
              <div className="mb-2 font-heading text-[24px] font-bold uppercase">{story.title}</div>
              <p className="font-serif text-[15px] leading-relaxed text-[#5C543F]">{story.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1180px] px-6 pt-12">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-heading text-[clamp(28px,3.2vw,38px)] font-bold uppercase">Gear we keep</h2>
          <Link href="/gear" className="font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]">
            All gear →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {gear.map((item) => (
            <Link key={item.id} href={`/gear/${item.slug}`} className="block border border-[#D8CDB4] bg-[#FBF8F0]">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="h-[150px] w-full object-cover" />
              ) : null}
              <div className="p-5">
                <div className="mb-1 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#C75B12]">{item.badge}</div>
                <div className="font-heading text-[20px] font-bold uppercase">{item.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {recipe ? (
        <section className="mx-auto max-w-[1180px] px-6 pt-4">
          <Link href={`/recipes/${recipe.slug}`} className="block border-2 border-[#211D14] bg-[#FBF8F0] p-6 md:p-8">
            <div className="mb-2 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
              From Field to Table
            </div>
            <h2 className="mb-2 font-heading text-[clamp(26px,3vw,36px)] font-bold uppercase">{recipe.title}</h2>
            <p className="max-w-[640px] font-serif text-[16px] leading-relaxed text-[#5C543F]">{recipe.lede}</p>
          </Link>
        </section>
      ) : null}
      <section className="mx-auto max-w-[1180px] px-6 py-16">
        <div className="border-2 border-[#211D14] bg-[#FBF8F0] px-8 py-12 text-center md:px-14">
          <h2 className="mb-2.5 font-heading text-[clamp(30px,4vw,46px)] font-bold uppercase">Join the Tuesday briefing</h2>
          <p className="mx-auto mb-6 max-w-[520px] font-serif text-[17px] leading-relaxed text-[#5C543F]">
            A five-minute read before every weekend in the field. 100% free, unsubscribe anytime.
          </p>
          <SubscribeForm source="homepage" align="center" />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
