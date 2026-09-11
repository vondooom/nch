import type { Metadata } from "next";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://norcal-hunt.vercel.app").replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function pageMeta({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — NorCalHunt`,
      description,
      url,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
  };
}
