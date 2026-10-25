"use client";

import { useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { diffWords, mergedText, type MergeChunk, type MergeResult } from "@/registry/plainspoken/lib/diff";
import { TriangleAlert } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { DiffText } from "@/registry/plainspoken/ui/diff";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

/** What someone chose for a conflict */
export type ConflictChoice = "mine" | "theirs" | "both" | "edit";

/** One side of a conflict: the text and who wrote it */
export interface ConflictSide {
  text: string;
  /** "Yours", "Jonas Weber" */
  label: ReactNode;
  /** Before the label: an avatar */
  mark?: ReactNode;
  /** After the label, muted: "20 s ago" */
  meta?: ReactNode;
}

export interface ConflictLabels {
  mine?: string;
  theirs?: string;
  both?: string;
  edit?: string;
}

export interface MergeConflictProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  mine: ConflictSide;
  theirs: ConflictSide;
  /** What it was before either change. Given, and with `showChanges`, each side marks what it changed. */
  base?: string;
  /** block: both versions stacked in a box, for paragraphs. inline: a short marked stretch in running text, for a few words. */
  variant?: "block" | "inline";
  /** The block's heading. Default "Both of you changed this". */
  title?: ReactNode;
  /** "1 of 3", after the title */
  counter?: ReactNode;
  /** Mark each side's changes against `base` (word diff). Default true when there is a base. */
  showChanges?: boolean;
  /** Which buttons to offer, in order. Default all four. */
  choices?: ConflictChoice[];
  /** Button words. Defaults: Keep mine, Keep theirs, Keep both, Edit (inline: Mine, Theirs, Both, Edit). */
  labels?: ConflictLabels;
  /** How "Keep both" joins the two. Default: mine, a blank line, theirs (inline: a space). */
  joinBoth?: (mine: string, theirs: string) => string;
  /** Draws a side's text, for Markdown and the like. Gets the plain text, or the diff when marking changes. */
  renderText?: (text: string, side: "mine" | "theirs", changes: ReactNode | null) => ReactNode;
  /** Called with the settled text and how it was settled */
  onResolve: (text: string, choice: ConflictChoice) => void;
}

const BLOCK_LABELS: Required<ConflictLabels> = { mine: "Keep mine", theirs: "Keep theirs", both: "Keep both", edit: "Edit" };
const INLINE_LABELS: Required<ConflictLabels> = { mine: "Mine", theirs: "Theirs", both: "Both", edit: "Edit" };
const ALL: ConflictChoice[] = ["mine", "theirs", "both", "edit"];

const quoted = (t: string) => (t.trim() ? `“${t.trim()}”` : "nothing (removed)");

/**
 * A stretch two people changed differently, with both versions and a way to settle it: keep
 * mine, keep theirs, keep both, or edit. The block variant stacks the versions in a box tagged
 * with who wrote each (a git merge editor, or suggestions in a document); the inline variant
 * marks a few words in running text with small buttons after them. Each side can show what it
 * changed against the base. All of it works by keyboard: Edit opens a text box with both
 * versions in it, Enter (inline) or Done saves, Escape cancels.
 */
export function MergeConflict({
  mine,
  theirs,
  base,
  variant = "block",
  title = "Both of you changed this",
  counter,
  showChanges = base != null,
  choices = ALL,
  labels,
  joinBoth,
  renderText,
  onResolve,
  className,
  ...rest
}: MergeConflictProps) {
  const id = useId();
  const inline = variant === "inline";
  const words = { ...(inline ? INLINE_LABELS : BLOCK_LABELS), ...labels };
  const both = joinBoth ?? ((m: string, t: string) => (inline ? [m, t].filter((x) => x.trim()).join(" ") : [m, t].filter((x) => x.trim()).join("\n\n")));
  const [editing, setEditing] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (editing != null) editRef.current?.focus();
    // Only when editing starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing != null]);

  const pick = (c: ConflictChoice) => {
    if (c === "edit") setEditing(both(mine.text, theirs.text));
    else onResolve(c === "mine" ? mine.text : c === "theirs" ? theirs.text : both(mine.text, theirs.text), c);
  };
  const body = (side: ConflictSide, which: "mine" | "theirs") => {
    const changes = showChanges && base != null ? <DiffText parts={diffWords(base, side.text)} side="after" /> : null;
    if (renderText) return renderText(side.text, which, changes);
    if (!side.text.trim()) return <em className="text-muted-foreground">Removed</em>;
    return changes ?? <span className="whitespace-pre-wrap">{side.text}</span>;
  };
  const buttons = (size: "xs" | "sm") =>
    choices.map((c) => (
      <Button
        key={c}
        size={size}
        variant={c === "edit" ? "ghost" : "default"}
        onClick={() => pick(c)}
        aria-label={inline && c !== "edit" ? `${words[c]}: ${c === "mine" ? quoted(mine.text) : c === "theirs" ? quoted(theirs.text) : "both"}` : undefined}
      >
        {words[c]}
      </Button>
    ));

  if (inline) {
    if (editing != null) {
      return (
        <span data-slot="merge-conflict" data-variant="inline" className={cn("ctl-xs inline-flex flex-wrap items-center gap-1 align-baseline", className)} {...rest}>
          <input
            ref={editRef}
            value={editing}
            aria-label="Your wording for this part"
            size={Math.max(8, Math.min(40, editing.length + 2))}
            onChange={(e) => setEditing(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onResolve(editing, "edit");
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditing(null);
              }
            }}
            className="h-(--ctl-h) border border-input bg-background px-1 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
          <Button size="xs" variant="primary" onClick={() => onResolve(editing, "edit")}>
            Done
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </span>
      );
    }
    return (
      <span
        role="group"
        aria-label={`Conflict: ${typeof mine.label === "string" ? mine.label : "yours"} ${quoted(mine.text)}, ${typeof theirs.label === "string" ? theirs.label : "theirs"} ${quoted(theirs.text)}`}
        data-slot="merge-conflict"
        data-variant="inline"
        className={cn("border border-warning bg-warning/10 px-0.5 [box-decoration-break:clone]", className)}
        {...rest}
      >
        <span aria-hidden className="text-[12px] whitespace-nowrap text-muted-foreground">
          <Icon icon={TriangleAlert} className="mr-0.5 text-warning" />
          {mine.label}:{" "}
        </span>
        <span className="font-medium">{mine.text.trim() ? mine.text : <em className="text-muted-foreground">removed</em>}</span>
        <span aria-hidden className="text-muted-foreground"> / </span>
        <span aria-hidden className="text-[12px] text-muted-foreground">{theirs.label}: </span>
        <span className="font-medium">{theirs.text.trim() ? theirs.text : <em className="text-muted-foreground">removed</em>}</span>{" "}
        <span className="ctl-xs inline-flex flex-wrap gap-0.5 align-baseline">{buttons("xs")}</span>
      </span>
    );
  }

  return (
    <section
      aria-labelledby={`${id}-t`}
      data-slot="merge-conflict"
      data-variant="block"
      className={cn("border border-l-4 border-warning bg-background text-[14px]", className)}
      {...rest}
    >
      <h3 id={`${id}-t`} className="flex flex-wrap items-baseline gap-x-2 px-2 py-1 text-[13px] font-semibold text-warning">
        <span>
          <Icon icon={TriangleAlert} /> {title}
        </span>
        {counter != null && <span className="font-normal text-muted-foreground">{counter}</span>}
      </h3>
      {editing != null ? (
        <div className="border-t border-border px-2 py-2">
          <label htmlFor={`${id}-e`} className="mb-1 block text-[12px] text-muted-foreground">
            Both versions are in the box: change it to what it should say.
          </label>
          <Textarea
            id={`${id}-e`}
            ref={editRef}
            value={editing}
            rows={Math.min(10, Math.max(3, editing.split("\n").length + 1))}
            onChange={(e) => setEditing(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setEditing(null);
              }
            }}
          />
          <div className="ctl-sm mt-2 flex gap-2">
            <Button variant="primary" onClick={() => onResolve(editing, "edit")}>
              Done
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {([
            [mine, "mine"],
            [theirs, "theirs"],
          ] as const).map(([side, which]) => (
            <div key={which} data-side={which} className="border-t border-border px-2 py-1.5">
              <p className="mb-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                {side.mark}
                <span className="font-semibold text-foreground">{side.label}</span>
                {side.meta != null && <span>{side.meta}</span>}
              </p>
              <div className="min-w-0 leading-relaxed">{body(side, which)}</div>
            </div>
          ))}
          <div className="ctl-sm flex flex-wrap gap-2 border-t border-border bg-muted px-2 py-1.5">{buttons("sm")}</div>
        </>
      )}
    </section>
  );
}

export interface MergedTextProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** A three-way merge from lib/diff's merge3 */
  result: MergeResult;
  /** How the two sides are named on each conflict: "You", "Jonas" */
  mineLabel?: string;
  theirsLabel?: string;
  /** Button words for the inline conflicts ("Jonas's" for theirs) */
  labels?: ConflictLabels;
  /** Classes for the clean stretches that came from their side, to show what was merged in */
  theirsClassName?: string;
  /** Called with the finished text once every conflict is settled */
  onDone: (text: string) => void;
}

/**
 * A whole merge result as running text, with each conflict marked inline and its buttons right
 * there. Settling one moves focus to the next; when the last is settled, `onDone` gets the
 * finished text. The rest of the text is read-only meanwhile: a line under it says how many
 * parts are left.
 */
export function MergedText({ result, mineLabel = "You", theirsLabel = "Theirs", labels, theirsClassName, onDone, className, ...rest }: MergedTextProps) {
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const box = useRef<HTMLDivElement>(null);
  const total = result.conflicts;
  const left = total - Object.keys(chosen).length;
  let n = 0;
  const settle = (i: number, text: string) => {
    const next = { ...chosen, [i]: text };
    setChosen(next);
    if (Object.keys(next).length === total) {
      onDone(mergedText(result, (_c, k) => next[k]));
      return;
    }
    // Focus to the next open conflict, so the keyboard isn't left on a button that's gone
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>("[data-open] button, [data-open] input")?.focus());
  };
  return (
    <div data-slot="merged-text" ref={box} className={cn("text-[14px]", className)} {...rest}>
      <div className="leading-[1.9] whitespace-pre-wrap">
        {result.chunks.map((c: MergeChunk, i) => {
          if (c.type === "clean") {
            return c.from === "theirs" && theirsClassName ? (
              <span key={i} className={theirsClassName}>
                {c.text}
              </span>
            ) : (
              <span key={i}>{c.text}</span>
            );
          }
          const k = n++;
          if (k in chosen) return <span key={i}>{chosen[k]}</span>;
          return (
            <span key={i} data-open="">
              <MergeConflict
                variant="inline"
                mine={{ text: c.mine, label: mineLabel }}
                theirs={{ text: c.theirs, label: theirsLabel }}
                base={c.base}
                labels={labels}
                onResolve={(text) => settle(k, text)}
              />
            </span>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-1 text-[12px] text-muted-foreground">
        {left > 0 ? `${left} of ${total} ${total === 1 ? "part needs" : "parts need"} you: choose a version for each marked part.` : "All settled."}
      </p>
    </div>
  );
}
