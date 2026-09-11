import { absoluteUrl } from "@/lib/site";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/sign-in", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
