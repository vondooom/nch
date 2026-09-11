"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canDelete, canPublish, clearSession, createSession, requireSession, staffAccounts } from "./auth";
import { getStore, newId, recordPublicSubmission, stamp, updateStore } from "./store";
import type { PublishStatus, Role } from "./types";

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/newsletters");
  revalidatePath("/field-stories");
  revalidatePath("/dog-of-the-week");
  revalidatePath("/gear");
  revalidatePath("/local-boys");
  revalidatePath("/marketplace");
  revalidatePath("/recipes");
  revalidatePath("/regulations");
  revalidatePath("/conditions");
  revalidatePath("/admin");
}

const COLLECTIONS = ["issues", "stories", "dogs", "gear", "locals", "market", "recipes", "board"] as const;
type Collection = (typeof COLLECTIONS)[number];

function asStatus(value: FormDataEntryValue | null): PublishStatus {
  return value === "published" ? "published" : "draft";
}

function resolveStatus(role: Role, requested: PublishStatus, existing?: PublishStatus): PublishStatus {
  if (!canPublish(role)) return existing ?? "draft";
  return requested;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const account = staffAccounts().find((a) => a.email === email && a.password === password);
  if (!account) {
    redirect("/sign-in?error=1");
  }
  await createSession({ email: account.email, name: account.name, role: account.role });
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/sign-in");
}

export async function subscribeAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  redirect(ok ? "/subscribe?ok=1" : "/subscribe?error=1");
}

export async function submitPublicAction(formData: FormData) {
  const kind = recordPublicSubmission(formData);
  revalidatePath("/admin/submissions");
  redirect(kind === "dog" ? "/dog-of-the-week/nominate?ok=1" : "/field-stories/submit?ok=1");
}

export async function saveIssueAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("issue"));
  const existing = getStore().issues.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      number: Number(formData.get("number") || 0),
      slug: String(formData.get("slug") || id),
      title: String(formData.get("title") || "Untitled"),
      blurb: String(formData.get("blurb") || ""),
      date: String(formData.get("date") || ""),
      read: String(formData.get("read") || "5 min read"),
      body: String(formData.get("body") || ""),
      image: String(formData.get("image") || "") || undefined,
      status,
      updatedAt: stamp(),
    };
    const idx = data.issues.findIndex((i) => i.id === id);
    if (idx >= 0) data.issues[idx] = next;
    else data.issues.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/issues");
}

export async function saveStoryAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("story"));
  const existing = getStore().stories.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      slug: String(formData.get("slug") || id),
      title: String(formData.get("title") || "Untitled"),
      author: String(formData.get("author") || ""),
      date: String(formData.get("date") || ""),
      species: String(formData.get("species") || ""),
      excerpt: String(formData.get("excerpt") || ""),
      body: String(formData.get("body") || ""),
      image: String(formData.get("image") || "") || undefined,
      status,
      updatedAt: stamp(),
    };
    const idx = data.stories.findIndex((i) => i.id === id);
    if (idx >= 0) data.stories[idx] = next;
    else data.stories.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/stories");
}

export async function saveDogAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("dog"));
  const existing = getStore().dogs.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      name: String(formData.get("name") || "Unnamed"),
      breed: String(formData.get("breed") || ""),
      week: String(formData.get("week") || ""),
      story: String(formData.get("story") || ""),
      image: String(formData.get("image") || "") || undefined,
      credit: String(formData.get("credit") || "") || undefined,
      status,
      updatedAt: stamp(),
    };
    const idx = data.dogs.findIndex((i) => i.id === id);
    if (idx >= 0) data.dogs[idx] = next;
    else data.dogs.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/dogs");
}

export async function saveGearAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("gear"));
  const existing = getStore().gear.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      name: String(formData.get("name") || "Untitled"),
      category: String(formData.get("category") || "Gear"),
      badge: String(formData.get("badge") || ""),
      why: String(formData.get("why") || ""),
      price: String(formData.get("price") || ""),
      issue: String(formData.get("issue") || ""),
      status,
      updatedAt: stamp(),
    };
    const idx = data.gear.findIndex((i) => i.id === id);
    if (idx >= 0) data.gear[idx] = next;
    else data.gear.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/gear");
}

export async function saveRecipeAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("recipe"));
  const existing = getStore().recipes.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      slug: String(formData.get("slug") || id),
      title: String(formData.get("title") || "Untitled"),
      lede: String(formData.get("lede") || ""),
      need: String(formData.get("need") || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      method: String(formData.get("method") || "")
        .split("\n")
        .map((line) => {
          const [h, ...rest] = line.split(":");
          return { h: h.trim(), t: rest.join(":").trim() };
        })
        .filter((m) => m.h),
      note: String(formData.get("note") || "") || undefined,
      status,
      updatedAt: stamp(),
    };
    const idx = data.recipes.findIndex((i) => i.id === id);
    if (idx >= 0) data.recipes[idx] = next;
    else data.recipes.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/recipes");
}

export async function saveBoardAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("board"));
  const existing = getStore().board.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      label: String(formData.get("label") || "Untitled"),
      detail: String(formData.get("detail") || ""),
      kind: (["open", "deadline", "watch"].includes(String(formData.get("kind")))
        ? String(formData.get("kind"))
        : "watch") as "open" | "deadline" | "watch",
      status,
      updatedAt: stamp(),
    };
    const idx = data.board.findIndex((i) => i.id === id);
    if (idx >= 0) data.board[idx] = next;
    else data.board.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/board");
}

export async function saveLocalAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("local"));
  const existing = getStore().locals.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      group: String(formData.get("group") || "Guides & Outfitters"),
      name: String(formData.get("name") || "Untitled"),
      where: String(formData.get("where") || ""),
      desc: String(formData.get("desc") || ""),
      featured: formData.get("featured") === "on",
      status,
      updatedAt: stamp(),
    };
    const idx = data.locals.findIndex((i) => i.id === id);
    if (idx >= 0) data.locals[idx] = next;
    else data.locals.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/locals");
}

export async function saveMarketAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || newId("mkt"));
  const existing = getStore().market.find((item) => item.id === id);
  const status = resolveStatus(session.role, asStatus(formData.get("status")), existing?.status);
  updateStore((data) => {
    const next = {
      id,
      cat: String(formData.get("cat") || "Gear"),
      where: String(formData.get("where") || ""),
      title: String(formData.get("title") || "Untitled"),
      desc: String(formData.get("desc") || ""),
      price: String(formData.get("price") || ""),
      status,
      updatedAt: stamp(),
    };
    const idx = data.market.findIndex((i) => i.id === id);
    if (idx >= 0) data.market[idx] = next;
    else data.market.unshift(next);
  });
  revalidatePublic();
  redirect("/admin/market");
}

export async function saveConditionAction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  updateStore((data) => {
    const row = data.conditions.find((c) => c.id === id);
    if (!row) return;
    row.label = String(formData.get("label") || row.label);
    row.value = String(formData.get("value") || row.value);
    row.updatedAt = stamp();
  });
  revalidatePublic();
  redirect("/admin/conditions");
}

export async function addConditionAction(formData: FormData) {
  await requireSession();
  updateStore((data) => {
    data.conditions.push({
      id: newId("c"),
      label: String(formData.get("label") || "New stat"),
      value: String(formData.get("value") || ""),
      updatedAt: stamp(),
    });
  });
  revalidatePublic();
  redirect("/admin/conditions");
}

export async function deleteRecordFormAction(formData: FormData) {
  const session = await requireSession();
  if (!canDelete(session.role)) {
    throw new Error("Only admins can delete.");
  }
  const collection = String(formData.get("collection")) as Collection;
  const id = String(formData.get("id"));
  if (!COLLECTIONS.includes(collection) || !id) return;
  updateStore((data) => {
    switch (collection) {
      case "issues":
        data.issues = data.issues.filter((row) => row.id !== id);
        break;
      case "stories":
        data.stories = data.stories.filter((row) => row.id !== id);
        break;
      case "dogs":
        data.dogs = data.dogs.filter((row) => row.id !== id);
        break;
      case "gear":
        data.gear = data.gear.filter((row) => row.id !== id);
        break;
      case "locals":
        data.locals = data.locals.filter((row) => row.id !== id);
        break;
      case "market":
        data.market = data.market.filter((row) => row.id !== id);
        break;
      case "recipes":
        data.recipes = data.recipes.filter((row) => row.id !== id);
        break;
      case "board":
        data.board = data.board.filter((row) => row.id !== id);
        break;
    }
  });
  revalidatePublic();
}

export async function reviewSubmissionAction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  const state = String(formData.get("state")) === "accepted" ? "accepted" : "declined";
  updateStore((data) => {
    const row = data.submissions.find((s) => s.id === id);
    if (row) row.state = state;
  });
  revalidatePath("/admin/submissions");
}

export async function promoteSubmissionAction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  let dest = "/admin/stories";
  updateStore((data) => {
    const row = data.submissions.find((s) => s.id === id);
    if (!row) return;
    row.state = "accepted";
    if (row.kind === "dog") {
      dest = "/admin/dogs";
      data.dogs.unshift({
        id: newId("dog"),
        name: row.title.split(",")[0]?.trim() || row.title,
        breed: row.title.split(",").slice(1).join(",").trim(),
        week: "Inbox draft",
        story: row.body,
        status: "draft",
        updatedAt: stamp(),
      });
    } else {
      data.stories.unshift({
        id: newId("story"),
        slug: newId("story"),
        title: row.title,
        author: `${row.name} · reader`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        species: "Field story",
        excerpt: row.body.slice(0, 200),
        body: row.body,
        status: "draft",
        updatedAt: stamp(),
      });
    }
  });
  revalidatePublic();
  redirect(dest);
}

