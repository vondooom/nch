import { defineConfig } from "vite";

const pages = [
  "index",
  "about",
  "conditions",
  "dog-of-the-week",
  "field-stories",
  "gear",
  "issue-13",
  "local-boys",
  "marketplace",
  "newsletters",
  "regulations",
  "subscribe",
  "404",
] as const;

export default defineConfig({
  appType: "mpa",
  server: {
    host: "0.0.0.0",
    port: 43180,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 43180,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((name) => [name, `./${name}.html`])),
    },
  },
});
