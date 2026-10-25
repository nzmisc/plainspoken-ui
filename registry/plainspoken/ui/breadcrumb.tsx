"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: ReactNode;
  /** Leave out for a level that has no page of its own */
  href?: string;
}

export interface BreadcrumbProps {
  /** From the top level down; the last is the current page */
  items: Crumb[];
  /** Beyond this many, the middle folds into "…", which shows the rest when clicked. Default 5. */
  maxItems?: number;
  /** Between items. Default "/". */
  separator?: ReactNode;
  /**
   * The component to draw links with, for client-side navigation: `linkAs={Link}` with next/link.
   * Default: a plain <a>.
   */
  linkAs?: LinkComponent;
  /** Accessible name of the navigation landmark. Default "Breadcrumb". */
  label?: string;
  className?: string;
}

const LINK = cn(
  "truncate text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground hover:decoration-current",
  FOCUS_RING,
);

/**
 * Where the page sits in a hierarchy: Home / Projects / plainspoken-ui. A navigation landmark
 * with an ordered list; the last item is the current page (aria-current, bold, not a link). The
 * other items are gray underlined links, not blue ones, since this is navigation rather than
 * text. Long trails keep the first item and the last two and fold the middle into a "…" button;
 * pressing it shows them and moves focus to the first one it revealed.
 */
export function Breadcrumb({ items, maxItems = 5, separator = "/", linkAs: LinkAs, label = "Breadcrumb", className }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const fold = !expanded && items.length > maxItems;
  const shown: (Crumb | "fold")[] = fold ? [items[0], "fold", ...items.slice(-2)] : items;
  const revealed = useRef(false);
  useEffect(() => {
    if (expanded && revealed.current) {
      revealed.current = false;
      list.current?.children[1]?.querySelector<HTMLElement>("a, [tabindex]")?.focus();
    }
  }, [expanded]);
  return (
    <nav aria-label={label} data-slot="breadcrumb" className={cn("min-w-0 text-[14px]", className)}>
      <ol ref={list} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        {shown.map((c, i) => {
          const last = i === shown.length - 1;
          return (
            <li key={i} className="flex min-w-0 items-baseline gap-x-1.5">
              {c === "fold" ? (
                <button
                  type="button"
                  onClick={() => {
                    revealed.current = true;
                    setExpanded(true);
                  }}
                  aria-label={`Show ${items.length - 3} more`}
                  title={`Show ${items.length - 3} more`}
                  className={cn("cursor-pointer px-0.5 text-muted-foreground hover:text-foreground", FOCUS_RING)}
                >
                  …
                </button>
              ) : last ? (
                <span aria-current="page" className="truncate font-semibold">
                  {c.label}
                </span>
              ) : c.href != null ? (
                LinkAs ? (
                  <LinkAs href={c.href} className={LINK}>
                    {c.label}
                  </LinkAs>
                ) : (
                  <a href={c.href} className={LINK}>
                    {c.label}
                  </a>
                )
              ) : (
                <span className="truncate text-muted-foreground">{c.label}</span>
              )}
              {!last && (
                <span aria-hidden className="shrink-0 text-muted-foreground [&_svg]:size-3.5">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
