"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss } from "@/registry/plainspoken/lib/icons";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Navbar, type NavbarLink } from "@/registry/plainspoken/ui/navbar";

export interface BlogHeaderLink extends NavbarLink {
  /** More path prefixes that count as this section: tag pages belong to Writing */
  also?: string[];
}

export interface BlogHeaderProps {
  /** The site's name, usually the author's */
  name: string;
  /** Where the name links to */
  homeHref: string;
  links: BlogHeaderLink[];
  /** The RSS or Atom feed, shown as a link at the right (and announced to feed readers by your metadata) */
  feedHref?: string;
  /** The current pathname. Leave out to read it from the router. */
  currentHref?: string;
}

/** The link for the page: an exact match, else the longest path prefix. The home link only matches itself. */
function currentKey(links: BlogHeaderLink[], home: string, path: string): string | undefined {
  const exact = links.find((l) => l.href === path);
  if (exact) return exact.key;
  let best: { key: string; len: number } | undefined;
  for (const l of links) {
    if (l.href === home) continue;
    for (const prefix of [l.href, ...(l.also ?? [])])
      if (path.startsWith(prefix + "/") && (!best || prefix.length > best.len)) best = { key: l.key, len: prefix.length };
  }
  return best?.key;
}

/**
 * The top bar of a personal site: the author's name, a few links (Home, Writing, About) with the
 * current section in bold, and the feed. A post marks Writing, and so does a tag page when its
 * prefix is in `also`. Links go through next/link; on phones they fold into a Menu button.
 */
export function BlogHeader({ name, homeHref, links, feedHref, currentHref }: BlogHeaderProps) {
  const pathname = usePathname();
  const path = (currentHref ?? pathname ?? "").replace(/(.)\/+$/, "$1");
  return (
    <Navbar
      brand={name}
      brandHref={homeHref}
      links={links.map(({ key, label, href }) => ({ key, label, href }))}
      current={currentKey(links, homeHref, path)}
      linkAs={Link}
      label="Site"
      className="[&>div]:mx-auto [&>div]:max-w-5xl [&>div]:px-2 sm:[&>div]:px-4"
      actions={
        feedHref && (
          <a href={feedHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <Icon icon={Rss} />
            RSS
          </a>
        )
      }
    />
  );
}
