import { SiteBanner, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getStore, published } from "@/lib/store";

export const metadata = { title: "Regulations" };

export default function RegulationsPage() {
  const board = published(getStore().board);
  return (
    <>
      <SiteBanner />
      <SiteHeader current="/regulations" />
      <section className="mx-auto max-w-[900px] px-6 py-12 pb-20">
        <div className="mb-2.5 font-heading text-[14px] font-semibold uppercase tracking-[0.22em] text-[#C75B12]">
          The Board
        </div>
        <h1 className="mb-4 font-heading text-[clamp(36px,5vw,56px)] font-bold uppercase leading-none">
          Season dates, deadlines, and the rules that bite
        </h1>
        <p className="mb-10 font-serif text-[17px] leading-relaxed text-[#5C543F]">
          The same board that used to live only inside Tuesday&apos;s issue. Editors keep it current; verify every date
          with CDFW before you leave the house.
        </p>
        <div className="grid gap-3">
          {board.map((b) => (
            <div key={b.id} className="grid grid-cols-[4px_1fr] gap-4 border border-[#D8CDB4] bg-[#FBF8F0] p-5">
              <div className={b.kind === "deadline" ? "bg-[#C75B12]" : b.kind === "open" ? "bg-[#2F4A2C]" : "bg-[#8A8163]"} />
              <div>
                <div className="mb-1 font-heading text-[20px] font-bold uppercase text-[#1C2B1A]">{b.label}</div>
                <div className="font-serif text-[16px] leading-relaxed text-[#3B3526]">{b.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter compact />
    </>
  );
}
