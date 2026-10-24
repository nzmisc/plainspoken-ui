import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { ThemeScript } from "@/components/site/theme";
import "./globals.css";

const geist = localFont({
  src: [
    { path: "./fonts/Geist.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/Geist-Italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "./fonts/GeistMono.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/GeistMono-Italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME}: plain, dense React components`, template: `%s · ${SITE_NAME}` },
  description:
    "Plain, dense, accessible React components with square corners, real links and controls that line up. Copy them into your app with the shadcn CLI.",
  openGraph: { siteName: SITE_NAME, type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
