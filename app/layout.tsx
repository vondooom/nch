import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import localFont from "next/font/local";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const heading = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
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
