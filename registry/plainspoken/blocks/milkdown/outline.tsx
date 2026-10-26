"use client";

import { useId, type HTMLAttributes } from "react";
import { ListTree } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { OutlineEntry } from "@/registry/plainspoken/blocks/milkdown/format";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** The editor's top-level headings of levels 1 to 3, in order, as `outline()` lists them */
export function editorHeadings(scope: ParentNode | null | undefined): HTMLElement[] {
  return [...(scope?.querySelectorAll<HTMLElement>("[data-slot=milkdown-editor] .ProseMirror > :is(h1, h2, h3)") ?? [])];
}

/** Scrolls the editor in `scope` to its nth heading, smoothly unless motion is reduced */
export function scrollToHeading(scope: ParentNode | null | undefined, index: number) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  editorHeadings(scope)[index]?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
}

function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) if (/auto|scroll/.test(getComputedStyle(p).overflowY)) return p;
  return null;
}

/**
 * Which heading the reader is in: the last one whose top has passed the top of the text (with a
 * little room), or the first while none has, or the last at the end. -1 when there are none.
 */
export function currentHeading(scope: ParentNode | null | undefined): number {
  const hs = editorHeadings(scope);
  if (!hs.length) return -1;
  const box = scrollParent(hs[0]);
  // Scrolled to the end: the last heading, though it can't reach the top
  if (box && box.scrollTop > 0 && box.scrollTop + box.clientHeight >= box.scrollHeight - 2) return hs.length - 1;
  const top = (box?.getBoundingClientRect().top ?? 0) + 24;
  let at = 0;
  hs.forEach((h, i) => {
    if (h.getBoundingClientRect().top <= top) at = i;
  });
  return at;
}

export interface NotebookOutlineProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  entries: OutlineEntry[];
  /** The heading the reader is in, marked as the current location */
  current?: number;
  onSelect: (index: number) => void;
}

const indent = { 1: "pl-2", 2: "pl-2", 3: "pl-5" } as const;

/**
 * "On this page": the page's headings, indented by level, the one being read in bold. Choosing one
 * scrolls the text to it. For a rail beside the text; see OutlineMenu where there is no room.
 */
export function NotebookOutline({ entries, current = -1, onSelect, className, ...rest }: NotebookOutlineProps) {
  const id = useId();
  return (
    <nav data-slot="notebook-outline" aria-labelledby={id} className={cn("flex flex-col gap-1.5 text-[13px]", className)} {...rest}>
      <p id={id} className="px-2 font-bold">
        On this page
      </p>
      {entries.length ? (
        <ul className="flex flex-col border-l border-border">
          {entries.map((e, i) => (
            <li key={i}>
              <button
                type="button"
                aria-current={i === current ? "location" : undefined}
                onClick={() => onSelect(i)}
                className={cn(
                  "-ml-px block w-full cursor-pointer border-l-2 py-1 pr-2 text-left leading-snug hover:text-foreground",
                  indent[e.level],
                  i === current ? "border-foreground font-bold text-foreground" : "border-transparent text-muted-foreground",
                  FOCUS_RING,
                  "focus-visible:-outline-offset-2",
                )}
              >
                {e.text || "Untitled heading"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 text-muted-foreground">Headings in the page show here.</p>
      )}
    </nav>
  );
}

export interface OutlineMenuProps {
  entries: OutlineEntry[];
  current?: number;
  onSelect: (index: number) => void;
  className?: string;
}

/** The outline as a menu from an icon button, for widths without the rail */
export function OutlineMenu({ entries, current = -1, onSelect, className }: OutlineMenuProps) {
  return (
    <DropdownMenu
      label="On this page"
      trigger={ListTree}
      triggerVariant="ghost"
      triggerClassName={className}
      align="end"
      disabled={!entries.length}
      className="max-w-80"
      items={entries.map((e, i) => ({
        label: `${e.level === 3 ? " " : ""}${e.text || "Untitled heading"}`,
        onSelect: () => onSelect(i),
        hint: i === current ? "You are here" : undefined,
      }))}
    />
  );
}
