import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { blockEntries, componentEntries } from "@/lib/docs-nav";
import { generateStaticParams as customers } from "./(demos)/demos/app/customers/[id]/page";
import { generateStaticParams as bibleBooks } from "./(demos)/demos/bible/[book]/page";
import { generateStaticParams as bibleChapters } from "./(demos)/demos/bible/[book]/[chapter]/page";
import { generateStaticParams as blogPosts } from "./(demos)/demos/blog/posts/[slug]/page";
import { generateStaticParams as blogTags } from "./(demos)/demos/blog/tags/[tag]/page";
import { generateStaticParams as libraryBooks } from "./(demos)/demos/library/book/[id]/page";
import { generateStaticParams as albums } from "./(demos)/demos/music/album/[id]/page";
import { generateStaticParams as artists } from "./(demos)/demos/music/artist/[id]/page";
import { generateStaticParams as playlists } from "./(demos)/demos/music/playlist/[id]/page";
import { generateStaticParams as socialPosts } from "./(demos)/demos/social/post/[id]/page";
import { generateStaticParams as socialUsers } from "./(demos)/demos/social/u/[handle]/page";

/** Pages without parameters */
const STATIC = [
  "/",
  "/docs",
  "/docs/installation",
  "/docs/theming",
  "/docs/control-sizes",
  "/docs/icons",
  "/docs/components",
  "/docs/blocks",
  "/customize",
  "/demos",
  "/demos/mail",
  "/demos/app",
  "/demos/app/customers",
  "/demos/app/invoices",
  "/demos/app/projects",
  "/demos/app/settings",
  "/demos/music",
  "/demos/music/search",
  "/demos/music/library",
  "/demos/social",
  "/demos/social/explore",
  "/demos/social/notifications",
  "/demos/blog",
  "/demos/blog/posts",
  "/demos/blog/tags",
  "/demos/blog/about",
  "/demos/landing",
  "/demos/landing/pricing",
  "/demos/landing/signup",
  "/demos/library",
  "/demos/library/search",
  "/demos/library/account",
  "/demos/library/branches",
  "/demos/bible",
  "/demos/bible/search",
  "/demos/kanban",
];

/**
 * Pages with parameters, from the same generateStaticParams that prerenders them, so the
 * sitemap lists exactly the pages that exist.
 */
const DYNAMIC: [string, () => Record<string, string>[]][] = [
  ["/docs/components/[name]", () => componentEntries().map((e) => ({ name: e.name }))],
  ["/docs/blocks/[name]", () => blockEntries().map((e) => ({ name: e.name }))],
  ["/demos/app/customers/[id]", customers],
  ["/demos/music/album/[id]", albums],
  ["/demos/music/artist/[id]", artists],
  ["/demos/music/playlist/[id]", playlists],
  ["/demos/social/post/[id]", socialPosts],
  ["/demos/social/u/[handle]", socialUsers],
  ["/demos/blog/posts/[slug]", blogPosts],
  ["/demos/blog/tags/[tag]", blogTags],
  ["/demos/library/book/[id]", libraryBooks],
  ["/demos/bible/[book]", bibleBooks],
  ["/demos/bible/[book]/[chapter]", bibleChapters],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    ...STATIC,
    ...DYNAMIC.flatMap(([route, params]) =>
      params().map((p) => route.replace(/\[(\w+)\]/g, (_, key: string) => encodeURIComponent(p[key]))),
    ),
  ];
  return paths.map((path) => ({ url: `${base}${path === "/" ? "" : path}` }));
}
