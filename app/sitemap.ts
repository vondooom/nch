import { species, zones } from "@/lib/guides";
import { absoluteUrl } from "@/lib/site";
import { getStore, published } from "@/lib/store";

export default function sitemap() {
  const data = getStore();
  const staticRoutes = [
    "/",
    "/newsletters",
    "/field-stories",
    "/field-stories/submit",
    "/recipes",
    "/gear",
    "/dog-of-the-week",
    "/dog-of-the-week/nominate",
    "/local-boys",
    "/showcase",
    "/bag-limits",
    "/marketplace",
    "/conditions",
    "/regulations",
    "/about",
    "/subscribe",
    "/zones",
    "/species",
    "/calendar",
    "/checklist",
    "/faq",
    "/privacy",
    "/contact",
  ].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const entries = [
    ...published(data.issues).map((item) => ({ url: absoluteUrl(`/newsletters/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...published(data.stories).map((item) => ({ url: absoluteUrl(`/field-stories/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...published(data.gear).map((item) => ({ url: absoluteUrl(`/gear/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...published(data.recipes).map((item) => ({ url: absoluteUrl(`/recipes/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...published(data.locals).map((item) => ({ url: absoluteUrl(`/local-boys/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...published(data.dogs).map((item) => ({ url: absoluteUrl(`/dog-of-the-week/${item.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...zones.map((item) => ({ url: absoluteUrl(`/zones/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...species.map((item) => ({ url: absoluteUrl(`/species/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];

  return [...staticRoutes, ...entries];
}
