import type { HTMLAttributes, ReactNode } from "react";
import { diff, type DiffPart, type Granularity } from "@/registry/plainspoken/lib/diff";
import { cn } from "@/lib/utils";

/** Inserted text: a green tint and a solid underline, so it shows without colour too */
export const INSERT_CLASS = "bg-success/15 text-foreground underline decoration-success decoration-2 underline-offset-[3px] [text-decoration-skip-ink:none]";
/** Deleted text: a red tint and a strike through it */
export const DELETE_CLASS = "bg-destructive/10 text-foreground line-through decoration-destructive decoration-[1.5px]";

/** Shown where a change is only spaces or a line break, which would otherwise be invisible */
function Visible({ text }: { text: string }) {
  if (/\S/.test(text)) return <>{text}</>;
  return (
    <>
      <span aria-hidden className="text-muted-foreground no-underline">
        {text.includes("\n") ? "¶" : "·".repeat(Math.min(text.length, 3))}
      </span>
      {text.includes("\n") && text}
    </>
  );
}

export interface DiffTextProps extends HTMLAttributes<HTMLSpanElement> {
  parts: readonly DiffPart[];
  /** Which text to show: both with the changes marked (default), only the old one with its deletions, or only the new one with its insertions */
  side?: "both" | "before" | "after";
}

/**
 * The parts of a diff as running text: insertions underlined on a green tint, deletions struck
 * through on a red one. Screen readers hear "added:" and "removed:" before each change, since
 * <ins> and <del> alone are silent in most of them. Keeps line breaks and spaces as they are.
 */
export function DiffText({ parts, side = "both", className, ...rest }: DiffTextProps) {
  return (
    <span data-slot="diff-text" className={cn("whitespace-pre-wrap", className)} {...rest}>
      {parts.map((p, i) => {
        if (p.op === "equal") return <span key={i}>{p.text}</span>;
        if (p.op === "insert") {
          if (side === "before") return null;
          return (
            <ins key={i} className={INSERT_CLASS}>
              <span className="sr-only">(added: </span>
              <Visible text={p.text} />
              <span className="sr-only">)</span>
            </ins>
          );
        }
        if (side === "after") return null;
        return (
          <del key={i} className={DELETE_CLASS}>
            <span className="sr-only">(removed: </span>
            <Visible text={p.text} />
            <span className="sr-only">)</span>
          </del>
        );
      })}
    </span>
  );
}

export interface DiffProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The old text */
  before?: string;
  /** The new text */
  after?: string;
  /** A diff worked out already (from lib/diff), instead of before and after */
  parts?: readonly DiffPart[];
  /** Characters, words (the default) or lines */
  granularity?: Granularity;
  /** inline: one text with both kinds of change marked. split: the old text and the new side by side (stacked on phones). */
  layout?: "inline" | "split";
  /** Headings over the two sides in the split layout. Default "Before" and "After". */
  beforeLabel?: ReactNode;
  afterLabel?: ReactNode;
  /** Say "No changes." when the texts are the same, instead of showing the text unmarked. Default true. */
  showEmpty?: boolean;
}

/**
 * What changed between two texts, inline or side by side. Words by default: spaces and
 * punctuation between changed words fold into one change, so a reworded phrase reads as one
 * replacement. The marks don't rely on colour: insertions are underlined, deletions struck
 * through, and both are spelled out for screen readers. Renders on the server; nothing in it
 * is interactive.
 */
export function Diff({
  before = "",
  after = "",
  parts: given,
  granularity = "word",
  layout = "inline",
  beforeLabel = "Before",
  afterLabel = "After",
  showEmpty = true,
  className,
  ...rest
}: DiffProps) {
  const parts = given ?? diff(before, after, granularity);
  const changed = parts.some((p) => p.op !== "equal");
  if (!changed && showEmpty) {
    return (
      <div data-slot="diff" className={cn("text-[14px] text-muted-foreground", className)} {...rest}>
        No changes.
      </div>
    );
  }
  if (layout === "inline") {
    return (
      <div data-slot="diff" data-layout="inline" className={cn("text-[14px] leading-relaxed", className)} {...rest}>
        <DiffText parts={parts} />
      </div>
    );
  }
  const side = (label: ReactNode, which: "before" | "after") => (
    <section className="min-w-0 border border-border">
      <h3 className="border-b border-border bg-muted px-2 py-0.5 text-[13px] font-semibold">{label}</h3>
      <div className="px-2 py-1.5 leading-relaxed">
        <DiffText parts={parts} side={which} />
      </div>
    </section>
  );
  return (
    <div data-slot="diff" data-layout="split" className={cn("grid gap-2 text-[14px] sm:grid-cols-2", className)} {...rest}>
      {side(beforeLabel, "before")}
      {side(afterLabel, "after")}
    </div>
  );
}

/** A one-line key to the marks, for a diff people may not have seen before */
export function DiffLegend({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p data-slot="diff-legend" className={cn("flex flex-wrap gap-x-3 text-[12px] text-muted-foreground", className)} {...rest}>
      <span>
        <ins className={INSERT_CLASS}>Underlined</ins> was added
      </span>
      <span>
        <del className={DELETE_CLASS}>Struck through</del> was removed
      </span>
    </p>
  );
}
