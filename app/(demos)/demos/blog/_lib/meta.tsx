import type { Metadata } from "next";
import { AUTHOR, BASE, FEED } from "@/content/blog/site";
import { siteUrl } from "@/lib/site";

interface PageMeta {
  title: string;
  description: string;
  /** The page's path, for the canonical URL */
  path: string;
  /** The title as it is, without " · Ines Varga" */
  absolute?: boolean;
  article?: { published: string; updated?: string; tags: string[] };
}

/** Title, description, canonical URL, Open Graph and the feed link, the same way on every page of the blog. */
export function pageMetadata({ title, description, path, absolute, article }: PageMeta): Metadata {
  return {
    title: absolute ? { absolute: title } : title,
    description,
    authors: [{ name: AUTHOR.name, url: BASE }],
    alternates: { canonical: path, types: { "application/rss+xml": [{ url: FEED, title: `${AUTHOR.name}: writing` }] } },
    openGraph: {
      title,
      description,
      url: path,
      siteName: AUTHOR.name,
      locale: "en_GB",
      ...(article
        ? { type: "article", publishedTime: article.published, modifiedTime: article.updated, authors: [AUTHOR.name], tags: article.tags }
        : { type: "website" }),
    },
  };
}

/** An absolute URL on this deployment, for structured data and the feed */
export const absolute = (path: string) => `${siteUrl()}${path}`;

export const PERSON_LD = {
  "@type": "Person",
  name: AUTHOR.name,
  jobTitle: AUTHOR.role,
  email: `mailto:${AUTHOR.email}`,
  url: absolute(BASE),
  sameAs: [AUTHOR.code],
};

/** Structured data for search engines, as a script tag (with "<" escaped so text can't close it) */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }}
    />
  );
}
