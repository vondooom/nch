import type { Metadata } from "next";

export const CANONICAL_SITE_URL = "https://localhunts.co";

const LEGACY_HOSTS = new Set(["norcalhunts.com", "www.norcalhunts.com", "norcal-hunt.vercel.app"]);

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!configured) return CANONICAL_SITE_URL;
  try {
    const host = new URL(configured).host.toLowerCase();
    if (LEGACY_HOSTS.has(host)) return CANONICAL_SITE_URL;
  } catch {
    return CANONICAL_SITE_URL;
  }
  return configured;
}

/** Origin for redirects that leave the app. Public hosts always use https. */
export function originForRedirect(request: Request) {
  const rawHost = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  const host = rawHost.replace(/:\d+$/, "").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    const proto = (request.headers.get("x-forwarded-proto") ?? "http").split(",")[0].trim() || "http";
    return `${proto}://${rawHost}`;
  }
  if (!host || LEGACY_HOSTS.has(host)) return siteUrl();
  return `https://${host}`;
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
      title: `${title} · Local Hunts`,
      siteName: "Local Hunts",
      description,
      url,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
  };
}
