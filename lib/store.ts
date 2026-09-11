import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { seed } from "./seed";
import type { StoreData } from "./types";

function dataPath() {
  if (process.env.DATA_FILE) return process.env.DATA_FILE;
  if (process.env.VERCEL) return "/tmp/norcal-hunt-store.json";
  return join(process.cwd(), ".data", "store.json");
}

function readStore(): StoreData {
  try {
    const raw = readFileSync(/*turbopackIgnore: true*/ dataPath(), "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    return {
      ...seed,
      ...parsed,
      issues: parsed.issues ?? seed.issues,
      stories: parsed.stories ?? seed.stories,
      dogs: parsed.dogs ?? seed.dogs,
      gear: parsed.gear ?? seed.gear,
      locals: parsed.locals ?? seed.locals,
      market: parsed.market ?? seed.market,
      recipes: parsed.recipes ?? seed.recipes,
      board: parsed.board ?? seed.board,
      conditions: parsed.conditions ?? seed.conditions,
      submissions: parsed.submissions ?? seed.submissions,
    };
  } catch {
    return structuredClone(seed);
  }
}

function writeStore(data: StoreData) {
  const file = dataPath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(/*turbopackIgnore: true*/ file, JSON.stringify(data, null, 2));
}

export function getStore(): StoreData {
  noStore();
  return readStore();
}

export function updateStore(mutator: (data: StoreData) => void): StoreData {
  const data = readStore();
  mutator(data);
  writeStore(data);
  return data;
}

export function published<T extends { status: string }>(items: T[]): T[] {
  return items.filter((item) => item.status === "published");
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function stamp() {
  return new Date().toISOString();
}

export function recordPublicSubmission(formData: FormData) {
  const kind = String(formData.get("kind") || "story") === "dog" ? "dog" : "story";
  updateStore((data) => {
    data.submissions.unshift({
      id: newId("sub"),
      kind,
      name: String(formData.get("name") || "").trim() || "Anonymous",
      email: String(formData.get("email") || "").trim(),
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      createdAt: stamp(),
      state: "new",
    });
  });
  return kind;
}

export function dashboardCounts() {
  const data = getStore();
  return {
    drafts:
      data.issues.filter((i) => i.status === "draft").length +
      data.stories.filter((i) => i.status === "draft").length +
      data.dogs.filter((i) => i.status === "draft").length +
      data.recipes.filter((i) => i.status === "draft").length,
    publishedIssues: data.issues.filter((i) => i.status === "published").length,
    openSubmissions: data.submissions.filter((s) => s.state === "new").length,
    recipes: data.recipes.filter((i) => i.status === "published").length,
  };
}
