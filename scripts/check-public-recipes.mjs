import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const recipes = [
  ["recipe-poppers", "bacon-wrapped-dove-poppers"],
  ["recipe-duck-pan", "pan-duck-breast"],
  ["recipe-quail", "grilled-quail"],
  ["recipe-pheasant", "valley-pheasant-and-wild-rice"],
  ["recipe-speck-fajitas", "speck-fajitas"],
  ["recipe-wild-duck-leg-confit", "wild-duck-leg-confit"],
  ["recipe-how-to-pluck-and-wax-a-duck", "how-to-pluck-and-wax-a-duck"],
];

// Generate intentionally stale saved rows. Start the built app with DATA_FILE
// pointing here, then run this script without --fixture to test the public UI.
if (process.argv[2] === "--fixture") {
  writeFileSync(process.argv[3], JSON.stringify({
    recipes: recipes.map(([id, slug]) => ({
      id, slug, status: "published",
      lede: "STALE_RECIPE_SENTINEL warm pink center",
      need: ["STALE_RECIPE_SENTINEL"],
      method: [{ h: "STALE_RECIPE_SENTINEL", t: "Pull it medium-rare" }],
      note: "STALE_RECIPE_SENTINEL rosy goose",
    })),
  }));
  process.exit(0);
}

const base = process.env.BASE_URL || "http://127.0.0.1:43181";
const unsafe = /STALE_RECIPE_SENTINEL|warm pink center|center pink|still rosy|medium-rare|rosy goose|breast should still give/i;
async function read(path) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  return response.text();
}

for (const [id, slug] of recipes) {
  for (const route of [slug, id]) {
    const path = `/recipes/${route}`;
    const html = await read(path);
    assert(!unsafe.test(html), `${path}: stale advice in visible content, metadata, or RSC`);
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    assert(match, `${path}: missing recipe structured data`);
    const data = JSON.parse(match[1]);
    assert(data.description.includes("165°F (74°C)"), `${path}: teaser/metadata not corrected`);
    assert(data.recipeIngredient.some((item) => /food thermometer/i.test(item)), `${path}: equipment missing`);
    const method = data.recipeInstructions.map((step) => step.text).join(" ");
    for (const text of ["165°F (74°C)", "food thermometer", "thickest", "avoiding bone"]) {
      assert(method.includes(text), `${path}: method missing ${text}`);
    }
    if (slug === "bacon-wrapped-dove-poppers") {
      assert(method.includes("Both meat and filling must reach 165°F (74°C)"));
      assert(method.includes("Bacon appearance"));
    }
    console.log(`PASS ${path}: method, equipment, teaser, metadata and structured data`);
  }
}
for (const path of ["/", "/recipes", "/species/dove"]) {
  const html = await read(path);
  assert(!unsafe.test(html), `${path}: stale teaser`);
  assert(html.includes("165°F (74°C)") && html.includes("food thermometer"), `${path}: missing guidance`);
  console.log(`PASS ${path}: public teaser`);
}

const archive = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../lib/archive.json", import.meta.url), "utf8"));
for (const issue of archive.issues.filter((item) => [3, 13, 16, 17, 20, 21, 22, 23].includes(item.number))) {
  const html = await read(`/newsletters/${issue.slug}`);
  assert(html.includes("Archived recipe correction") && html.includes("Current corrected recipes"));
  const notice = html.indexOf("Archived recipe correction");
  const oldAdvice = html.search(/warm pink center|medium-rare|rosy goose/i);
  assert(oldAdvice < 0 || notice < oldAdvice, `Issue ${issue.number}: correction must precede old advice`);
  console.log(`PASS archive #${issue.number}: correction before original recipe`);
}
const unrelated = await read("/recipes/venison-chili");
assert(!unrelated.includes("Game-bird cooking guidance"), "Unrelated recipe changed");
console.log("PASS unrelated venison recipe remains outside correction");
