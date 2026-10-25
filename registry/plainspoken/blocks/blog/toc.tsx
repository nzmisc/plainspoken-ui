"use client";

import { useEffect, useState } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Accordion, AccordionItem } from "@/registry/plainspoken/ui/accordion";
import { cn } from "@/lib/utils";

export interface BlogTocItem {
  /** The id of the heading it links to */
  id: string;
  title: string;
  /** 3 for a subsection, indented under the section before it. Default 2. */
  level?: 2 | 3;
}

export interface BlogTocProps {
  items: BlogTocItem[];
  /**
   * list: a plain list for a side column, marking the section you are reading as you scroll.
   * collapsible: a closed "On this page" box, for the top of the article on narrow screens.
   */
  variant?: "list" | "collapsible";
  /** The heading over the list. Default "On this page". */
  title?: string;
  className?: string;
}

/** Below this many pixels from the top of the window, a heading's section counts as the one being read. */
const READING_LINE = 120;

/** The id of the last heading that has scrolled above the reading line; none while the intro is in view. */
function useCurrentSection(ids: string[], enabled: boolean): string | undefined {
  const [current, setCurrent] = useState<string>();
  const key = ids.join(" ");
  useEffect(() => {
    if (!enabled) return;
    const headings = key
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);
    let frame = 0;
    const measure = () => {
      frame = 0;
      let at: string | undefined;
      for (const h of headings) if (h.getBoundingClientRect().top < READING_LINE) at = h.id;
      setCurrent(at);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key, enabled]);
  return current;
}

/**
 * A post's table of contents: its section headings as links. In a side column (list) the section
 * being read is bold with a bar beside it (aria-current="location"), updated as you scroll; at
 * the top of the article on a phone (collapsible) it is a closed box that opens on demand, so it
 * doesn't push the text down. Navigation, so the links are in the text colour, not blue.
 */
export function BlogToc({ items, variant = "list", title = "On this page", className }: BlogTocProps) {
  const current = useCurrentSection(
    items.map((i) => i.id),
    variant === "list",
  );
  const list = (
    <ol className={cn("flex flex-col", variant === "list" ? "border-l border-border" : "gap-0.5")}>
      {items.map((it) => {
        const on = it.id === current;
        return (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={on ? "location" : undefined}
              className={cn(
                "block py-0.5 leading-snug text-foreground no-underline visited:text-foreground hover:underline",
                FOCUS_RING,
                variant === "list"
                  ? cn("-ml-px border-l-2 pl-3", on ? "border-foreground font-semibold" : "border-transparent text-muted-foreground visited:text-muted-foreground hover:text-foreground")
                  : "underline-offset-2",
                it.level === 3 && (variant === "list" ? "pl-6" : "pl-4"),
              )}
            >
              {it.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
  if (variant === "collapsible")
    return (
      <Accordion className={className}>
        <AccordionItem title={title} meta={`${items.length} sections`}>
          <nav aria-label={title} className="text-[14px]">
            {list}
          </nav>
        </AccordionItem>
      </Accordion>
    );
  return (
    <nav aria-label={title} data-slot="blog-toc" className={cn("text-[13px]", className)}>
      <p className="mb-1.5 font-semibold">{title}</p>
      {list}
    </nav>
  );
}
