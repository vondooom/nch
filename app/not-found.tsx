import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F1E8] px-6 py-12 text-center">
      <div>
        <div className="mb-7 font-heading text-[28px] font-bold tracking-[0.02em]">
          NORCAL<span className="text-[#C75B12]">HUNT</span>
        </div>
        <h1 className="mb-3.5 font-heading text-[clamp(42px,8vw,72px)] font-bold uppercase">Trail went cold</h1>
        <p className="mx-auto mb-7 max-w-[420px] font-serif text-[18px] leading-relaxed text-[#5C543F]">
          That page isn&apos;t on this ridge. Head back to the briefing.
        </p>
        <Link href="/" className="inline-block bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
          Back to NorCalHunt
        </Link>
      </div>
    </main>
  );
}
