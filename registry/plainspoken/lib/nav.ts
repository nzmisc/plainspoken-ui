// What the navigation components (navbar, sidebar, app-shell) share: how a link is drawn, and
// how the current page is found from a pathname. No React state here, so it is safe anywhere.
import type { ComponentType, CSSProperties, MouseEvent, MouseEventHandler, ReactNode } from "react";

/** The props a navigation component hands to the element that draws a link. */
export interface NavLinkProps {
  href: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** "page" on the link to the current page; "true" on a link whose section holds it (a group in a rail) */
  "aria-current"?: "page" | "true";
  "aria-label"?: string;
  title?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/**
 * Draws a link through your router instead of a plain <a>: any component that takes these props,
 * or a small wrapper for a router that wants `to` instead of `href`.
 *
 * With Next.js, pass `NextLink` from `@/lib/next-link` (the next-link item): it works from server
 * and client components alike. next/link's own `Link` only works when the component passing it is
 * already a client component, because on the server it is a plain function, and functions can't
 * be passed to client components; NextLink is the same Link re-exported from a "use client" file.
 */
export type LinkComponent = ComponentType<NavLinkProps>;

/** A left click with no modifier keys: the only click a nav component may turn into in-app navigation. */
export function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
}

/**
 * Click handler for a nav link. With `onNavigate`, a plain left click is handed to it and the
 * browser's own navigation is cancelled (wire it to state or a router that has no Link); modified
 * clicks still open new tabs. `after` runs on every plain click, e.g. to close a drawer.
 */
export function navClick(key: string, href: string, onNavigate?: (key: string, href: string) => void, after?: () => void) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(e)) return;
    if (onNavigate) {
      e.preventDefault();
      onNavigate(key, href);
    }
    after?.();
  };
}

const pathOf = (u: string) => u.split(/[?#]/)[0].replace(/(.)\/+$/, "$1");

/** What currentKeyFor needs of a link. `exact` forces how it matches (see there). */
export interface NavMatchable {
  key: string;
  href?: string;
  exact?: boolean;
}

/**
 * The key of the link that is the current page for `currentHref` (a pathname from your router).
 * An exact match wins; otherwise the link whose path is the longest whole-segment prefix, so
 * "/mail/inbox/4821" marks "/mail/inbox".
 *
 * A root, a link whose path is a prefix of another link's in the same nav ("/" or "/music" next
 * to "/music/library"), only matches exactly: otherwise "Home" would be marked on every deeper
 * page the nav has no link for ("/music/artist/x"). Set `exact` on a link to force it either way:
 * `exact: true` for exact matches only, `exact: false` to let a root match the pages under it.
 * Hash and relative hrefs only match exactly.
 */
export function currentKeyFor(links: NavMatchable[], currentHref?: string): string | undefined {
  if (currentHref == null) return undefined;
  const exact = links.find((l) => l.href === currentHref);
  if (exact) return exact.key;
  if (!currentHref.startsWith("/")) return undefined;
  const here = pathOf(currentHref);
  const paths = links.flatMap((l) => (l.href?.startsWith("/") ? [pathOf(l.href)] : []));
  let best: { key: string; len: number } | undefined;
  for (const l of links) {
    if (!l.href?.startsWith("/")) continue;
    const p = pathOf(l.href);
    const under = (q: string) => q !== p && (p === "/" || q.startsWith(p + "/"));
    const exactOnly = l.exact ?? paths.some(under);
    const hit = p === here || (!exactOnly && under(here));
    if (hit && (!best || p.length > best.len)) best = { key: l.key, len: p.length };
  }
  return best?.key;
}
