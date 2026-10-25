"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@/registry/plainspoken/lib/icons";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { bibleHref, chapterName } from "@/registry/plainspoken/blocks/bible/lib";
import { cn } from "@/lib/utils";

export interface BiblePagerTarget {
  slug: string;
  name: string;
  chapter: number;
}

export interface BibleChapterPagerProps {
  /** The chapter before, or null at the start (Genesis 1) */
  prev: BiblePagerTarget | null;
  /** The chapter after, or null at the end (Revelation 22) */
  next: BiblePagerTarget | null;
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** Turn the page with ← and →. On by default; leave it on for one pager per page only. */
  keys?: boolean;
  className?: string;
}

/** Keys that belong to the control that has focus, not to the page */
const OWNS_ARROWS =
  "input,select,textarea,[contenteditable=''],[contenteditable=true],[role=tablist],[role=radiogroup],[role=menu],[role=listbox],[role=grid],[role=slider],[role=toolbar]";

/**
 * The previous and next chapter, across book boundaries ("Genesis 50" → "Exodus 1"), as links,
 * so they work without script and search engines follow them. ← and → turn the page too, unless
 * focus is in a control that uses the arrows itself or a dialog or popover is open.
 */
export function BibleChapterPager({ prev, next, basePath = "/bible", linkAs, keys = true, className }: BibleChapterPagerProps) {
  const router = useRouter();
  const L = linkAs ?? "a";
  const prevHref = prev && bibleHref(basePath, prev.slug, prev.chapter);
  const nextHref = next && bibleHref(basePath, next.slug, next.chapter);

  useEffect(() => {
    if (!keys) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target as Element | null;
      if (t?.closest?.(OWNS_ARROWS)) return;
      if (document.querySelector("dialog[open], :popover-open")) return;
      const href = e.key === "ArrowLeft" ? prevHref : nextHref;
      if (!href) return;
      e.preventDefault();
      router.push(href);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [keys, prevHref, nextHref, router]);

  const link = (to: BiblePagerTarget | null, href: string | null, dir: "prev" | "next") => {
    if (!to || !href) return <span />;
    const name = chapterName(to, to.chapter);
    return (
      <L
        href={href}
        aria-label={`${dir === "prev" ? "Previous" : "Next"} chapter: ${name}`}
        className={cn(buttonVariants({ variant: "outline" }), "min-w-0", dir === "next" && "ml-auto")}
      >
        {dir === "prev" && <Icon icon={ArrowLeft} />}
        <span className="truncate">{name}</span>
        {dir === "next" && <Icon icon={ArrowRight} />}
      </L>
    );
  };

  return (
    <nav aria-label="Chapters" data-slot="bible-chapter-pager" className={cn("flex items-center gap-3", className)}>
      {link(prev, prevHref, "prev")}
      {keys && (
        <span className="hidden text-[12px] text-muted-foreground md:inline">
          or press <Kbd>←</Kbd> <Kbd>→</Kbd>
        </span>
      )}
      {link(next, nextHref, "next")}
    </nav>
  );
}
