import Link from "next/link";
import { getSession } from "@/lib/auth";

const nav = [
  ["Conditions", "/conditions"],
  ["Regs", "/regulations"],
  ["Newsletters", "/newsletters"],
  ["Stories", "/field-stories"],
  ["Recipes", "/recipes"],
  ["Gear", "/gear"],
  ["Local Boys", "/local-boys"],
  ["Dogs", "/dog-of-the-week"],
  ["Marketplace", "/marketplace"],
  ["About", "/about"],
] as const;

export function SiteBanner() {
  return (
    <div className="bg-[#1C2B1A] px-4 py-2 text-center text-[12px] font-medium uppercase tracking-[0.14em] text-[#D9D2BA]">
      Weekly intel for the Northern California hunter · 100% free · Every Tuesday
    </div>
  );
}

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#211D14] bg-[#F5F1E8]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-6 py-3.5">
        <Link href="/" className="font-heading text-[30px] font-bold leading-none tracking-[0.02em] text-[#1C2B1A]">
          NORCAL<span className="text-[#C75B12]">HUNT</span>
        </Link>
        <nav className="ml-auto flex flex-wrap items-center gap-4 font-heading text-[15px] font-semibold uppercase tracking-[0.09em]">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={
                current === href
                  ? "border-b-2 border-[#C75B12] pb-0.5 text-[#C75B12]"
                  : "text-[#211D14] hover:text-[#C75B12]"
              }
            >
              {label}
            </Link>
          ))}
          <Link href="/subscribe" className="bg-[#C75B12] px-4 py-2 text-[#FFF6E8]">
            Subscribe
          </Link>
          <StaffLink />
        </nav>
      </div>
    </header>
  );
}

async function StaffLink() {
  const session = await getSession();
  if (session) {
    return (
      <Link href="/admin" className="text-[#2F4A2C] hover:text-[#C75B12]">
        Desk
      </Link>
    );
  }
  return (
    <Link href="/sign-in" className="text-[#8A8163] hover:text-[#C75B12]">
      Staff
    </Link>
  );
}

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="mt-auto bg-[#1C2B1A] text-[#B9B199]">
      {!compact ? (
        <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 font-heading text-[26px] font-bold leading-none tracking-[0.02em] text-[#F7F2E4]">
              NORCAL<span className="text-[#C75B12]">HUNT</span>
            </div>
            <p className="font-serif text-[15px] leading-relaxed">One inbox. Every NorCal hunt, handled.</p>
          </div>
          <div>
            <div className="mb-3.5 font-heading text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8FA07C]">
              Explore
            </div>
            <div className="grid gap-2 text-[15px] font-medium">
              {nav.slice(0, 8).map(([label, href]) => (
                <Link key={href} href={href} className="text-[#D9D2BA] hover:text-[#C75B12]">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3.5 font-heading text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8FA07C]">
              The network
            </div>
            <p className="mb-2.5 font-serif text-[15px] leading-relaxed">
              NorCalHunt is edition one of <span className="text-[#F7F2E4]">Local Boys Hunt</span> — local hunters
              delivering local intel, region by region.
            </p>
            <p className="text-[13px] font-medium text-[#7E7660]">SoCal · Oregon · Nevada · more to come</p>
          </div>
          <div>
            <div className="mb-3.5 font-heading text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8FA07C]">
              The briefing
            </div>
            <p className="mb-4 font-serif text-[15px] leading-relaxed">Every Tuesday. 100% free. Unsubscribe anytime.</p>
            <Link href="/subscribe" className="inline-block bg-[#C75B12] px-5 py-2.5 font-heading text-[15px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
              Subscribe
            </Link>
          </div>
        </div>
      ) : null}
      <div className="border-t border-[#33422F] px-6 py-4 text-center text-[13px] font-medium text-[#7E7660]">
        © 2026 NorCalHunt · Independently owned and operated · Hunt legal, hunt safe — always verify with CDFW
      </div>
    </footer>
  );
}

export function PageHero({
  kicker,
  title,
  lede,
  image,
}: {
  kicker: string;
  title: string;
  lede: string;
  image?: string;
}) {
  return (
    <section className="relative min-h-[300px] md:min-h-[420px]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[#1C2B1A]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,28,18,0.2)] to-[rgba(20,28,18,0.8)]" />
      <div className="relative mx-auto flex min-h-[300px] max-w-[1180px] items-end px-6 pb-11 md:min-h-[420px]">
        <div>
          <div className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#E8A05C]">
            {kicker}
          </div>
          <h1 className="mb-2 font-heading text-[clamp(40px,6vw,68px)] font-bold uppercase leading-none text-[#F7F2E4]">
            {title}
          </h1>
          <p className="max-w-[560px] font-serif text-[18px] leading-relaxed text-[#E4DCC6]">{lede}</p>
        </div>
      </div>
    </section>
  );
}
