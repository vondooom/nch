export function RichBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="grid gap-4 font-serif text-[17px] leading-[1.75] text-[#3B3526]">
      {blocks.map((block, index) => {
        const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(block);
        if (image) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={index} src={image[2]} alt={image[1]} className="w-full border border-[#D8CDB4] object-cover" />
          );
        }
        if (block.startsWith("### ")) {
          return (
            <h3 key={index} className="mt-2 font-heading text-[22px] font-bold uppercase leading-tight text-[#1C2B1A]">
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="mt-4 font-heading text-[28px] font-bold uppercase leading-tight text-[#1C2B1A]">
              {block.slice(3)}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={index} className="grid list-disc gap-1 pl-5">
              {lines.map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => /^\d+\.\s/.test(line))) {
          return (
            <ol key={index} className="grid list-decimal gap-1 pl-5">
              {lines.map((line) => (
                <li key={line}>{line.replace(/^\d+\.\s/, "")}</li>
              ))}
            </ol>
          );
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}
