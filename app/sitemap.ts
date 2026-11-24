import { regions } from "@/lib/geo/regions";
import { states } from "@/lib/geo/states";
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
    "/hunt",
    "/map",
    "/hunt/idaho/deer-elk",
    "/hunt/wyoming/deer-elk",
    ...states.map((item) => `/hunt/${item.slug}`),
    ...regions.map((region) => `/regions/${region.slug}`),
    ...states.filter((item) => zones.some((zone) => zone.state === item.slug)).map((item) => `/hunt/${item.slug}/zones`),
    ...states.filter((item) => species.some((animal) => animal.state === item.slug)).map((item) => `/hunt/${item.slug}/species`),
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
    ...zones.map((item) => ({ url: absoluteUrl(`/hunt/${item.state}/zones/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...species.map((item) => ({ url: absoluteUrl(`/hunt/${item.state}/species/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];

  return [...staticRoutes, ...entries];
}
