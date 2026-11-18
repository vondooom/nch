import type { NextConfig } from "next";

const CANONICAL_ORIGIN = "https://localhunts.co";

const legacyHosts = ["norcalhunts.com", "www.norcalhunts.com", "norcal-hunt.vercel.app"];

function hostRedirect(host: string, source: string, destination: string) {
  return {
    source,
    has: [{ type: "host" as const, value: host }],
    destination,
    permanent: true,
  };
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "media.beehiiv.com" },
    ],
  },
  async redirects() {
    const fromLegacyHosts = legacyHosts.flatMap((host) => [
      hostRedirect(host, "/", CANONICAL_ORIGIN),
      hostRedirect(host, "/:path+", `${CANONICAL_ORIGIN}/:path+`),
    ]);
    return [
      ...fromLegacyHosts,
      {
        source: "/",
        has: [
          { type: "host", value: "localhunts.co" },
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: CANONICAL_ORIGIN,
        permanent: true,
      },
      {
        source: "/:path+",
        has: [
          { type: "host", value: "localhunts.co" },
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: `${CANONICAL_ORIGIN}/:path+`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
