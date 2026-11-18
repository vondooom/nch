import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Local Hunts",
    short_name: "Local Hunts",
    description: "Weekly intel for the Northern California hunter. A free briefing every Sunday at 7am.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F1E8",
    theme_color: "#1C2B1A",
  };
}
