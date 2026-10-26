import type { Metadata } from "next";
import { PRODUCT } from "@/content/landing/content";
import { siteUrl } from "@/lib/site";

/** Title, description, canonical URL and Open Graph, the same way on every page of the landing demo. */
export function pageMetadata({ title, description, path, absolute }: { title: string; description: string; path: string; absolute?: boolean }): Metadata {
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: PRODUCT.name, type: "website", locale: "en_US" },
  };
}

export const absolute = (path: string) => `${siteUrl()}${path}`;

/** Structured data for search engines, as a script tag (with "<" escaped so text can't close it) */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
