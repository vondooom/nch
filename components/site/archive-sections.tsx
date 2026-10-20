import type { ArchiveSection } from "@/lib/archive";

export function ArchiveSections({ sections }: { sections: ArchiveSection[] }) {
  return (
    <div className="grid gap-10">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 font-heading text-[clamp(26px,3vw,34px)] font-bold uppercase leading-tight text-[#1C2B1A]">
            {section.title}
          </h2>
          <div className="grid gap-3 font-serif text-[17px] leading-[1.7] text-[#3B3526]">
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.title}-${index}`}>{paragraph}</p>
            ))}
          </div>
          {section.bullets.length ? (
            <ul className="mt-3 grid list-disc gap-1.5 pl-5 font-serif text-[16px] leading-relaxed text-[#3B3526]">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
