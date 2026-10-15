import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { seed } from "./seed";
import type { StoreData } from "./types";

function withSeed<T extends { id: string }>(rows: T[] | undefined, seeded: T[]): T[] {
  if (!rows) return structuredClone(seeded);
  const extras = new Map(seeded.map((row) => [row.id, row]));
  const merged = rows.map((row) => ({ ...(extras.get(row.id) ?? {}), ...row }));
  for (const row of seeded) {
    if (!rows.some((item) => item.id === row.id)) merged.push(row);
  }
  return merged;
}

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
      issues: withSeed(parsed.issues, seed.issues),
      stories: withSeed(parsed.stories, seed.stories),
      dogs: withSeed(parsed.dogs, seed.dogs),
      gear: withSeed(parsed.gear, seed.gear),
      locals: withSeed(parsed.locals, seed.locals),
      market: withSeed(parsed.market, seed.market),
      recipes: withSeed(parsed.recipes, seed.recipes),
      board: withSeed(parsed.board, seed.board),
      conditions: withSeed(parsed.conditions, seed.conditions),
      submissions: parsed.submissions ?? seed.submissions,
      subscribers: parsed.subscribers ?? seed.subscribers,
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
  const raw = String(formData.get("kind") || "story");
  const kind = raw === "dog" ? "dog" : raw === "contact" ? "contact" : "story";
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

export function recordSubscriber(email: string, source = "subscribe") {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return false;
  updateStore((data) => {
    data.subscribers ??= [];
    if (data.subscribers.some((row) => row.email === clean)) return;
    data.subscribers.unshift({
      id: newId("subr"),
      email: clean,
      createdAt: stamp(),
      source,
    });
  });
  return true;
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
    subscribers: (data.subscribers ?? []).length,
  };
}
