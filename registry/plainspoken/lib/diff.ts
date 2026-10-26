/*
 * Diffs and three-way merges for text, with no dependencies.
 *
 *   diffChars / diffWords / diffLines   what changed from a to b, as equal / delete / insert parts
 *   merge3                              base + mine + theirs → clean chunks and conflict chunks (diff3)
 *   mapOffset / mapSelection            where a caret goes when the text under it changes
 *   splitBlocks / mergeBlocks / diffBlocks   the same at the level of Markdown blocks
 *
 * The diff is Myers' O(ND) algorithm on tokens (characters, words or lines), after trimming the
 * common start and end, so the usual case of a small edit in a long text is quick. Everything works
 * on plain strings and arrays: it runs in the browser, on the server and under `node --test`.
 */

/** What a part of a diff is: in both texts, only in the old one, or only in the new one */
export type DiffOp = "equal" | "delete" | "insert";

/** A run of text in a diff */
export interface DiffPart {
  op: DiffOp;
  text: string;
}

/** How finely to compare: characters, words (with the spaces and punctuation between them as tokens of their own) or lines */
export type Granularity = "char" | "word" | "line";

/**
 * A stretch of two token sequences: equal in both, or a change where a[aStart, aEnd) became
 * b[bStart, bEnd). One side of a change may be empty (a pure insertion or deletion).
 */
export interface DiffRange {
  equal: boolean;
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
}

// ---------------------------------------------------------------------------------------------
// Tokens

const graphemes = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

/**
 * Words, runs of spaces, and single punctuation marks, each a token. A word keeps its inner
 * apostrophes and hyphens ("Jonas's", "re-open"); numbers keep their separators ("09:00", "2.5").
 */
const WORD_RE = /\p{N}+(?:[.,:]\p{N}+)*|[\p{L}\p{M}\p{N}_]+(?:['’-][\p{L}\p{M}\p{N}_]+)*|\s+|[^\s\p{L}\p{M}\p{N}_]/gu;

/** Splits text into the tokens of a granularity. Joining the tokens gives the text back exactly. */
export function tokenize(text: string, granularity: Granularity): string[] {
  if (text === "") return [];
  if (granularity === "line") return text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  if (granularity === "word") return text.match(WORD_RE) ?? [];
  // Grapheme clusters, so an emoji or a letter with a combining accent is never split in two
  return graphemes ? Array.from(graphemes.segment(text), (s) => s.segment) : Array.from(text);
}

// ---------------------------------------------------------------------------------------------
// Myers

/** Beyond this many token edits two texts are treated as wholly different (a few MB of work at most) */
const MAX_EDITS = 4000;

/**
 * Diffs two token sequences: alternating equal and changed ranges covering both from start to
 * end. Within a change, everything deleted and inserted between two equal runs is one range, so
 * a replaced word is one change rather than a deletion and an insertion that might be interleaved.
 */
export function diffSequences(a: readonly string[], b: readonly string[]): DiffRange[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const n = endA - start;
  const m = endB - start;

  // Single-token moves from the end back to the start, as (x, y) points in the edit graph
  const steps: ("equal" | "delete" | "insert")[] = [];
  if (n === 0 || m === 0) {
    for (let i = 0; i < n; i++) steps.push("delete");
    for (let i = 0; i < m; i++) steps.push("insert");
  } else {
    // trace[d][(k + d) >> 1] = furthest x on diagonal k after d edits. Memory grows with the
    // square of the edit count, so past MAX_EDITS the stretch is given up on as one replacement.
    const trace: Int32Array[] = [];
    const max = Math.min(n + m, MAX_EDITS);
    let found = false;
    for (let d = 0; d <= max && !found; d++) {
      const prev = trace[d - 1];
      const at = (k: number) => prev[(k + d - 1) >> 1];
      const cur = new Int32Array(d + 1);
      for (let k = -d; k <= d; k += 2) {
        let x = d === 0 ? 0 : k === -d || (k !== d && at(k - 1) < at(k + 1)) ? at(k + 1) : at(k - 1) + 1;
        let y = x - k;
        while (x < n && y < m && a[start + x] === b[start + y]) {
          x++;
          y++;
        }
        cur[(k + d) >> 1] = x;
        if (x >= n && y >= m) {
          found = true;
          break;
        }
      }
      trace.push(cur);
    }
    if (!found) {
      const out: DiffRange[] = [];
      if (start > 0) out.push({ equal: true, aStart: 0, aEnd: start, bStart: 0, bEnd: start });
      out.push({ equal: false, aStart: start, aEnd: endA, bStart: start, bEnd: endB });
      if (endA < a.length) out.push({ equal: true, aStart: endA, aEnd: a.length, bStart: endB, bEnd: b.length });
      return out;
    }
    // Walk back from the end to the start
    let x = n;
    let y = m;
    for (let d = trace.length - 1; d > 0; d--) {
      const prev = trace[d - 1];
      const at = (k: number) => prev[(k + d - 1) >> 1];
      const k = x - y;
      const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
      const prevK = down ? k + 1 : k - 1;
      const prevX = at(prevK);
      const prevY = prevX - prevK;
      const midX = down ? prevX : prevX + 1;
      while (x > midX) {
        steps.push("equal");
        x--;
        y--;
      }
      steps.push(down ? "insert" : "delete");
      x = prevX;
      y = prevY;
    }
    while (x > 0) {
      steps.push("equal");
      x--;
    }
    steps.reverse();
  }

  // Steps to ranges: equal runs, and everything between them as one change
  const out: DiffRange[] = [];
  if (start > 0) out.push({ equal: true, aStart: 0, aEnd: start, bStart: 0, bEnd: start });
  let ai = start;
  let bi = start;
  let i = 0;
  while (i < steps.length) {
    const r: DiffRange = { equal: steps[i] === "equal", aStart: ai, aEnd: ai, bStart: bi, bEnd: bi };
    while (i < steps.length && (steps[i] === "equal") === r.equal) {
      if (steps[i] !== "insert") ai++;
      if (steps[i] !== "delete") bi++;
      i++;
    }
    r.aEnd = ai;
    r.bEnd = bi;
    out.push(r);
  }
  if (endA < a.length) out.push({ equal: true, aStart: endA, aEnd: a.length, bStart: endB, bEnd: b.length });
  return out;
}

/**
 * Folds short equal runs that sit between two changes into the change: "the quick brown" →
 * "a slow red" reads as one replacement, not three with spaces kept in between. A run is
 * short when it is only spaces and punctuation, or (with `words`) at most that many words.
 */
function cleanup(ranges: DiffRange[], a: readonly string[], words = 0): DiffRange[] {
  const out: DiffRange[] = [];
  const trivial = (r: DiffRange) => {
    const toks = a.slice(r.aStart, r.aEnd);
    if (toks.every((t) => !/[\p{L}\p{N}]/u.test(t))) return true;
    return words > 0 && toks.filter((t) => /[\p{L}\p{N}]/u.test(t)).length <= words;
  };
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const prev = out.at(-1);
    const next = ranges[i + 1];
    if (r.equal && prev && !prev.equal && next && !next.equal && trivial(r)) {
      prev.aEnd = next.aEnd;
      prev.bEnd = next.bEnd;
      i++;
      continue;
    }
    if (!r.equal && prev && !prev.equal) {
      prev.aEnd = r.aEnd;
      prev.bEnd = r.bEnd;
      continue;
    }
    out.push({ ...r });
  }
  return out;
}

function rangesToParts(ranges: DiffRange[], a: readonly string[], b: readonly string[]): DiffPart[] {
  const parts: DiffPart[] = [];
  const push = (op: DiffOp, text: string) => {
    if (!text) return;
    const last = parts.at(-1);
    if (last?.op === op) last.text += text;
    else parts.push({ op, text });
  };
  for (const r of ranges) {
    if (r.equal) push("equal", a.slice(r.aStart, r.aEnd).join(""));
    else {
      push("delete", a.slice(r.aStart, r.aEnd).join(""));
      push("insert", b.slice(r.bStart, r.bEnd).join(""));
    }
  }
  return parts;
}

export interface DiffOptions {
  /**
   * Fold spaces and punctuation between two changes into one change, so a reworded phrase reads
   * as one replacement. Default true for words and lines, false for characters.
   */
  cleanup?: boolean;
}

/** Diffs two texts at a granularity: the parts, in order, that rebuild `a` (equal + delete) and `b` (equal + insert). */
export function diff(a: string, b: string, granularity: Granularity = "word", options: DiffOptions = {}): DiffPart[] {
  const ta = tokenize(a, granularity);
  const tb = tokenize(b, granularity);
  let ranges = diffSequences(ta, tb);
  if (options.cleanup ?? granularity !== "char") ranges = cleanup(ranges, ta);
  return rangesToParts(ranges, ta, tb);
}

/** Character diff: precise, the right one for moving a caret, noisy to read */
export const diffChars = (a: string, b: string, options?: DiffOptions) => diff(a, b, "char", options);
/** Word diff: what people read. Spaces and punctuation between changed words fold into the change. */
export const diffWords = (a: string, b: string, options?: DiffOptions) => diff(a, b, "word", options);
/** Line diff, for code and lists */
export const diffLines = (a: string, b: string, options?: DiffOptions) => diff(a, b, "line", options);

/** The old text (equal + delete parts) or the new one (equal + insert) back from a diff */
export function diffSide(parts: readonly DiffPart[], side: "before" | "after"): string {
  const skip: DiffOp = side === "before" ? "insert" : "delete";
  return parts.filter((p) => p.op !== skip).map((p) => p.text).join("");
}

/** True when a diff has any change in it */
export const hasChanges = (parts: readonly DiffPart[]) => parts.some((p) => p.op !== "equal");

// ---------------------------------------------------------------------------------------------
// Three-way merge

/** Where a clean stretch of a merge came from: nobody changed it, one side did, or both made the same change */
export type MergeSource = "base" | "mine" | "theirs" | "both";

/** A stretch of a three-way merge: settled, or changed differently by both sides */
export type MergeChunk =
  | { type: "clean"; text: string; from: MergeSource; /** What the base had here, for chunks a side changed (empty text: they deleted it) */ base?: string }
  | { type: "conflict"; base: string; mine: string; theirs: string };

export interface MergeResult {
  chunks: MergeChunk[];
  /** How many conflict chunks there are */
  conflicts: number;
}

/** A three-way merge on token sequences; the chunks hold token arrays. merge3 and mergeBlocks are built on it. */
export type TokenChunk =
  | { type: "clean"; tokens: string[]; from: MergeSource; base?: string[] }
  | { type: "conflict"; base: string[]; mine: string[]; theirs: string[] };

interface Hunk {
  side: "mine" | "theirs";
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
}

function hunks(base: readonly string[], other: readonly string[], side: Hunk["side"]): Hunk[] {
  return diffSequences(base, other)
    .filter((r) => !r.equal)
    .map((r) => ({ side, aStart: r.aStart, aEnd: r.aEnd, bStart: r.bStart, bEnd: r.bEnd }));
}

/**
 * Whether a hunk touches a region of the base. Overlapping ranges do; so do two insertions at the
 * same place (which order is right is anyone's guess). Edits that only meet at an edge don't: a
 * word replaced by one side and a word added right after it by the other merge cleanly.
 */
function touches(h: Hunk, rs: number, re: number): boolean {
  const empty = h.aStart === h.aEnd;
  if (rs === re) return empty ? h.aStart === rs : h.aStart < rs && rs < h.aEnd;
  return empty ? h.aStart > rs && h.aStart < re : h.aStart < re && rs < h.aEnd;
}

/** The base region [rs, re) with one side's hunks in it applied */
function apply(base: readonly string[], side: readonly string[], hs: Hunk[], rs: number, re: number): string[] {
  const out: string[] = [];
  let pos = rs;
  for (const h of hs) {
    out.push(...base.slice(pos, h.aStart), ...side.slice(h.bStart, h.bEnd));
    pos = h.aEnd;
  }
  out.push(...base.slice(pos, re));
  return out;
}

const same = (x: readonly string[], y: readonly string[]) => x.length === y.length && x.every((t, i) => t === y[i]);

/**
 * diff3 on tokens: the base diffed against each side; where only one side changed a stretch, that
 * change is taken; where both changed it the same way, once; where both changed it differently,
 * a conflict. Conflicts are trimmed of tokens mine and theirs share at either end, which become
 * clean, so a conflict is only the part the two really disagree on.
 */
export function merge3Tokens(base: readonly string[], mine: readonly string[], theirs: readonly string[], options: { trim?: boolean } = {}): TokenChunk[] {
  const trim = options.trim ?? true;
  const all = [...hunks(base, mine, "mine"), ...hunks(base, theirs, "theirs")].sort(
    (x, y) => x.aStart - y.aStart || (x.aEnd - x.aStart) - (y.aEnd - y.aStart),
  );
  const out: TokenChunk[] = [];
  // Unchanged stretches only when there is something in them; a side's change always, even a
  // deletion (no tokens), so every change can be counted and shown
  const clean = (tokens: string[], from: MergeSource, was?: string[]) => {
    if (from === "base" && tokens.length === 0) return;
    out.push(from === "base" ? { type: "clean", tokens, from } : { type: "clean", tokens, from, base: was ?? [] });
  };
  let pos = 0;
  let i = 0;
  while (i < all.length) {
    let rs = all[i].aStart;
    let re = all[i].aEnd;
    const group = [all[i++]];
    while (i < all.length && touches(all[i], rs, re)) {
      rs = Math.min(rs, all[i].aStart);
      re = Math.max(re, all[i].aEnd);
      group.push(all[i++]);
    }
    clean(base.slice(pos, rs), "base");
    pos = re;
    const gm = group.filter((h) => h.side === "mine");
    const gt = group.filter((h) => h.side === "theirs");
    const m = apply(base, mine, gm, rs, re);
    const t = apply(base, theirs, gt, rs, re);
    const was = base.slice(rs, re);
    if (gt.length === 0) clean(m, "mine", was);
    else if (gm.length === 0) clean(t, "theirs", was);
    else if (same(m, t)) clean(m, "both", was);
    else {
      let pre = 0;
      while (trim && pre < m.length && pre < t.length && m[pre] === t[pre]) pre++;
      let suf = 0;
      while (trim && suf < m.length - pre && suf < t.length - pre && m[m.length - 1 - suf] === t[t.length - 1 - suf]) suf++;
      if (pre > 0) clean(m.slice(0, pre), "both");
      out.push({ type: "conflict", base: was, mine: m.slice(pre, m.length - suf), theirs: t.slice(pre, t.length - suf) });
      if (suf > 0) clean(m.slice(m.length - suf), "both");
    }
  }
  clean(base.slice(pos), "base");
  return out;
}

/**
 * Three-way merge of texts (diff3): what changed from `base` to `mine` and from `base` to
 * `theirs`, combined. Clean chunks say where they came from; conflict chunks hold all three
 * versions of the stretch both sides changed differently. Word granularity suits prose (two
 * people changing different words of one sentence merge cleanly); line granularity suits code.
 */
export function merge3(base: string, mine: string, theirs: string, granularity: Granularity = "word"): MergeResult {
  const chunks: MergeChunk[] = merge3Tokens(tokenize(base, granularity), tokenize(mine, granularity), tokenize(theirs, granularity)).map((c) =>
    c.type === "clean"
      ? c.base
        ? { type: "clean", text: c.tokens.join(""), from: c.from, base: c.base.join("") }
        : { type: "clean", text: c.tokens.join(""), from: c.from }
      : { type: "conflict", base: c.base.join(""), mine: c.mine.join(""), theirs: c.theirs.join("") },
  );
  return { chunks, conflicts: chunks.filter((c) => c.type === "conflict").length };
}

/** How to settle a conflict when writing a merge out: one side, both (mine first), or a function of the chunk and its number */
export type Resolution = "mine" | "theirs" | "both" | ((chunk: Extract<MergeChunk, { type: "conflict" }>, index: number) => string);

/** Joins a few texts with a space between them where neither side already has one */
function joinBoth(x: string, y: string): string {
  if (!x) return y;
  if (!y) return x;
  return /\s$/.test(x) || /^\s/.test(y) ? x + y : `${x} ${y}`;
}

/** The text of a merge, with each conflict settled by `resolve` */
export function mergedText(result: MergeResult | readonly MergeChunk[], resolve: Resolution = "mine"): string {
  const chunks = "chunks" in result ? result.chunks : result;
  let n = 0;
  return chunks
    .map((c) => {
      if (c.type === "clean") return c.text;
      const i = n++;
      if (typeof resolve === "function") return resolve(c, i);
      return resolve === "mine" ? c.mine : resolve === "theirs" ? c.theirs : joinBoth(c.mine, c.theirs);
    })
    .join("");
}

// ---------------------------------------------------------------------------------------------
// Carets

/** A selection as offsets into a text (start ≤ end; equal for a plain caret) */
export interface TextSelection {
  start: number;
  end: number;
}

/**
 * Where an offset in the old text of a diff lands in the new one. Inside deleted text it moves to
 * where the deletion was. For text inserted exactly at the offset, `assoc` decides: -1 stays before
 * it, 1 moves after it. Use a character diff: a word diff moves carets by whole words.
 */
export function mapOffset(parts: readonly DiffPart[], offset: number, assoc: -1 | 1 = -1): number {
  let a = 0;
  let b = 0;
  for (const p of parts) {
    const len = p.text.length;
    if (p.op === "insert") {
      if (a === offset && assoc < 0) return b;
      b += len;
      continue;
    }
    if (p.op === "equal") {
      if (offset < a + len || (offset === a + len && assoc < 0)) return b + (offset - a);
      a += len;
      b += len;
      continue;
    }
    // delete
    if (offset < a + len) return b;
    a += len;
  }
  return b + Math.max(0, offset - a);
}

/**
 * Carries a selection across a change made by someone else, so your caret stays on the same
 * words while their text arrives around it. Text inserted right at a plain caret goes after it;
 * a selection doesn't grow to take in text inserted at its edges.
 */
export function mapSelection(before: string, after: string, sel: TextSelection, parts: readonly DiffPart[] = diffChars(before, after)): TextSelection {
  if (before === after) return sel;
  if (sel.start === sel.end) {
    const at = mapOffset(parts, sel.start, -1);
    return { start: at, end: at };
  }
  const start = mapOffset(parts, sel.start, 1);
  const end = Math.max(start, mapOffset(parts, sel.end, -1));
  return { start, end };
}

/** The offsets an edit occupies in the new text, for flashing what arrived: one range per insertion */
export function insertedRanges(parts: readonly DiffPart[]): TextSelection[] {
  const out: TextSelection[] = [];
  let b = 0;
  for (const p of parts) {
    if (p.op === "insert") out.push({ start: b, end: b + p.text.length });
    if (p.op !== "delete") b += p.text.length;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Markdown blocks

/** A list item line: "- ", "* ", "+ " or "1. " (task boxes included) */
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;

/**
 * Splits Markdown into blocks: paragraphs and headings (separated by blank lines), and each list
 * item on its own (with its continuation lines), so two people editing different items of one
 * list don't collide. Fenced code stays one block even with blank lines in it. Leading and
 * trailing blank lines are dropped.
 */
export function splitBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  let cur: string[] = [];
  let fence: string | null = null;
  const flush = () => {
    if (cur.length) blocks.push(cur.join("\n"));
    cur = [];
  };
  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const f = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      cur.push(line);
      if (f && f[0] === fence[0] && f.length >= fence.length) {
        fence = null;
        flush();
      }
      continue;
    }
    if (f) {
      flush();
      fence = f;
      cur.push(line);
      continue;
    }
    if (line.trim() === "") flush();
    else if (LIST_ITEM.test(line) || /^#{1,6}\s/.test(line)) {
      flush();
      cur.push(line);
      if (!LIST_ITEM.test(line)) flush();
    } else cur.push(line);
  }
  flush();
  return blocks;
}

/** Whether a block is a list item */
export const isListItem = (block: string) => LIST_ITEM.test(block);

/** Joins blocks back into Markdown: list items one per line, everything else with a blank line between */
export function joinBlocks(blocks: readonly string[]): string {
  let out = "";
  blocks.forEach((b, i) => {
    if (i > 0) out += isListItem(b) && isListItem(blocks[i - 1]) ? "\n" : "\n\n";
    out += b;
  });
  return out;
}

/** A stretch of a block-level merge: blocks that are settled, or blocks both sides changed differently */
export type BlockChunk =
  | { type: "clean"; blocks: string[]; from: MergeSource; /** The base's blocks here, for chunks a side changed */ base?: string[] }
  | { type: "conflict"; base: string[]; mine: string[]; theirs: string[] };

export interface BlockMergeResult {
  chunks: BlockChunk[];
  conflicts: number;
}

/**
 * Three-way merge of Markdown by blocks (paragraphs, headings, list items). Blocks only one side
 * changed are taken from that side. Where both changed the same blocks, and there are as many of
 * them on every side, each block is merged again word by word, so two people editing different
 * sentences of one paragraph still merge cleanly; only blocks with words changed differently by
 * both stay conflicts.
 */
export function mergeBlocks(base: string, mine: string, theirs: string): BlockMergeResult {
  const out: BlockChunk[] = [];
  const clean = (blocks: string[], from: MergeSource, was?: string[]) => {
    if (from === "base") {
      if (blocks.length === 0) return;
      const last = out.at(-1);
      if (last?.type === "clean" && last.from === "base") last.blocks.push(...blocks);
      else out.push({ type: "clean", blocks: [...blocks], from });
    } else out.push({ type: "clean", blocks: [...blocks], from, base: was ?? [] });
  };
  // Untrimmed, so a conflict has the same blocks on every side and can be merged block by block
  for (const c of merge3Tokens(splitBlocks(base), splitBlocks(mine), splitBlocks(theirs), { trim: false })) {
    if (c.type === "clean") {
      clean(c.tokens, c.from, c.base);
      continue;
    }
    // As many blocks on every side: merge them pairwise, word by word. Otherwise (a block split
    // in two on one side, say) the whole stretch is one conflict.
    if (c.base.length > 0 && c.base.length === c.mine.length && c.base.length === c.theirs.length) {
      c.base.forEach((b, i) => {
        const [m, t] = [c.mine[i], c.theirs[i]];
        if (m === b && t === b) return clean([b], "base");
        const r = merge3(b, m, t, "word");
        if (r.conflicts === 0) clean([mergedText(r)], m === b ? "theirs" : t === b ? "mine" : "both", [b]);
        else out.push({ type: "conflict", base: [b], mine: [m], theirs: [t] });
      });
    } else out.push({ type: "conflict", base: c.base, mine: c.mine, theirs: c.theirs });
  }
  return { chunks: out, conflicts: out.filter((c) => c.type === "conflict").length };
}

/** The Markdown of a block merge, each conflict settled by `resolve` ("both" keeps mine, then theirs) */
export function mergedBlocks(
  result: BlockMergeResult,
  resolve: "mine" | "theirs" | "both" | ((chunk: Extract<BlockChunk, { type: "conflict" }>, index: number) => string[]) = "mine",
): string {
  let n = 0;
  return joinBlocks(
    result.chunks.flatMap((c) => {
      if (c.type === "clean") return c.blocks;
      const i = n++;
      if (typeof resolve === "function") return resolve(c, i);
      return resolve === "mine" ? c.mine : resolve === "theirs" ? c.theirs : [...c.mine, ...c.theirs];
    }),
  );
}

/** One row of a block diff: a block that stayed, changed (with the word diff), was added or was removed */
export type BlockDiffRow =
  | { op: "equal"; before: string; after: string }
  | { op: "change"; before: string; after: string; parts: DiffPart[] }
  | { op: "insert"; after: string }
  | { op: "delete"; before: string };

/**
 * Compares two Markdown texts block by block, for a side-by-side view: changed blocks are paired
 * in order with their word diff; extra blocks on either side are added or removed rows.
 */
export function diffBlocks(before: string, after: string): BlockDiffRow[] {
  const a = splitBlocks(before);
  const b = splitBlocks(after);
  const rows: BlockDiffRow[] = [];
  for (const r of diffSequences(a, b)) {
    if (r.equal) {
      for (let i = r.aStart; i < r.aEnd; i++) rows.push({ op: "equal", before: a[i], after: b[r.bStart + i - r.aStart] });
      continue;
    }
    const pairs = Math.min(r.aEnd - r.aStart, r.bEnd - r.bStart);
    for (let i = 0; i < pairs; i++) {
      const x = a[r.aStart + i];
      const y = b[r.bStart + i];
      rows.push({ op: "change", before: x, after: y, parts: diffWords(x, y) });
    }
    for (let i = r.aStart + pairs; i < r.aEnd; i++) rows.push({ op: "delete", before: a[i] });
    for (let i = r.bStart + pairs; i < r.bEnd; i++) rows.push({ op: "insert", after: b[i] });
  }
  return rows;
}
