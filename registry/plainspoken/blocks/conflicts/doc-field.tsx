"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { diffChars, diffWords, isListItem, mapOffset, merge3, merge3Tokens, mergedText, splitBlocks, type TextSelection } from "@/registry/plainspoken/lib/diff";
import { markdownToText } from "@/registry/plainspoken/lib/markdown";
import { CircleCheck, X } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Diff, DiffText } from "@/registry/plainspoken/ui/diff";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { BlockMarks, DomCursors, Facepile, firstName, type BlockMark, type Collaborator, type DomCursor, type PresenceEntry } from "@/registry/plainspoken/ui/presence";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { RichTextEditor } from "@/registry/plainspoken/ui/rich-text-editor";
import type { ClientState, Side, Sim } from "@/registry/plainspoken/blocks/conflicts/sim";
import { peerEntries } from "@/registry/plainspoken/blocks/conflicts/synced-field";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------------------------
// Markdown offsets ↔ the editor's DOM
//
// The editor draws one element per block of lib/diff's splitBlocks (a paragraph, a heading, a
// list item), so a Markdown offset maps to (block, offset in its Markdown), and that to an offset
// in the element's text by a character diff between the two (which skips "## ", "**" and the like).

/** Each block of the Markdown with the offset where it starts */
export function blockSpans(md: string): { text: string; start: number }[] {
  let from = 0;
  return splitBlocks(md).map((text) => {
    const start = md.indexOf(text, from);
    from = start + text.length;
    return { text, start };
  });
}

/** The editor's block elements in document order: list items one by one, everything else as it is */
export function editorBlocks(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const el of Array.from(root.children) as HTMLElement[]) {
    if (el.tagName === "UL" || el.tagName === "OL") out.push(...(Array.from(el.children) as HTMLElement[]).filter((c) => c.tagName === "LI"));
    else out.push(el);
  }
  return out;
}

/** Which block a Markdown offset is in, and where in that block's text */
function locate(md: string, offset: number) {
  const spans = blockSpans(md);
  let i = spans.findIndex((s, k) => offset < (spans[k + 1]?.start ?? Infinity));
  if (i < 0) i = spans.length - 1;
  return { index: i, span: spans[i], within: Math.max(0, Math.min(offset - (spans[i]?.start ?? 0), spans[i]?.text.length ?? 0)) };
}

/** A Markdown range as an element and text offsets in it (clamped to the block the range starts in) */
export function mdToDom(md: string, root: HTMLElement, sel: TextSelection): { element: HTMLElement; start: number; end: number } | null {
  const blocks = editorBlocks(root);
  const spans = blockSpans(md);
  if (blocks.length !== spans.length) return null;
  const a = locate(md, sel.start);
  const el = blocks[a.index];
  if (!el) return null;
  const parts = diffChars(a.span.text, el.textContent ?? "");
  const start = mapOffset(parts, a.within, 1);
  const endWithin = Math.min(sel.end - a.span.start, a.span.text.length);
  const end = sel.end === sel.start ? start : Math.max(start, mapOffset(parts, endWithin, -1));
  return { element: el, start, end };
}

/** The editor's DOM selection as a Markdown range, or null when it isn't in the editor */
export function domToMd(md: string, root: HTMLElement): TextSelection | null {
  const s = document.getSelection();
  if (!s || s.rangeCount === 0 || !root.contains(s.anchorNode)) return null;
  const blocks = editorBlocks(root);
  const spans = blockSpans(md);
  if (blocks.length !== spans.length) return null;
  const at = (node: Node, offset: number) => {
    const i = blocks.findIndex((b) => b.contains(node));
    if (i < 0) return null;
    const r = document.createRange();
    r.selectNodeContents(blocks[i]);
    r.setEnd(node, offset);
    const within = r.toString().length;
    return spans[i].start + mapOffset(diffChars(blocks[i].textContent ?? "", spans[i].text), within, 1);
  };
  const r = s.getRangeAt(0);
  const start = at(r.startContainer, r.startOffset);
  const end = at(r.endContainer, r.endOffset);
  if (start == null) return null;
  return { start, end: Math.max(start, end ?? start) };
}

/** Puts the DOM selection at a Markdown range inside the editor */
function placeCaret(md: string, root: HTMLElement, sel: TextSelection) {
  const target = mdToDom(md, root, sel);
  if (!target) return;
  const walker = document.createTreeWalker(target.element, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let pos = 0;
  let set = 0;
  let last: Text | null = null;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const len = n.data.length;
    if (!(set & 1) && target.start <= pos + len) {
      range.setStart(n, target.start - pos);
      set |= 1;
    }
    if (set & 1 && !(set & 2) && target.end <= pos + len) {
      range.setEnd(n, target.end - pos);
      set |= 2;
    }
    pos += len;
    last = n;
  }
  if (!last) {
    range.selectNodeContents(target.element);
    range.collapse(true);
  } else if (set !== 3) {
    if (!(set & 1)) range.setStart(last, last.data.length);
    range.setEnd(last, last.data.length);
  }
  const s = document.getSelection();
  s?.removeAllRanges();
  s?.addRange(range);
}

// ---------------------------------------------------------------------------------------------
// Labels for blocks

/** A block as people would name it: its heading's words, or its first few words in quotes */
export function blockLabel(block: string): string {
  const text = markdownToText(block).trim();
  if (/^#{1,6}\s/.test(block)) return `the heading “${text}”`;
  const words = text.split(/\s+/);
  const start = words.slice(0, 5).join(" ") + (words.length > 5 ? "…" : "");
  return isListItem(block) ? `the item “${start}”` : `the paragraph “${start}”`;
}

/** Block Markdown as plain text for word diffs: no "##", "-" or "**" in the way */
export const plain = (md: string) => markdownToText(md).trim();

// ---------------------------------------------------------------------------------------------
// The editor, bound to a sim client

/** Someone who only reads, shown with a fixed selection */
export interface Watcher {
  person: Collaborator;
  /** Words they have selected, found in the text */
  find: string;
}

export interface SyncedEditorProps {
  sim: Sim;
  client: ClientState;
  /** The editor's accessible name */
  label: string;
  readOnly?: boolean;
  /** Draw the other person's caret and selection */
  showPeerCursor?: boolean;
  /** "Jonas is editing" beside the block he is in */
  showBlockMarks?: boolean;
  /** People who only read, with what they have selected */
  watchers?: Watcher[];
  /** ids of things that describe the editor */
  describedBy?: string;
  className?: string;
}

/**
 * The library's RichTextEditor bound to one client of a Sim, from the outside: changes and the
 * caret go to the sim; when text arrives from elsewhere, the editor redraws its area and this puts
 * your caret back on the same words (the sim carried your selection through the change). Other
 * people's carets, selections and "is editing" marks are drawn over it, placed through the same
 * Markdown-to-DOM mapping.
 */
export function SyncedEditor({ sim, client, label, readOnly, showPeerCursor, showBlockMarks, watchers = [], describedBy, className }: SyncedEditorProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const side: Side = client.side;
  const text = client.text;
  const latest = useRef(text);
  useLayoutEffect(() => {
    latest.current = text;
  });
  const root = () => wrap.current?.querySelector<HTMLElement>('[role="textbox"][contenteditable]') ?? null;
  const source = () => wrap.current?.querySelector<HTMLTextAreaElement>("textarea[data-rte-input]") ?? null;

  /** The caret as Markdown offsets, in either mode */
  const readSelection = (md: string): TextSelection | null => {
    const t = source();
    if (t && document.activeElement === t) return { start: t.selectionStart, end: t.selectionEnd };
    const r = root();
    return r ? domToMd(md, r) : null;
  };

  // Your caret, as it moves, to the sim (and so to the others)
  useEffect(() => {
    const onSel = () => {
      const sel = readSelection(latest.current);
      if (sel) sim.select(side, sel);
    };
    const w = wrap.current;
    const focusIn = () => sim.focus(side, true);
    const focusOut = (e: FocusEvent) => {
      if (!w?.contains(e.relatedTarget as Node)) sim.focus(side, false);
    };
    document.addEventListener("selectionchange", onSel);
    w?.addEventListener("focusin", focusIn);
    w?.addEventListener("focusout", focusOut);
    return () => {
      document.removeEventListener("selectionchange", onSel);
      w?.removeEventListener("focusin", focusIn);
      w?.removeEventListener("focusout", focusOut);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set up once; reads the latest text from a ref
  }, [sim, side]);

  // Text from elsewhere: the editor has redrawn (its layout effect runs before this one); put the caret back
  useLayoutEffect(() => {
    const sel = client.selection;
    if (!sel) return;
    const t = source();
    if (t && document.activeElement === t) {
      t.setSelectionRange(sel.start, sel.end);
      return;
    }
    const r = root();
    if (r && document.activeElement === r) placeCaret(text, r, sel);
    // Only when the text came from elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.external]);

  // Where the others are, as DOM positions; worked out after each render, when the editor's DOM is current
  // `n` counts recomputations: the marks are placed again each time, as the elements they point at may be new
  const [overlay, setOverlay] = useState<{ cursors: DomCursor[]; marks: BlockMark[]; n: number }>({ cursors: [], marks: [], n: 0 });
  const peer = client.peer;
  const peerKey = peer && peer.online && peer.focused && peer.selection ? `${peer.selection.start}-${peer.selection.end}-${peer.typing}` : "";
  const watchKey = watchers.map((w) => w.find).join("|");
  useLayoutEffect(() => {
    const r = root();
    const cursors: DomCursor[] = [];
    const marks: BlockMark[] = [];
    if (r) {
      if (peer && peerKey && (showPeerCursor || showBlockMarks)) {
        const at = mdToDom(text, r, peer.selection!);
        if (at && showPeerCursor) cursors.push({ person: peer.person, ...at, label: `${firstName(peer.person)} typing`, flag: peer.typing });
        if (at && showBlockMarks) marks.push({ person: peer.person, element: at.element });
      }
      for (const w of watchers) {
        const i = text.indexOf(w.find);
        if (i < 0) continue;
        const at = mdToDom(text, r, { start: i, end: i + w.find.length });
        if (at) cursors.push({ person: w.person, ...at, label: `${firstName(w.person)} (reading)` });
      }
    }
    // The overlay follows the editor's DOM, which React doesn't own: read it after each change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverlay((o) => ({ cursors, marks, n: o.n + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, peerKey, watchKey, showPeerCursor, showBlockMarks]);

  return (
    <div ref={wrap} className={cn("relative", showBlockMarks && "sm:pr-32", className)}>
      <RichTextEditor
        value={text}
        onChange={(md) => sim.type(side, md, readSelection(md))}
        readOnly={readOnly}
        aria-label={label}
        aria-describedby={describedBy}
        contentClassName="min-h-72"
      />
      <DomCursors container={wrap} cursors={overlay.cursors} version={overlay.n} />
      {showBlockMarks && <BlockMarks container={wrap} marks={overlay.marks} version={overlay.n} labels="right" />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Bits every document prototype shows

/** The document's name, with who else has it open */
export function DocHeader({ client, extra = [], caption, presence = true }: { client: ClientState; extra?: PresenceEntry[]; caption?: ReactNode; presence?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p className="min-w-0 text-[13px]">
        <span className="text-muted-foreground">Shop team / Launches /</span> <span className="font-semibold">Spring sale: launch checklist</span>
      </p>
      {presence &&
        (client.online ? (
          <Facepile people={[...peerEntries(client), ...extra]} caption={caption} />
        ) : (
          <span className="text-[13px] text-muted-foreground">Offline: you can&apos;t see who&apos;s here</span>
        ))}
    </div>
  );
}

/** "Merged Jonas's change in the paragraph “…”", with Show and Undo */
export function DocMergedNote({ sim, client, side }: { sim: Sim; client: ClientState; side: Side }) {
  const m = client.merged!;
  const who = firstName(m.theirs.author);
  const [show, setShow] = useState(false);
  const where = changedBlocks(m.mine, m.result);
  return (
    <div className="flex flex-col gap-1 text-[13px]">
      <div className="ctl-xs flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-success">
          <Icon icon={CircleCheck} className="mr-1" />
          Merged {who}&apos;s change{where.length === 1 ? ` in ${where[0]}` : where.length > 1 ? `s in ${where.length} places` : ""}
          {m.offline ? ", from while you were offline" : ""}
        </span>
        <RelativeTime date={m.at} format="short" className="text-muted-foreground" />
        <Button size="xs" variant="link" aria-expanded={show} onClick={() => setShow(!show)}>
          {show ? "Hide" : "Show"}
        </Button>
        <Button size="xs" variant="link" onClick={() => sim.undoMerge(side)}>
          Undo
        </Button>
        <IconButton size="xs" variant="ghost" icon={X} label="Dismiss" onClick={() => sim.dismissMerged(side)} className="text-muted-foreground" />
      </div>
      {show && <Diff parts={diffWords(plain(m.mine), plain(m.result))} className="max-h-40 overflow-y-auto border-l-2 border-border pl-2" />}
    </div>
  );
}

/** Labels of the blocks that differ between two versions */
export function changedBlocks(before: string, after: string): string[] {
  const a = splitBlocks(before);
  const b = splitBlocks(after);
  const set = new Set(a);
  return b.filter((x) => !set.has(x)).map(blockLabel);
}

/**
 * Blocks of Markdown drawn simply (headings bold, list items with a bullet), each with what
 * changed against `base` marked word by word when the two have as many blocks. For conflict
 * views, where the editor's full rendering isn't needed but the changes must show.
 */
export function BlockText({ md, base, className }: { md: string; base?: string; className?: string }) {
  const blocks = splitBlocks(md);
  const was = base != null ? splitBlocks(base) : null;
  if (blocks.length === 0) return <p className={cn("text-muted-foreground italic", className)}>Removed</p>;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {blocks.map((b, i) => {
        const level = /^(#{1,6})\s/.exec(b)?.[1].length;
        const body = was && was.length === blocks.length ? <DiffText parts={diffWords(plain(was[i]), plain(b))} /> : plain(b);
        if (level) return <p key={i} className={cn("font-bold", level <= 2 && "text-[16px]")}>{body}</p>;
        if (isListItem(b))
          return (
            <p key={i} className="pl-4 -indent-3">
              <span aria-hidden>• </span>
              {body}
            </p>
          );
        return <p key={i}>{body}</p>;
      })}
    </div>
  );
}

/** What goes into the result for a changed stretch: their blocks, yours, both, or the word-by-word merge */
export type ChangePick = "theirs" | "mine" | "both" | "merged";

/** One stretch of a document that changed since the base: the three versions, and what goes into the result by default */
export interface ChangeRow {
  base: string[];
  theirs: string[];
  mine: string[];
  /** Who changed it: one side, both the same way, or both differently */
  by: "mine" | "theirs" | "both-same" | "both";
  /** Both changed it but in different words: the word-by-word merge */
  merged: string[] | null;
  /** The obvious choice, or "" where a person must choose */
  initial: ChangePick | "";
}

export type ChangePart = { kind: "same"; blocks: string[] } | ({ kind: "row" } & ChangeRow);

/** A document as unchanged stretches and change rows, from a block-level three-way merge */
export function changeParts(base: string, mine: string, theirs: string): ChangePart[] {
  return merge3Tokens(splitBlocks(base), splitBlocks(mine), splitBlocks(theirs), { trim: false }).map((c): ChangePart => {
    if (c.type === "clean") {
      if (c.from === "base") return { kind: "same", blocks: c.tokens };
      const was = c.base ?? [];
      if (c.from === "mine") return { kind: "row", base: was, mine: c.tokens, theirs: was, by: "mine", merged: null, initial: "mine" };
      if (c.from === "theirs") return { kind: "row", base: was, mine: was, theirs: c.tokens, by: "theirs", merged: null, initial: "theirs" };
      return { kind: "row", base: was, mine: c.tokens, theirs: c.tokens, by: "both-same", merged: null, initial: "mine" };
    }
    // Both changed the same blocks: if every block merges word by word, that is the default
    let merged: string[] | null = null;
    if (c.base.length > 0 && c.base.length === c.mine.length && c.base.length === c.theirs.length) {
      const each = c.base.map((b, i) => merge3(b, c.mine[i], c.theirs[i], "word"));
      if (each.every((r) => r.conflicts === 0)) merged = each.map((r) => mergedText(r));
    }
    return { kind: "row", base: c.base, mine: c.mine, theirs: c.theirs, by: "both", merged, initial: merged ? "merged" : "" };
  });
}

/** The blocks a choice puts into the result */
export const pickBlocks = (r: ChangeRow, p: ChangePick): string[] =>
  p === "theirs" ? r.theirs : p === "mine" ? r.mine : p === "merged" ? (r.merged ?? r.mine) : [...r.mine, ...r.theirs];
