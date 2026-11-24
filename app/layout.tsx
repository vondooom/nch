import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const barlow = localFont({
  src: [
    { path: "./fonts/barlow-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/barlow-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/barlow-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const heading = localFont({
  src: [
    { path: "./fonts/barlow-condensed-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/barlow-condensed-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/barlow-condensed-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
});

const serif = localFont({
  src: [
    { path: "./fonts/latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/latin-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Local Hunts",
  openGraph: { siteName: "Local Hunts", url: siteUrl() },
  title: {
    default: "Local Hunts · One inbox. Every local hunt, handled.",
    template: "%s · Local Hunts",
  },
  description:
    "Weekly intel for hunters in all 50 states. A free briefing every Sunday at 7am, with weather, season dates when we can quote the agency, regulations, shoot times, and field-tested gear.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${heading.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#F5F1E8] font-sans text-[#211D14]">{children}</body>
    </html>
  );
}
