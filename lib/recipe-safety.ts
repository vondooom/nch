import { seed } from "./seed";
import type { Recipe } from "./types";

const correctedSlugs = new Set([
  "bacon-wrapped-dove-poppers",
  "pan-duck-breast",
  "grilled-quail",
  "valley-pheasant-and-wild-rice",
  "speck-fajitas",
  "wild-duck-leg-confit",
  "how-to-pluck-and-wax-a-duck",
]);

const corrections = seed.recipes.filter((recipe) => correctedSlugs.has(recipe.slug));

// Persisted rows can contain superseded cooking advice. Apply the reviewed
// cooking copy at every public recipe read, including teasers and metadata.
// Match both identities so legacy ID routes and renamed saved slugs stay safe.
// Keep publication state, images, and other staff-managed fields intact.
export function publicRecipes(rows: Recipe[]): Recipe[] {
  return rows.map((row) => {
    const correction = corrections.find((recipe) => recipe.id === row.id || recipe.slug === row.slug);
    if (!correction) return row;
    return {
      ...row,
      lede: correction.lede,
      need: correction.need,
      method: correction.method,
      note: correction.note,
    };
  });
}

export function hasGameBirdCorrection(recipe: Recipe): boolean {
  return corrections.some((item) => item.id === recipe.id || item.slug === recipe.slug);
}
