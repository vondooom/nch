// Snapshot the website's newsletter archive into the app bundle.
//
// Reads ../lib/archive.json (the Next.js site's imported Beehiiv archive — never
// written to) and emits data/dispatches.json with just what the Field Desk
// reader needs. Re-run after the site imports new issues:
//
//     npm run data:dispatches
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const archive = JSON.parse(readFileSync(join(here, "../../lib/archive.json"), "utf8"));
const SITE = "https://norcal-hunt.vercel.app";
const abs = (p) => (p ? (p.startsWith("http") ? p : SITE + p) : "");

const WATERFOWL = /duck|goose|geese|widgeon|pintail|teal|mallard|waterfowl|refuge|blind|decoy|marsh|spec/i;

const issues = archive.issues
  .filter((i) => i.status === "published")
  .sort((a, b) => b.number - a.number)
  .map((i) => ({
    id: `issue-${i.number}`,
    kind: "issue",
    title: i.title,
    blurb: i.blurb,
    date: i.date,
    read: i.read,
    byline: `Issue #${i.number}`,
    image: abs(i.image),
    waterfowl: WATERFOWL.test(i.title + i.blurb),
    body: i.body,
    url: `${SITE}/newsletters/${i.slug}`,
  }));

const stories = archive.stories
  .filter((s) => s.status === "published")
  .map((s) => ({
    id: s.id,
    kind: "story",
    title: s.title,
    blurb: s.excerpt,
    date: s.date,
    read: `${Math.max(1, Math.round(s.body.split(/\s+/).length / 220))} min read`,
    byline: s.author,
    image: abs(s.image),
    waterfowl: s.species === "Waterfowl" || WATERFOWL.test(s.title + s.excerpt),
    body: s.body,
    url: `${SITE}/field-stories/${s.slug}`,
  }));

writeFileSync(
  join(here, "../data/dispatches.json"),
  JSON.stringify({ generatedFrom: "lib/archive.json", issues, stories }, null, 1) + "\n",
);
console.log(`dispatches: ${issues.length} issues, ${stories.length} stories`);
