import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Source_Serif_4 } from "next/font/google";
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

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "NorCalHunt — One inbox. Every NorCal hunt, handled.",
    template: "%s — NorCalHunt",
  },
  description:
    "Weekly intel for the Northern California hunter. Weather, season dates, regulations, shoot times, and field-tested gear.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${heading.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#F5F1E8] font-sans text-[#211D14]">{children}</body>
    </html>
  );
}
