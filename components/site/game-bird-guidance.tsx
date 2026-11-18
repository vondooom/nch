import Link from "next/link";

export function GameBirdGuidance({ archived = false }: { archived?: boolean }) {
  return (
    <aside className="my-6 border-l-4 border-[#C75B12] bg-[#FBF8F0] p-5 font-serif text-[15px] leading-relaxed text-[#3B3526]" aria-label="Game-bird cooking guidance">
      <p>
        <strong>{archived ? "Archived recipe correction" : "Game-bird cooking guidance"} · November 18, 2026.</strong>{" "}
        Cook all game-bird meat to 165°F (74°C), measured with a food thermometer in the thickest part, avoiding bone.
        Check the filling in stuffed poppers reaches 165°F (74°C) too. Color, texture, and bacon appearance cannot establish safety.
        {archived ? " This briefing is an archive; use this guidance and the corrected recipes instead of older doneness advice below." : " This guidance applies to everyone at the table."}
      </p>
      <p className="mt-2">
        Sources: <a className="underline" href="https://www.cdc.gov/bird-flu/risk-factors/hunters-and-bird-flu.html">CDC game-bird guidance</a>,{" "}
        <a className="underline" href="https://ask.fsis.usda.gov/article/How-to-use-a-food-thermometer">USDA thermometer placement</a>,{" "}
        <a className="underline" href="https://www.cdc.gov/food-safety/prevention/index.html">CDC safe cooking</a>.
        {archived ? <> <Link href="/recipes" className="underline">Current corrected recipes →</Link></> : null}
      </p>
    </aside>
  );
}
