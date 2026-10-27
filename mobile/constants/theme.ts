// NorCalHunt · brand tokens
//
// One dark palette, tuned for a blind at 5:40 AM: a deep marsh charcoal that
// doesn't glow, mallard amber for the things you need to find fast (score,
// shoot time, the bearing back to the truck), and cream type with enough
// contrast to read through a fogged pair of glasses. The amber/orange family
// comes straight from the website (#C75B12 / #E8A05C on #1C2B1A), pushed
// brighter so it carries on a black screen.
//
// Like Pear, this is a build-time palette: screens call StyleSheet.create at
// module scope, so these values are snapshotted at import.

import { Platform, TextStyle } from "react-native";

export const colors = {
  // surfaces
  bg: "#0d1410",            // deep marsh — page background
  bgElevated: "#152019",    // raised card
  bgSunken: "#0a100c",      // inset fields, HUD wells
  bgOverlay: "rgba(5,9,7,0.86)",

  // text
  ink: "#ece6d2",           // warm cream — body text
  inkStrong: "#f7f2e4",     // headings, big numerals
  inkMuted: "#a39d86",      // secondary copy
  inkFaint: "#6f705f",      // captions, timestamps

  // accents
  accent: "#e09f3e",        // mallard gold — primary accent
  accentDeep: "#d97706",    // amber — pressed, emphasis, progress fills
  accentSoft: "#2a2112",    // amber tint surface
  onAccent: "#120d04",      // type on an amber fill
  rust: "#c75b12",          // website primary — section markers

  // signal
  good: "#7fb069",          // in-range, legal window open
  goodSoft: "#17251a",
  warn: "#f2b134",          // approaching a limit
  danger: "#e5533d",        // over a limit, shoot light not yet
  dangerSoft: "#2c1510",
  water: "#2f5d62",         // ponds on the tactical map
  waterDeep: "#1d3b3f",
  tule: "#3c5a3a",          // tule / vegetation edges
  trail: "#f2b134",

  // structural
  border: "#26332a",
  borderStrong: "#3a4b3e",
  hairline: "#1b261f",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;

// Barlow Condensed is the website's heading face. Body copy stays on the
// platform sans — it renders crisper at small sizes on a dimmed screen.
export const fonts = {
  heading: "BarlowCondensed_700Bold",
  headingSemi: "BarlowCondensed_600SemiBold",
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, Menlo, Consolas, monospace" }),
} as const;

export const type: Record<"eyebrow" | "h1" | "h2" | "h3" | "body" | "caption" | "numeral", TextStyle> = {
  eyebrow: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: colors.accent,
  },
  h1: { fontFamily: fonts.heading, fontSize: 34, color: colors.inkStrong, textTransform: "uppercase", letterSpacing: 0.5 },
  h2: { fontFamily: fonts.heading, fontSize: 24, color: colors.inkStrong, textTransform: "uppercase", letterSpacing: 0.4 },
  h3: { fontFamily: fonts.headingSemi, fontSize: 18, color: colors.inkStrong, letterSpacing: 0.3 },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  caption: { fontSize: 12, lineHeight: 16, color: colors.inkMuted },
  numeral: { fontFamily: fonts.heading, color: colors.inkStrong, fontVariant: ["tabular-nums"] },
};
