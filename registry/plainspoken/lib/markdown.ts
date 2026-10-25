/*
 * Markdown with no dependencies, for the rich text editor and anything else that needs it:
 *
 *   parseMarkdown(text)  Markdown → a small syntax tree (CommonMark's blocks and inlines, plus
 *                        GFM's strikethrough, task lists, tables and bare https:// links)
 *   renderHtml(tree)     the tree → HTML that is safe to show, whatever the Markdown was
 *   readHtml(element)    HTML (an editor's DOM, or pasted from anywhere) → the tree, keeping only
 *                        what Markdown can say
 *   toMarkdown(tree)     the tree → Markdown, escaped so it reads back as the same tree
 *
 * Safety: raw HTML in the source is never passed through; it shows as the text it is. Links and
 * images keep only http(s):, mailto:, blob:, data:image/… and relative URLs (see safeUrl); any
 * other link is drawn as its text and any other image as its alt text.
 *
 * Not supported (they stay text): raw HTML, footnotes, setext headings when writing (they are
 * read), indented code when writing (read, written fenced), and reference links when writing
 * (read, written inline).
 */

// ---------------------------------------------------------------------------------------------
// The tree

export type MdInline =
  | { type: "text"; value: string }
  | { type: "strong" | "em" | "del"; children: MdInline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; title?: string; children: MdInline[] }
  | { type: "image"; src: string; alt: string; title?: string }
  /** A hard line break: `\` or two spaces at the end of a line */
  | { type: "break" }
  /** A plain line end inside a paragraph, which reads as a space */
  | { type: "softbreak" };

export type MdAlign = "left" | "center" | "right" | null;

export interface MdListItem {
  /** true or false for a task (`- [x]`), null for a plain item */
  checked: boolean | null;
  children: MdBlock[];
}

export type MdBlock =
  | { type: "paragraph"; children: MdInline[] }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
  | { type: "code"; lang: string; value: string }
  | { type: "quote"; children: MdBlock[] }
  /** loose: blank lines between items, so each item's text is a paragraph of its own */
  | { type: "list"; ordered: boolean; start: number; loose: boolean; items: MdListItem[] }
  | { type: "rule" }
  | { type: "table"; align: MdAlign[]; head: MdInline[][]; rows: MdInline[][][] };

// ---------------------------------------------------------------------------------------------
// URLs

/**
 * The URL if a link or an image may use it, else null. Allowed: http:, https:, mailto:, blob:,
 * data:image/… (pictures only), and URLs with no scheme (relative ones, #anchors). Browsers
 * ignore control characters and spaces in a scheme ("java\tscript:"), so they are dropped
 * before the scheme is read.
 */
export function safeUrl(url: string): string | null {
  const u = url.trim();
  const probe = u.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(probe);
  if (!scheme) return u;
  const s = scheme[1].toLowerCase();
  if (s === "http" || s === "https" || s === "mailto" || s === "blob") return u;
  if (s === "data" && /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp|svg\+xml|x-icon)[;,]/i.test(probe)) return u;
  return null;
}

// ---------------------------------------------------------------------------------------------
// Shared bits

const ESCAPABLE = /^[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]$/;
const isWs = (c: string) => c === "" || /\s/.test(c);
const isPunct = (c: string) => c !== "" && /[\p{P}\p{S}]/u.test(c);
const isAlnum = (c: string) => c !== "" && /[\p{L}\p{N}]/u.test(c);

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", ensp: "\u2002", emsp: "\u2003", thinsp: "\u2009",
  shy: "\u00ad", copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’",
  sbquo: "‚", ldquo: "“", rdquo: "”", bdquo: "„", laquo: "«", raquo: "»", bull: "•", middot: "·", times: "×",
  divide: "÷", minus: "−", plusmn: "±", deg: "°", micro: "µ", para: "¶", sect: "§", euro: "€", pound: "£",
  yen: "¥", cent: "¢", larr: "←", rarr: "→", uarr: "↑", darr: "↓", harr: "↔", check: "✓", frac12: "½",
  frac14: "¼", frac34: "¾", sup2: "²", sup3: "³", prime: "′", Prime: "″",
};

function decodeEntity(e: string): string | null {
  if (e[1] === "#") {
    const n = e[2] === "x" || e[2] === "X" ? parseInt(e.slice(3, -1), 16) : parseInt(e.slice(2, -1), 10);
    return !n || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ? "\ufffd" : String.fromCodePoint(n);
  }
  return NAMED[e.slice(1, -1)] ?? null;
}

const ENTITY = /&(?:#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/y;

/** Backslash escapes and entities, for link destinations, titles and code block info strings */
function unescapeString(s: string): string {
  return s.replace(/\\([!-/:-@[-`{-~])|&(?:#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/g, (m, ch: string | undefined) =>
    ch ?? decodeEntity(m) ?? m,
  );
}

const normLabel = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------------------------
// Blocks

interface Ref {
  href: string;
  title?: string;
}

/** A block whose inline text is still raw; turned into MdBlock once all reference links are known */
type RawBlock =
  | { type: "paragraph"; raw: string }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; raw: string }
  | { type: "code"; lang: string; value: string }
  | { type: "quote"; children: RawBlock[] }
  | { type: "list"; ordered: boolean; start: number; loose: boolean; items: { checked: boolean | null; children: RawBlock[] }[] }
  | { type: "rule" }
  | { type: "table"; align: MdAlign[]; head: string[]; rows: string[][] };

const RE_ATX = /^ {0,3}(#{1,6})(?=[ \t]|$)(.*)$/;
const RE_HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const RE_FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const RE_FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
const RE_QUOTE = /^ {0,3}>/;
const RE_SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const RE_TABLE_DELIM = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
const RE_DEF =
  /^ {0,3}\[((?:[^\\[\]]|\\.){1,999})\]:[ \t]*\n?[ \t]*(<[^<>\n]*>|[^\s<>][^\s]*)(?:(?:[ \t]+|[ \t]*\n[ \t]*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\((?:[^()\\]|\\.)*\)))?[ \t]*(?:\n|$)/;

const isBlank = (s: string) => /^[ \t]*$/.test(s);

/** Columns of leading whitespace, a tab reaching the next multiple of 4 */
function indentOf(line: string): number {
  let col = 0;
  for (const ch of line) {
    if (ch === " ") col++;
    else if (ch === "\t") col += 4 - (col % 4);
    else break;
  }
  return col;
}

/** The line less up to n columns of leading whitespace; a tab only partly removed leaves spaces */
function dedent(line: string, n: number): string {
  let col = 0;
  let i = 0;
  while (i < line.length && col < n) {
    const ch = line[i];
    if (ch === " ") {
      col++;
      i++;
    } else if (ch === "\t") {
      const w = 4 - (col % 4);
      if (col + w > n) return " ".repeat(col + w - n) + line.slice(i + 1);
      col += w;
      i++;
    } else break;
  }
  return line.slice(i);
}

interface Marker {
  ordered: boolean;
  /** The bullet (- + *) or the delimiter after the number (. or )) */
  char: string;
  start: number;
  /** Columns from the line start to the item's content */
  width: number;
  /** The first line's content */
  rest: string;
  empty: boolean;
}

function listMarker(line: string): Marker | null {
  if (indentOf(line) > 3) return null;
  const m = /^( {0,3})(?:([-+*])|(\d{1,9})([.)]))(?=[ \t]|$)/.exec(line);
  if (!m) return null;
  const after = line.slice(m[0].length);
  const markerEnd = m[1].length + (m[2] ? 1 : m[3].length + 1);
  const empty = isBlank(after);
  const spaces = indentOf(after);
  const gap = empty || spaces >= 5 ? 1 : spaces;
  return {
    ordered: !m[2],
    char: m[2] ?? m[4],
    start: m[3] ? parseInt(m[3], 10) : 1,
    width: markerEnd + gap,
    rest: empty ? "" : dedent(after, gap),
    empty,
  };
}

function fenceStart(line: string) {
  const m = RE_FENCE.exec(line);
  if (!m || (m[2][0] === "`" && m[3].includes("`"))) return null;
  return { indent: m[1].length, fence: m[2], info: m[3] };
}

/** Whether `line` starts a block. Inside a paragraph (`para`), only the ones that may interrupt it count. */
function startsBlock(line: string, para = false): boolean {
  if (indentOf(line) >= 4) return false;
  if (RE_ATX.test(line) || RE_HR.test(line) || RE_QUOTE.test(line) || fenceStart(line)) return true;
  const mk = listMarker(line);
  if (!mk) return false;
  return !para || (!mk.empty && (!mk.ordered || mk.start === 1));
}

/** Whether the last line of `lines` is paragraph text, so the next line may continue it lazily */
function endsInParagraph(lines: string[]): boolean {
  let open: string | null = null;
  let last = "";
  for (const l of lines) {
    if (open) {
      const c = RE_FENCE_CLOSE.exec(l);
      if (c && c[1][0] === open[0] && c[1].length >= open.length) open = null;
    } else {
      const f = fenceStart(l);
      if (f) open = f.fence;
    }
    last = l;
  }
  if (open || isBlank(last)) return false;
  const inner = last.replace(/^(?: {0,3}> ?)+/, "");
  return !isBlank(inner) && indentOf(last) < 4 && !RE_ATX.test(inner) && !RE_HR.test(inner) && !fenceStart(inner);
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") {
      cur += "\\|";
      i++;
    } else if (s[i] === "|") {
      cells.push(cur.trim());
      cur = "";
    } else cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

/** Link reference definitions at the start of a paragraph: stored in refs, and the rest of the text returned */
function takeDefinitions(text: string, refs: Map<string, Ref>): string {
  for (;;) {
    const m = RE_DEF.exec(text);
    if (!m) return text;
    const label = normLabel(m[1].replace(/\\([[\]])/g, "$1"));
    if (!label) return text;
    if (!refs.has(label)) {
      const href = unescapeString(m[2].startsWith("<") ? m[2].slice(1, -1) : m[2]);
      refs.set(label, { href, title: m[3] ? unescapeString(m[3].slice(1, -1)) : undefined });
    }
    text = text.slice(m[0].length);
  }
}

interface Parsed {
  blocks: RawBlock[];
  /** First and last line of each block, to tell tight lists from loose ones */
  spans: [number, number][];
}

function parseBlocks(lines: string[], refs: Map<string, Ref>): Parsed {
  const blocks: RawBlock[] = [];
  const spans: [number, number][] = [];
  const push = (b: RawBlock, from: number, to: number) => {
    blocks.push(b);
    spans.push([from, to]);
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }
    const from = i;

    // Indented code
    if (indentOf(line) >= 4) {
      const buf: string[] = [];
      let last = i;
      while (i < lines.length && (isBlank(lines[i]) || indentOf(lines[i]) >= 4)) {
        if (!isBlank(lines[i])) last = i;
        buf.push(dedent(lines[i], 4));
        i++;
      }
      buf.length = last - from + 1;
      i = last + 1;
      push({ type: "code", lang: "", value: buf.join("\n") }, from, last);
      continue;
    }

    // Fenced code
    const f = fenceStart(line);
    if (f) {
      const lang = unescapeString(f.info.trim().split(/[ \t]/)[0] ?? "");
      const buf: string[] = [];
      i++;
      while (i < lines.length) {
        const c = RE_FENCE_CLOSE.exec(lines[i]);
        if (c && c[1][0] === f.fence[0] && c[1].length >= f.fence.length) {
          i++;
          break;
        }
        buf.push(lines[i].replace(new RegExp(`^ {0,${f.indent}}`), ""));
        i++;
      }
      push({ type: "code", lang, value: buf.join("\n") }, from, i - 1);
      continue;
    }

    // ATX heading
    const h = RE_ATX.exec(line);
    if (h) {
      const raw = h[2].trim().replace(/(?:^|[ \t]+)#+$/, "").trim();
      push({ type: "heading", level: h[1].length as 1 | 2 | 3 | 4 | 5 | 6, raw }, from, i);
      i++;
      continue;
    }

    if (RE_HR.test(line)) {
      push({ type: "rule" }, from, i);
      i++;
      continue;
    }

    // Blockquote, with lazy continuation lines
    if (RE_QUOTE.test(line)) {
      const buf: string[] = [];
      while (i < lines.length) {
        const l = lines[i];
        if (RE_QUOTE.test(l)) buf.push(l.replace(/^ {0,3}> ?/, ""));
        else if (!isBlank(l) && !startsBlock(l) && endsInParagraph(buf)) buf.push(l);
        else break;
        i++;
      }
      push({ type: "quote", children: parseBlocks(buf, refs).blocks }, from, i - 1);
      continue;
    }

    // List
    const mk = listMarker(line);
    if (mk) {
      const list: Extract<RawBlock, { type: "list" }> = { type: "list", ordered: mk.ordered, start: mk.start, loose: false, items: [] };
      let last = i;
      while (i < lines.length) {
        const m = listMarker(lines[i]);
        if (!m || m.ordered !== mk.ordered || m.char !== mk.char || RE_HR.test(lines[i])) break;
        const buf = [m.rest];
        i++;
        let checked: boolean | null = null;
        const t = /^\[([ xX])\](?=[ \t]|$)[ \t]?/.exec(buf[0]);
        if (t) {
          checked = t[1] !== " ";
          buf[0] = buf[0].slice(t[0].length);
        }
        while (i < lines.length) {
          const l = lines[i];
          if (isBlank(l)) {
            let j = i;
            while (j < lines.length && isBlank(lines[j])) j++;
            if (j < lines.length && indentOf(lines[j]) >= m.width && !(m.empty && buf.length === 1)) {
              for (; i < j; i++) buf.push("");
              continue;
            }
            break;
          }
          if (indentOf(l) >= m.width) buf.push(dedent(l, m.width));
          else if (!startsBlock(l) && endsInParagraph(buf)) buf.push(l.replace(/^[ \t]+/, ""));
          else break;
          i++;
        }
        last = i - 1;
        const inner = parseBlocks(buf, refs);
        for (let k = 1; k < inner.spans.length; k++) if (inner.spans[k][0] > inner.spans[k - 1][1] + 1) list.loose = true;
        list.items.push({ checked, children: inner.blocks });
        // Blank lines and then another item: a loose list
        let j = i;
        while (j < lines.length && isBlank(lines[j])) j++;
        if (j > i && j < lines.length) {
          const next = listMarker(lines[j]);
          if (next && next.ordered === mk.ordered && next.char === mk.char && !RE_HR.test(lines[j])) {
            list.loose = true;
            i = j;
          }
        }
      }
      push(list, from, last);
      continue;
    }

    // Table: a header row, then a delimiter row with as many cells
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("|") && RE_TABLE_DELIM.test(lines[i + 1])) {
      const head = splitRow(line);
      const delims = splitRow(lines[i + 1]);
      if (head.length === delims.length) {
        const align = delims.map((d): MdAlign => {
          const l = d.startsWith(":");
          const r = d.endsWith(":");
          return l && r ? "center" : r ? "right" : l ? "left" : null;
        });
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i])) {
          const cells = splitRow(lines[i]);
          rows.push(head.map((_, k) => cells[k] ?? ""));
          i++;
        }
        push({ type: "table", align, head, rows }, from, i - 1);
        continue;
      }
    }

    // Paragraph, which may turn out to be a setext heading or link definitions
    const buf = [line.replace(/^[ \t]+/, "")];
    let level: 1 | 2 | 0 = 0;
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (isBlank(l)) break;
      const sx = RE_SETEXT.exec(l);
      if (sx) {
        level = sx[1][0] === "=" ? 1 : 2;
        i++;
        break;
      }
      if (startsBlock(l, true)) break;
      buf.push(l.replace(/^[ \t]+/, ""));
      i++;
    }
    const text = takeDefinitions(buf.join("\n"), refs);
    if (level && text.trim()) push({ type: "heading", level, raw: text.trim() }, from, i - 1);
    else if (text.trim()) push({ type: "paragraph", raw: text.replace(/[ \t]+$/, "") }, from, i - 1);
  }
  return { blocks, spans };
}

function finishBlocks(raw: RawBlock[], refs: Map<string, Ref>): MdBlock[] {
  return raw.map((b): MdBlock => {
    switch (b.type) {
      case "paragraph":
        return { type: "paragraph", children: parseInline(b.raw, refs) };
      case "heading":
        return { type: "heading", level: b.level, children: parseInline(b.raw, refs) };
      case "quote":
        return { type: "quote", children: finishBlocks(b.children, refs) };
      case "list":
        return { ...b, items: b.items.map((it) => ({ checked: it.checked, children: finishBlocks(it.children, refs) })) };
      case "table":
        return {
          type: "table",
          align: b.align,
          head: b.head.map((c) => parseInline(c, refs)),
          rows: b.rows.map((r) => r.map((c) => parseInline(c, refs))),
        };
      default:
        return b;
    }
  });
}

/** Markdown → the syntax tree */
export function parseMarkdown(src: string): MdBlock[] {
  const lines = src.replace(/\r\n?/g, "\n").replace(/\u0000/g, "\ufffd").split("\n");
  const refs = new Map<string, Ref>();
  return finishBlocks(parseBlocks(lines, refs).blocks, refs);
}

// ---------------------------------------------------------------------------------------------
// Inlines: CommonMark's delimiter algorithm for emphasis, and its bracket rules for links

interface Delim {
  kind: "delim";
  char: string;
  count: number;
  orig: number;
  open: boolean;
  close: boolean;
}
interface Bracket {
  kind: "bracket";
  image: boolean;
  active: boolean;
  /** Where the text inside the brackets starts in the source */
  at: number;
}
type Piece = MdInline | Delim | Bracket;

const isDelim = (p: Piece): p is Delim => "kind" in p && p.kind === "delim";
const isBracket = (p: Piece): p is Bracket => "kind" in p && p.kind === "bracket";

function sticky(re: RegExp, src: string, at: number): RegExpExecArray | null {
  re.lastIndex = at;
  return re.exec(src);
}

const RE_AUTOLINK = /<([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s<>]*)>/y;
const RE_EMAIL = /<([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/y;
const RE_BARE_URL = /https?:\/\/[^\s<]+/iy;

/** A bare URL's end: no trailing punctuation, and no closing parenthesis it didn't open (GFM's rule) */
function trimUrl(url: string): string {
  let u = url.replace(/[?!.,:*_~'";]+$/, "");
  while (u.endsWith(")") && (u.match(/\(/g)?.length ?? 0) < (u.match(/\)/g)?.length ?? 0)) u = u.slice(0, -1).replace(/[?!.,:*_~'";]+$/, "");
  return u;
}

/** After `]` at `pos`: an inline link `(dest "title")`, or a reference `[label]`, `[]` or nothing */
function linkTail(src: string, pos: number, label: string, refs: Map<string, Ref>): (Ref & { end: number }) | null {
  if (src[pos] === "(") {
    let p = pos + 1;
    const skip = () => {
      while (p < src.length && /[ \t\n]/.test(src[p])) p++;
    };
    skip();
    let href = "";
    let ok = true;
    if (src[p] === "<") {
      const m = sticky(/<((?:[^<>\n\\]|\\.)*)>/y, src, p);
      if (m) {
        href = m[1];
        p += m[0].length;
      } else ok = false;
    } else {
      const s = p;
      let depth = 0;
      while (p < src.length) {
        const ch = src[p];
        if (ch === "\\" && ESCAPABLE.test(src[p + 1] ?? "")) {
          p += 2;
          continue;
        }
        if (ch === "(") depth++;
        else if (ch === ")") {
          if (depth === 0) break;
          depth--;
        } else if (/[\s\u0000-\u001f]/.test(ch)) break;
        p++;
      }
      href = src.slice(s, p);
      if (depth !== 0) ok = false;
    }
    if (ok) {
      const beforeTitle = p;
      skip();
      let title: string | undefined;
      const q = src[p];
      if ((q === '"' || q === "'" || q === "(") && p > beforeTitle) {
        const close = q === "(" ? ")" : q;
        const re = new RegExp(`\\${q}((?:[^\\\\${close === ")" ? "()" : close}]|\\\\.)*)\\${close}`, "y");
        const m = sticky(re, src, p);
        if (m) {
          title = unescapeString(m[1]);
          p += m[0].length;
          skip();
        }
      }
      if (src[p] === ")") return { href: unescapeString(href), title, end: p + 1 };
    }
  }
  if (src[pos] === "[") {
    const m = sticky(/\[((?:[^\\[\]]|\\.){0,999})\]/y, src, pos);
    if (m) {
      const ref = refs.get(normLabel(m[1] || label));
      if (ref) return { ...ref, end: pos + m[0].length };
      if (m[1]) return null;
    }
  }
  const ref = label.trim() ? refs.get(normLabel(label)) : undefined;
  return ref ? { ...ref, end: pos } : null;
}

function parseInline(src: string, refs: Map<string, Ref>): MdInline[] {
  const out: Piece[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ type: "text", value: text });
    text = "";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const n = src[i + 1] ?? "";
      if (n === "\n") {
        flush();
        out.push({ type: "break" });
        i += 2;
        while (src[i] === " " || src[i] === "\t") i++;
      } else if (ESCAPABLE.test(n)) {
        text += n;
        i += 2;
      } else {
        text += "\\";
        i++;
      }
      continue;
    }
    if (c === "`") {
      let j = i;
      while (src[j] === "`") j++;
      const n = j - i;
      let k = j;
      let found = -1;
      while (k < src.length) {
        const at = src.indexOf("`", k);
        if (at < 0) break;
        let e = at;
        while (src[e] === "`") e++;
        if (e - at === n) {
          found = at;
          break;
        }
        k = e;
      }
      if (found >= 0) {
        let code = src.slice(j, found).replace(/\n/g, " ");
        if (code.length > 1 && code[0] === " " && code[code.length - 1] === " " && /[^ ]/.test(code)) code = code.slice(1, -1);
        flush();
        out.push({ type: "code", value: code });
        i = found + n;
      } else {
        text += src.slice(i, j);
        i = j;
      }
      continue;
    }
    if (c === "*" || c === "_" || c === "~") {
      let j = i;
      while (src[j] === c) j++;
      const count = j - i;
      if (c === "~" && count !== 2) {
        text += src.slice(i, j);
        i = j;
        continue;
      }
      const before = src[i - 1] ?? "";
      const after = src[j] ?? "";
      const left = !isWs(after) && (!isPunct(after) || isWs(before) || isPunct(before));
      const right = !isWs(before) && (!isPunct(before) || isWs(after) || isPunct(after));
      const open = c === "_" ? left && (!right || isPunct(before)) : left;
      const close = c === "_" ? right && (!left || isPunct(after)) : right;
      flush();
      out.push({ kind: "delim", char: c, count, orig: count, open, close });
      i = j;
      continue;
    }
    if (c === "!" && src[i + 1] === "[") {
      flush();
      out.push({ kind: "bracket", image: true, active: true, at: i + 2 });
      i += 2;
      continue;
    }
    if (c === "[") {
      flush();
      out.push({ kind: "bracket", image: false, active: true, at: i + 1 });
      i++;
      continue;
    }
    if (c === "]") {
      let b = -1;
      for (let k = out.length - 1; k >= 0; k--)
        if (isBracket(out[k])) {
          b = k;
          break;
        }
      const opener = b >= 0 ? (out[b] as Bracket) : null;
      const tail = opener?.active ? linkTail(src, i + 1, src.slice(opener.at, i), refs) : null;
      if (!opener || !tail) {
        if (opener) out[b] = { type: "text", value: opener.image ? "![" : "[" };
        text += "]";
        i++;
        continue;
      }
      flush();
      const inner = out.splice(b + 1);
      out.pop();
      const children = finishInline(resolveEmphasis(inner));
      if (opener.image) out.push({ type: "image", src: tail.href, alt: plainText(children), title: tail.title });
      else {
        out.push({ type: "link", href: tail.href, title: tail.title, children });
        for (const p of out) if (isBracket(p) && !p.image) p.active = false;
      }
      i = tail.end;
      continue;
    }
    if (c === "<") {
      const a = sticky(RE_AUTOLINK, src, i);
      const e = a ? null : sticky(RE_EMAIL, src, i);
      if (a || e) {
        flush();
        const m = (a ?? e)!;
        out.push({ type: "link", href: a ? m[1] : `mailto:${m[1]}`, children: [{ type: "text", value: m[1] }] });
        i += m[0].length;
        continue;
      }
    }
    if (c === "&") {
      const m = sticky(ENTITY, src, i);
      const d = m ? decodeEntity(m[0]) : null;
      if (m && d != null) {
        text += d;
        i += m[0].length;
        continue;
      }
    }
    if (c === "\n") {
      const hard = / {2,}$/.test(text);
      text = text.replace(/[ \t]+$/, "");
      flush();
      out.push({ type: hard ? "break" : "softbreak" });
      i++;
      while (src[i] === " " || src[i] === "\t") i++;
      continue;
    }
    if ((c === "h" || c === "H") && (i === 0 || /[\s*_~(]/.test(src[i - 1]))) {
      const m = sticky(RE_BARE_URL, src, i);
      const url = m ? trimUrl(m[0]) : "";
      if (url.length > 8) {
        flush();
        out.push({ type: "link", href: url, children: [{ type: "text", value: url }] });
        i += url.length;
        continue;
      }
    }
    text += c;
    i++;
  }
  flush();
  return finishInline(resolveEmphasis(out));
}

/** Pairs up * _ ~~ runs into strong, em and del (CommonMark's "process emphasis") */
function resolveEmphasis(pieces: Piece[]): Piece[] {
  let ci = 0;
  while (ci < pieces.length) {
    const closer = pieces[ci];
    if (!isDelim(closer) || !closer.close) {
      ci++;
      continue;
    }
    let found = -1;
    for (let oi = ci - 1; oi >= 0; oi--) {
      const o = pieces[oi];
      if (!isDelim(o) || o.char !== closer.char || !o.open) continue;
      if (closer.char === "~") {
        if (o.count === 2 && closer.count === 2) found = oi;
        if (found >= 0) break;
        continue;
      }
      if ((o.close || closer.open) && (o.orig + closer.orig) % 3 === 0 && !(o.orig % 3 === 0 && closer.orig % 3 === 0)) continue;
      found = oi;
      break;
    }
    if (found < 0) {
      ci++;
      continue;
    }
    const o = pieces[found] as Delim;
    const use = closer.char === "~" ? 2 : o.count >= 2 && closer.count >= 2 ? 2 : 1;
    const type = closer.char === "~" ? "del" : use === 2 ? "strong" : "em";
    const node: MdInline = { type, children: finishInline(pieces.slice(found + 1, ci)) };
    o.count -= use;
    closer.count -= use;
    pieces.splice(found + 1, ci - found - 1, node);
    ci = found + 2;
    if (o.count === 0) {
      pieces.splice(found, 1);
      ci--;
    }
    if (closer.count === 0) pieces.splice(ci, 1);
  }
  return pieces;
}

/** Unmatched delimiters and brackets back to text, and neighbouring texts joined */
function finishInline(pieces: Piece[]): MdInline[] {
  const out: MdInline[] = [];
  for (const p of pieces) {
    const n: MdInline = isDelim(p) ? { type: "text", value: p.char.repeat(p.count) } : isBracket(p) ? { type: "text", value: p.image ? "![" : "[" } : p;
    const prev = out[out.length - 1];
    if (n.type === "text" && prev?.type === "text") out[out.length - 1] = { type: "text", value: prev.value + n.value };
    else if (n.type !== "text" || n.value) out.push(n);
  }
  return out;
}

/** The text of inlines, without any markup (an image's alt text, a word count) */
export function plainText(nodes: MdInline[], withAlt = true): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case "text":
        case "code":
          return n.value;
        case "image":
          return withAlt ? n.alt : "";
        case "break":
        case "softbreak":
          return " ";
        default:
          return plainText(n.children, withAlt);
      }
    })
    .join("");
}

// ---------------------------------------------------------------------------------------------
// HTML

export interface HtmlOptions {
  /**
   * HTML for an editor's contenteditable area rather than for reading: soft line breaks as
   * spaces, a placeholder <br> in empty blocks, task checkboxes the editor can click (in a
   * contenteditable="false" island), code blocks ending in a newline the caret can sit on, and
   * images keeping their Markdown URL in data-src.
   */
  editable?: boolean;
  /** The URL to show for an image when it isn't the one in the Markdown: an upload's local preview */
  imageSrc?: (src: string) => string | undefined;
  /** target for absolute links ("_blank" in an editor's preview); they get rel="noopener noreferrer" too */
  linkTarget?: string;
}

/** The prefix of an image URL that stands for an upload still running */
export const UPLOADING_PREFIX = "#uploading-";

function renderInlines(nodes: MdInline[], o: HtmlOptions): string {
  let html = "";
  for (const n of nodes) {
    switch (n.type) {
      case "text":
        html += escHtml(n.value);
        break;
      case "strong":
      case "em":
      case "del":
        html += `<${n.type}>${renderInlines(n.children, o)}</${n.type}>`;
        break;
      case "code":
        html += `<code>${escHtml(n.value)}</code>`;
        break;
      case "break":
        html += "<br>";
        break;
      case "softbreak":
        html += o.editable ? " " : "\n";
        break;
      case "link": {
        const href = safeUrl(n.href);
        const inner = renderInlines(n.children, o);
        if (href == null) {
          html += inner;
          break;
        }
        const title = n.title ? ` title="${escHtml(n.title)}"` : "";
        const target = o.linkTarget && !o.editable && /^(https?:)?\/\//i.test(href) ? ` target="${escHtml(o.linkTarget)}" rel="noopener noreferrer"` : "";
        html += `<a href="${escHtml(href)}"${title}${target}>${inner}</a>`;
        break;
      }
      case "image": {
        const shown = o.imageSrc?.(n.src);
        const safe = safeUrl(n.src);
        if (safe == null) {
          html += escHtml(n.alt);
          break;
        }
        const uploading = n.src.startsWith(UPLOADING_PREFIX);
        const src = shown ?? (uploading ? null : safe);
        const title = n.title ? ` title="${escHtml(n.title)}"` : "";
        const data = (o.editable && (shown != null || uploading) ? ` data-src="${escHtml(n.src)}"` : "") + (uploading ? " data-uploading" : "");
        html += `<img${src != null ? ` src="${escHtml(src)}"` : ""} alt="${escHtml(n.alt)}"${title}${data}>`;
        break;
      }
    }
  }
  return html;
}

const EMPTY_BR = (o: HtmlOptions) => (o.editable ? "<br>" : "");

function renderBlock(b: MdBlock, o: HtmlOptions, tight = false): string {
  switch (b.type) {
    case "paragraph": {
      const inner = renderInlines(b.children, o);
      return tight ? inner : `<p>${inner || EMPTY_BR(o)}</p>`;
    }
    case "heading":
      return `<h${b.level}>${renderInlines(b.children, o) || EMPTY_BR(o)}</h${b.level}>`;
    case "code": {
      const lang = b.lang ? ` data-lang="${escHtml(b.lang)}"` : "";
      const cls = b.lang ? ` class="language-${escHtml(b.lang)}"` : "";
      // Ends in a line end, as CommonMark's own renderer writes it; in an editor it is also the
      // line the caret sits on after Enter at the very end (a last line end alone draws nothing)
      return `<pre${lang}><code${cls}>${escHtml(b.value)}\n</code></pre>`;
    }
    case "quote":
      return `<blockquote>${renderBlocks(b.children, o) || (o.editable ? "<p><br></p>" : "")}</blockquote>`;
    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      const start = b.ordered && b.start !== 1 ? ` start="${b.start}"` : "";
      const tasks = b.items.some((it) => it.checked != null);
      const items = b.items
        .map((it) => {
          const task = it.checked != null;
          const box = !task
            ? ""
            : o.editable
              ? `<span contenteditable="false" data-task=""><input type="checkbox" tabindex="-1" aria-label="Done"${it.checked ? " checked" : ""}></span>`
              : `<input type="checkbox" disabled${it.checked ? " checked" : ""}> `;
          const content = it.children.map((c) => renderBlock(c, o, !b.loose)).join("");
          const attrs = task ? ` class="task-list-item"${o.editable ? ` data-checked="${it.checked}"` : ""}` : "";
          return `<li${attrs}>${box}${content || EMPTY_BR(o)}</li>`;
        })
        .join("");
      return `<${tag}${start}${tasks ? ' class="contains-task-list"' : ""}>${items}</${tag}>`;
    }
    case "rule":
      return "<hr>";
    case "table": {
      const align = (k: number) => (b.align[k] ? ` align="${b.align[k]}"` : "");
      const head = b.head.map((c, k) => `<th${align(k)}>${renderInlines(c, o)}</th>`).join("");
      const rows = b.rows.map((r) => `<tr>${r.map((c, k) => `<td${align(k)}>${renderInlines(c, o)}</td>`).join("")}</tr>`).join("");
      return `<table><thead><tr>${head}</tr></thead>${rows ? `<tbody>${rows}</tbody>` : ""}</table>`;
    }
  }
}

function renderBlocks(blocks: MdBlock[], o: HtmlOptions): string {
  return blocks.map((b) => renderBlock(b, o)).join("");
}

/**
 * The tree → HTML, with no whitespace between tags (so it can go into an editable area that keeps
 * white space). Text is escaped, unsafe links become their text and unsafe images their alt text.
 */
export function renderHtml(blocks: MdBlock[], options: HtmlOptions = {}): string {
  return renderBlocks(blocks, options);
}

/** Inlines only (a paragraph's content), for pasting into the middle of a line */
export function renderInlineHtml(nodes: MdInline[], options: HtmlOptions = {}): string {
  return renderInlines(nodes, options);
}

/** Markdown → safe HTML, for <Prose html={…}> */
export function markdownToHtml(src: string, options: HtmlOptions = {}): string {
  return renderHtml(parseMarkdown(src), options);
}

// ---------------------------------------------------------------------------------------------
// Reading HTML back

/**
 * What the reader needs of a DOM node, so it works on the live DOM, a DOMParser document, or a
 * test's tree: the node type (1 element, 3 text), the tag name, the text, the children, and
 * attributes.
 */
export interface DomLike {
  nodeType: number;
  nodeName: string;
  nodeValue: string | null;
  childNodes: ArrayLike<DomLike>;
  getAttribute?(name: string): string | null;
}

const BLOCK_TAGS = new Set(
  "ADDRESS ARTICLE ASIDE BLOCKQUOTE BODY CAPTION CENTER DD DETAILS DIALOG DIV DL DT FIELDSET FIGCAPTION FIGURE FOOTER FORM H1 H2 H3 H4 H5 H6 HEADER HGROUP HR HTML LI MAIN MENU NAV OL P PRE SECTION SUMMARY TABLE TBODY TD TFOOT TH THEAD TR UL".split(" "),
);
const SKIP_TAGS = new Set(
  "AREA AUDIO BUTTON CANVAS COL COLGROUP DATALIST EMBED HEAD IFRAME INPUT LINK MAP MATH META NOSCRIPT OBJECT OPTION PARAM PICTURE SCRIPT SELECT SOURCE STYLE SVG TEMPLATE TEXTAREA TITLE TRACK VIDEO".split(" "),
);

const tagOf = (n: DomLike) => n.nodeName.toUpperCase();
const attrOf = (n: DomLike, name: string) => n.getAttribute?.(name) ?? null;
const kids = (n: DomLike) => Array.from(n.childNodes);

function styleOf(n: DomLike): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (attrOf(n, "style") ?? "").split(";")) {
    const at = part.indexOf(":");
    if (at > 0) out[part.slice(0, at).trim().toLowerCase()] = part.slice(at + 1).trim().toLowerCase();
  }
  return out;
}

/** The editor's checkbox island in a task item, which isn't content */
const isTaskBox = (n: DomLike) => n.nodeType === 1 && attrOf(n, "data-task") != null;

function hasBlock(n: DomLike): boolean {
  return kids(n).some((c) => c.nodeType === 1 && !SKIP_TAGS.has(tagOf(c)) && (BLOCK_TAGS.has(tagOf(c)) || hasBlock(c)));
}

/** Text of an element as code: <br> and line-sized blocks become line ends */
function codeText(n: DomLike, pre: boolean): string {
  let s = "";
  for (const c of kids(n)) {
    if (c.nodeType === 3) s += c.nodeValue ?? "";
    else if (c.nodeType === 1) {
      const t = tagOf(c);
      if (SKIP_TAGS.has(t) || isTaskBox(c)) continue;
      if (t === "BR") s += pre ? "\n" : " ";
      else if (pre && (t === "DIV" || t === "P")) {
        const line = codeText(c, pre);
        if (s && !s.endsWith("\n")) s += "\n";
        s += (line === "\n" ? "" : line) + "\n";
      } else s += codeText(c, pre);
    }
  }
  return s.replace(/[\u200b\ufeff]/g, "");
}

function langOf(pre: DomLike): string {
  const own = attrOf(pre, "data-lang") ?? attrOf(pre, "data-language") ?? attrOf(pre, "lang");
  if (own) return own.trim().split(/\s+/)[0];
  const classes = [attrOf(pre, "class") ?? "", ...kids(pre).filter((c) => tagOf(c) === "CODE").map((c) => attrOf(c, "class") ?? "")].join(" ");
  const m = /(?:^|\s)(?:language|lang|highlight-source)-([\w+#.-]+)/.exec(classes);
  return m ? m[1] : "";
}

function readInlines(nodes: DomLike[]): MdInline[] {
  const out: MdInline[] = [];
  for (const n of nodes) {
    if (n.nodeType === 3) {
      out.push({ type: "text", value: n.nodeValue ?? "" });
      continue;
    }
    if (n.nodeType !== 1) continue;
    const t = tagOf(n);
    if (SKIP_TAGS.has(t) || isTaskBox(n)) continue;
    if (t === "BR") {
      out.push({ type: "break" });
      continue;
    }
    if (t === "IMG") {
      const src = attrOf(n, "data-src") || attrOf(n, "src") || "";
      if (src && safeUrl(src) != null) out.push({ type: "image", src, alt: attrOf(n, "alt") ?? "", title: attrOf(n, "title") || undefined });
      continue;
    }
    const st = styleOf(n);
    if (t === "CODE" || t === "KBD" || t === "SAMP" || t === "TT" || ((t === "SPAN" || t === "FONT") && /mono|courier|consolas|menlo/.test(st["font-family"] ?? ""))) {
      out.push({ type: "code", value: codeText(n, false).replace(/\s+/g, " ") });
      continue;
    }
    const inner = readInlines(kids(n));
    if (t === "A") {
      const href = attrOf(n, "href");
      if (href && safeUrl(href) != null) out.push({ type: "link", href, title: attrOf(n, "title") || undefined, children: inner });
      else out.push(...inner);
      continue;
    }
    if (BLOCK_TAGS.has(t)) {
      // A block inside a heading or a cell: keep the words apart
      out.push({ type: "text", value: " " }, ...inner, { type: "text", value: " " });
      continue;
    }
    const weight = st["font-weight"] ?? "";
    const bold = t === "B" || t === "STRONG" ? !/^(normal|lighter|[1-5]00)$/.test(weight) : /^(bold|bolder|[6-9]00)$/.test(weight);
    const italic = ["I", "EM", "CITE", "DFN", "VAR"].includes(t) ? st["font-style"] !== "normal" : st["font-style"] === "italic";
    const strike = ["S", "DEL", "STRIKE"].includes(t) || /line-through/.test(`${st["text-decoration"] ?? ""} ${st["text-decoration-line"] ?? ""}`);
    let wrapped = inner;
    if (strike) wrapped = [{ type: "del", children: wrapped }];
    if (italic) wrapped = [{ type: "em", children: wrapped }];
    if (bold) wrapped = [{ type: "strong", children: wrapped }];
    out.push(...wrapped);
  }
  return out;
}

const MARKS = new Set(["strong", "em", "del", "link"]);
type Container = Extract<MdInline, { children: MdInline[] }>;
const isContainer = (n: MdInline): n is Container => MARKS.has(n.type);

/** No strong in strong, no link in link */
function unnest(nodes: MdInline[], inside: Set<string>): MdInline[] {
  return nodes.flatMap((n): MdInline[] => {
    if (!isContainer(n)) return [n];
    if (inside.has(n.type)) return unnest(n.children, inside);
    const next = new Set(inside).add(n.type);
    return [{ ...n, children: unnest(n.children, next) }];
  });
}

/** Spaces at the edges of a mark go outside it: `<b> word</b>` is " **word**", since "** word**" isn't bold */
function hoistSpaces(nodes: MdInline[]): MdInline[] {
  return nodes.flatMap((n): MdInline[] => {
    if (!isContainer(n)) return [n];
    const children = hoistSpaces(n.children);
    const lead: MdInline[] = [];
    const trail: MdInline[] = [];
    const first = children[0];
    if (first?.type === "text" && /^\s/.test(first.value)) {
      children[0] = { type: "text", value: first.value.replace(/^\s+/, "") };
      lead.push({ type: "text", value: " " });
    }
    const last = children[children.length - 1];
    if (last?.type === "text" && /\s$/.test(last.value)) {
      children[children.length - 1] = { type: "text", value: last.value.replace(/\s+$/, "") };
      trail.push({ type: "text", value: " " });
    }
    return [...lead, { ...n, children }, ...trail];
  });
}

/** Joins neighbouring texts, and neighbouring marks of one kind (`<b>a</b><b>b</b>` → **ab**) */
function merge(nodes: MdInline[]): MdInline[] {
  const out: MdInline[] = [];
  for (const n0 of nodes) {
    const n = isContainer(n0) ? { ...n0, children: merge(n0.children) } : n0;
    const prev = out[out.length - 1];
    if (n.type === "text" && prev?.type === "text") out[out.length - 1] = { type: "text", value: prev.value + n.value };
    else if (prev && isContainer(n) && prev.type === n.type && (n.type !== "link" || (prev.type === "link" && prev.href === n.href && n.type === "link")))
      out[out.length - 1] = { ...prev, children: merge([...(prev as Container).children, ...n.children]) } as MdInline;
    else out.push(n);
  }
  return out;
}

/** HTML's white space rules: runs to one space, none at the start or end, none around a line break */
function collapse(nodes: MdInline[]): MdInline[] {
  let space = true;
  let lastText: { node: { type: "text"; value: string } } | null = null;
  const walk = (list: MdInline[]): MdInline[] =>
    list.map((n): MdInline => {
      if (n.type === "text") {
        let v = n.value.replace(/[\u200b\ufeff]/g, "").replace(/[\s\u00a0]+/g, " ");
        if (space) v = v.replace(/^ /, "");
        if (v) space = v.endsWith(" ");
        const node = { type: "text" as const, value: v };
        lastText = { node };
        return node;
      }
      if (n.type === "break" || n.type === "softbreak") {
        if (lastText && space) lastText.node.value = lastText.node.value.replace(/ $/, "");
        space = true;
        lastText = null;
        return n;
      }
      if (isContainer(n)) return { ...n, children: walk(n.children) };
      space = false;
      lastText = null;
      return n;
    });
  const out = walk(nodes);
  const end = lastText as { node: { value: string } } | null;
  if (end && space) end.node.value = end.node.value.replace(/ $/, "");
  return out;
}

const hasContent = (nodes: MdInline[]): boolean =>
  nodes.some((n) => (n.type === "text" ? n.value.trim() !== "" : n.type === "code" || n.type === "image" || (isContainer(n) && hasContent(n.children))));

/** Empty texts and empty marks out; breaks at the start or end of the paragraph out */
function prune(nodes: MdInline[]): MdInline[] {
  const out = nodes.flatMap((n): MdInline[] => {
    if (n.type === "text") return n.value ? [n] : [];
    if (n.type === "code") return n.value.trim() ? [n] : [];
    if (isContainer(n)) {
      const children = prune(n.children);
      if (hasContent(children)) return [{ ...n, children }];
      return children.filter((c) => c.type === "text");
    }
    return [n];
  });
  while (out.length && (out[0].type === "break" || out[0].type === "softbreak")) out.shift();
  while (out.length && (out[out.length - 1].type === "break" || out[out.length - 1].type === "softbreak")) out.pop();
  return out;
}

function cleanInlines(nodes: MdInline[]): MdInline[] {
  return merge(prune(collapse(merge(hoistSpaces(merge(unnest(nodes, new Set())))))));
}

/** Paragraphs from a run of inline nodes; two line breaks in a row start a new paragraph */
function paragraphs(nodes: DomLike[]): MdBlock[] {
  const inl = readInlines(nodes);
  const out: MdBlock[] = [];
  let cur: MdInline[] = [];
  const end = () => {
    const c = cleanInlines(cur);
    if (hasContent(c)) out.push({ type: "paragraph", children: c });
    cur = [];
  };
  for (let k = 0; k < inl.length; k++) {
    if (inl[k].type === "break" && inl[k + 1]?.type === "break") {
      end();
      while (inl[k + 1]?.type === "break") k++;
    } else cur.push(inl[k]);
  }
  end();
  return out;
}

function readBlocks(parent: DomLike): MdBlock[] {
  const out: MdBlock[] = [];
  let run: DomLike[] = [];
  let items: DomLike[] = [];
  const flush = () => {
    if (run.length) out.push(...paragraphs(run));
    run = [];
  };
  const flushItems = () => {
    if (items.length) out.push(readList({ nodeType: 1, nodeName: "UL", nodeValue: null, childNodes: items }));
    items = [];
  };
  for (const c of kids(parent)) {
    if (c.nodeType === 1 && tagOf(c) === "LI") {
      flush();
      items.push(c);
      continue;
    }
    if (items.length && c.nodeType === 3 && !(c.nodeValue ?? "").trim()) continue;
    flushItems();
    if (c.nodeType === 3) {
      run.push(c);
      continue;
    }
    if (c.nodeType !== 1) continue;
    const t = tagOf(c);
    if (SKIP_TAGS.has(t) || isTaskBox(c)) continue;
    if (BLOCK_TAGS.has(t)) {
      flush();
      out.push(...readBlock(c));
    } else if (hasBlock(c)) {
      flush();
      out.push(...readBlocks(c));
    } else run.push(c);
  }
  flush();
  flushItems();
  return out;
}

function readBlock(el: DomLike): MdBlock[] {
  const t = tagOf(el);
  if (/^H[1-6]$/.test(t)) {
    const children = cleanInlines(readInlines(kids(el)).map((n) => (n.type === "break" ? { type: "text", value: " " } : n)));
    return hasContent(children) ? [{ type: "heading", level: Number(t[1]) as 1 | 2 | 3 | 4 | 5 | 6, children }] : [];
  }
  if (t === "PRE" || (t === "DIV" && /^pre/.test(styleOf(el)["white-space"] ?? ""))) {
    return [{ type: "code", lang: langOf(el), value: codeText(el, true).replace(/\n$/, "") }];
  }
  if (t === "BLOCKQUOTE") {
    const inner = readBlocks(el);
    return inner.length ? [{ type: "quote", children: inner }] : [];
  }
  if (t === "UL" || t === "OL") {
    const list = readList(el);
    return list.items.length ? [list] : [];
  }
  if (t === "HR") return [{ type: "rule" }];
  if (t === "TABLE") return readTable(el);
  const blocks = readBlocks(el);
  // GitHub puts a code block's language on a wrapper: <div class="highlight highlight-source-js"><pre>
  const lang = /(?:^|\s)highlight-source-([\w+#.-]+)/.exec(attrOf(el, "class") ?? "")?.[1];
  return lang ? blocks.map((b) => (b.type === "code" && !b.lang ? { ...b, lang } : b)) : blocks;
}

/**
 * Whether two blocks in a list item need a blank line between them (which makes the list loose):
 * a paragraph after a paragraph, a quote, a table or a list would otherwise run on into it.
 */
function needsBlank(prev: MdBlock, next: MdBlock): boolean {
  if (next.type === "list" || next.type === "code" || next.type === "heading" || next.type === "rule" || next.type === "quote") return false;
  return !(prev.type === "code" || prev.type === "heading" || prev.type === "rule");
}

function readList(el: DomLike): Extract<MdBlock, { type: "list" }> {
  const ordered = tagOf(el) === "OL";
  const start = ordered ? parseInt(attrOf(el, "start") ?? "1", 10) || 1 : 1;
  const items: MdListItem[] = [];
  const lastItem = () => {
    if (!items.length) items.push({ checked: null, children: [] });
    return items[items.length - 1];
  };
  for (const c of kids(el)) {
    if (c.nodeType === 1 && tagOf(c) === "LI") items.push(readItem(c));
    else if (c.nodeType === 1 && (tagOf(c) === "UL" || tagOf(c) === "OL")) {
      // A list straight inside a list (what some editors make when indenting): it belongs to the item before
      const sub = readList(c);
      if (sub.items.length) lastItem().children.push(sub);
    } else if (c.nodeType === 1 || (c.nodeValue ?? "").trim()) {
      const blocks = readBlocks({ nodeType: 1, nodeName: "DIV", nodeValue: null, childNodes: [c] });
      if (blocks.length) lastItem().children.push(...blocks);
    }
  }
  // Loose when an item's text is in paragraphs of its own (a tight list's text sits in the <li>)
  const loose =
    kids(el).some((li) => li.nodeType === 1 && tagOf(li) === "LI" && kids(li).some((c) => c.nodeType === 1 && tagOf(c) === "P")) ||
    items.some((it) => it.children.some((b, k) => k > 0 && needsBlank(it.children[k - 1], b)));
  return { type: "list", ordered, start, loose, items };
}

function findCheckbox(n: DomLike): DomLike | null {
  for (const c of kids(n)) {
    if (c.nodeType === 3) {
      if ((c.nodeValue ?? "").trim()) return null;
      continue;
    }
    if (c.nodeType !== 1) continue;
    const t = tagOf(c);
    if (t === "INPUT") return (attrOf(c, "type") ?? "").toLowerCase() === "checkbox" ? c : null;
    if (t === "UL" || t === "OL") return null;
    const inner = findCheckbox(c);
    if (inner || hasText(c)) return inner;
  }
  return null;
}
const hasText = (n: DomLike): boolean => kids(n).some((c) => (c.nodeType === 3 ? !!(c.nodeValue ?? "").trim() : c.nodeType === 1 && hasText(c)));

function readItem(li: DomLike): MdListItem {
  const box = findCheckbox(li);
  const flag = attrOf(li, "data-checked");
  const checked = box ? attrOf(box, "checked") != null : flag != null ? flag === "true" : null;
  return { checked, children: readBlocks(li) };
}

function readTable(el: DomLike): MdBlock[] {
  const rows: DomLike[] = [];
  const collect = (n: DomLike) => {
    for (const c of kids(n)) {
      const t = c.nodeType === 1 ? tagOf(c) : "";
      if (t === "TR") rows.push(c);
      else if (t === "THEAD" || t === "TBODY" || t === "TFOOT") collect(c);
    }
  };
  collect(el);
  if (!rows.length) return [];
  const cellsOf = (tr: DomLike) => kids(tr).filter((c) => c.nodeType === 1 && (tagOf(c) === "TD" || tagOf(c) === "TH"));
  const width = Math.max(...rows.map((r) => cellsOf(r).length));
  if (!width) return [];
  const read = (c: DomLike | undefined): MdInline[] =>
    c ? cleanInlines(readInlines(kids(c)).map((n) => (n.type === "break" ? { type: "text", value: " " } : n))) : [];
  const [head, ...body] = rows.map((r) => {
    const cells = cellsOf(r);
    return Array.from({ length: width }, (_, k) => cells[k]);
  });
  const align = head.map((c): MdAlign => {
    const a = (c && (attrOf(c, "align") ?? styleOf(c)["text-align"]))?.toLowerCase() ?? "";
    return a === "center" ? "center" : a === "right" ? "right" : a === "left" ? "left" : null;
  });
  return [{ type: "table", align, head: head.map(read), rows: body.map((r) => r.map(read)) }];
}

/**
 * HTML → the tree. Keeps what Markdown can say (paragraphs, headings, bold, italic, strikethrough,
 * code, links, images, lists and task lists, quotes, code blocks, rules, tables) and drops the rest:
 * styles, classes, scripts, forms, media. Inline styles count only where they mean something
 * Markdown has (a bold span from a word processor); a <b style="font-weight:normal"> wrapper
 * (Google Docs') is not bold.
 */
export function readHtml(root: DomLike): MdBlock[] {
  return readBlocks(root);
}

// ---------------------------------------------------------------------------------------------
// Writing Markdown

interface WriteContext {
  /** Headings and table cells are one line: line breaks become spaces */
  oneLine?: boolean;
  table?: boolean;
}

function escapeText(s: string, ctx: WriteContext): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const prev = s[i - 1] ?? "";
    const next = s[i + 1] ?? "";
    switch (c) {
      case "\\":
        out += next === "" || ESCAPABLE.test(next) ? "\\\\" : "\\";
        break;
      case "*":
        out += prev && next && /\s/.test(prev) && /\s/.test(next) ? "*" : "\\*";
        break;
      case "_":
        out += (isAlnum(prev) && isAlnum(next)) || (prev && next && /\s/.test(prev) && /\s/.test(next)) ? "_" : "\\_";
        break;
      case "`":
      case "[":
      case "]":
        out += "\\" + c;
        break;
      case "~":
        out += prev === "~" || next === "~" ? "\\~" : "~";
        break;
      case "<":
        out += /[A-Za-z/!?]/.test(next) ? "\\<" : "<";
        break;
      case "&":
        out += /^#?[A-Za-z0-9]+;/.test(s.slice(i + 1, i + 34)) ? "\\&" : "&";
        break;
      case "|":
        out += ctx.table ? "\\|" : "|";
        break;
      case "\n":
        out += ctx.oneLine || ctx.table ? " " : "\n";
        break;
      default:
        out += c;
    }
  }
  return out;
}

function codeSpan(value: string): string {
  const v = value.replace(/\n/g, " ");
  const runs = new Set((v.match(/`+/g) ?? []).map((r) => r.length));
  let n = 1;
  while (runs.has(n)) n++;
  const fence = "`".repeat(n);
  const pad = v.startsWith("`") || v.endsWith("`") || (v.length > 1 && v.startsWith(" ") && v.endsWith(" ") && /[^ ]/.test(v)) ? " " : "";
  return fence + pad + v + pad + fence;
}

/** A link destination as Markdown writes it: as it is when it can be, else in <angle brackets> */
export function markdownUrl(url: string): string {
  if (!/[\s<>()\\]/.test(url)) return url;
  return "<" + url.replace(/\\/g, "\\\\").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\n/g, "%0A") + ">";
}

const titlePart = (t?: string) => (t ? ` "${t.replace(/["\\]/g, "\\$&")}"` : "");

/** `![alt](src)`, escaped */
export function imageMarkdown(alt: string, src: string, title?: string): string {
  return `![${escapeText(alt, { oneLine: true })}](${markdownUrl(src)}${titlePart(title)})`;
}

function writeMark(d: string, children: MdInline[], ctx: WriteContext): string {
  const inner = writeInlines(children, ctx);
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner)!;
  return m[2] ? m[1] + d + m[2] + d + m[3] : inner;
}

function writeInlines(nodes: MdInline[], ctx: WriteContext): string {
  let out = "";
  for (const n of nodes) {
    switch (n.type) {
      case "text":
        out += escapeText(n.value, ctx);
        break;
      case "strong":
        out += writeMark("**", n.children, ctx);
        break;
      case "em":
        out += writeMark("*", n.children, ctx);
        break;
      case "del":
        out += writeMark("~~", n.children, ctx);
        break;
      case "code":
        out += codeSpan(n.value);
        break;
      case "image":
        out += imageMarkdown(n.alt, n.src, n.title);
        break;
      case "break":
        out += ctx.oneLine || ctx.table ? " " : "\\\n";
        break;
      case "softbreak":
        out += ctx.oneLine || ctx.table ? " " : "\n";
        break;
      case "link": {
        const only = n.children.length === 1 && n.children[0].type === "text" && !n.title ? n.children[0].value : null;
        if (only != null && only === n.href && /^https?:\/\/[^\s<>]+$/i.test(n.href)) out += `<${n.href}>`;
        else if (only != null && `mailto:${only}` === n.href && /^[^\s<>@]+@[^\s<>@]+$/.test(only)) out += `<${only}>`;
        else out += `[${writeInlines(n.children, ctx)}](${markdownUrl(n.href)}${titlePart(n.title)})`;
        break;
      }
    }
  }
  return out;
}

/** Text at the start of a line that would read as a block marker gets a backslash */
function escapeLineStart(line: string, notFirst: boolean): string {
  if (/^(#{1,6}|[-+>])(?=[ \t]|$)/.test(line) || /^>/.test(line)) return "\\" + line;
  if (RE_HR.test(line)) return "\\" + line;
  if (/^\d{1,9}[.)](?=[ \t]|$)/.test(line)) return line.replace(/^(\d+)([.)])/, "$1\\$2");
  if (notFirst && /^=+[ \t]*$/.test(line)) return "\\" + line;
  return line;
}

function writeParagraph(children: MdInline[]): string {
  return writeInlines(children, {})
    .split("\n")
    .map((l, k) => escapeLineStart(l, k > 0))
    .join("\n");
}

function fenceFor(value: string): string {
  let n = 3;
  for (const m of value.matchAll(/^ {0,3}(`{3,})/gm)) n = Math.max(n, m[1].length + 1);
  return "`".repeat(n);
}

function writeBlock(b: MdBlock, marker: string): string {
  switch (b.type) {
    case "paragraph":
      return writeParagraph(b.children);
    case "heading": {
      let text = writeInlines(b.children, { oneLine: true }).trim();
      if (/^#+$/.test(text)) text = "\\" + text;
      else text = text.replace(/(\s)(#+)$/, "$1\\$2");
      return "#".repeat(b.level) + (text ? " " + text : "");
    }
    case "code": {
      const fence = fenceFor(b.value);
      return `${fence}${b.lang.split(/\s/)[0]}\n${b.value}${b.value ? "\n" : ""}${fence}`;
    }
    case "quote": {
      const inner = writeBlocks(b.children, false);
      return inner
        .split("\n")
        .map((l) => (l ? "> " + l : ">"))
        .join("\n");
    }
    case "rule":
      return "---";
    case "table": {
      const row = (cells: MdInline[][]) => "| " + cells.map((c) => writeInlines(c, { table: true }).trim()).join(" | ") + " |";
      const delim = "| " + b.align.map((a) => (a === "center" ? ":---:" : a === "right" ? "---:" : a === "left" ? ":---" : "---")).join(" | ") + " |";
      return [row(b.head), delim, ...b.rows.map(row)].join("\n");
    }
    case "list": {
      const items = b.items.map((it, k) => {
        const m = b.ordered ? `${b.start + k}${marker} ` : `${marker} `;
        const box = it.checked == null ? "" : it.checked ? "[x] " : "[ ] ";
        let body = writeBlocks(it.children, true);
        // A rule as the item's first line must not look like a rule made of the bullet itself
        if (it.children[0]?.type === "rule") body = (marker === "-" ? "***" : "---") + body.slice(3);
        const pad = " ".repeat(m.length);
        const [first, ...rest] = body.split("\n");
        return [(m + box + first).replace(/[ \t]+$/, ""), ...rest.map((l) => (l ? pad + l : ""))].join("\n");
      });
      return items.join(b.loose ? "\n\n" : "\n");
    }
  }
}

function writeBlocks(blocks: MdBlock[], inItem: boolean): string {
  let out = "";
  let prev: MdBlock | null = null;
  let prevMarker = "";
  for (const b of blocks) {
    if (b.type === "list" && !b.items.length) continue;
    // Two lists in a row would read as one: the second gets the other bullet (- *) or delimiter (. ))
    let marker = "";
    if (b.type === "list") {
      const [a, c] = b.ordered ? [".", ")"] : ["-", "*"];
      marker = prev?.type === "list" && prev.ordered === b.ordered && prevMarker === a ? c : a;
    }
    const s = writeBlock(b, marker);
    if (prev) out += inItem && !needsBlank(prev, b) ? "\n" : "\n\n";
    out += s;
    prev = b;
    prevMarker = marker;
  }
  return out;
}

/** The tree → Markdown, with no line end after the last block */
export function toMarkdown(blocks: MdBlock[]): string {
  return writeBlocks(blocks, false).replace(/\s+$/, "");
}

/** HTML → Markdown, through readHtml */
export function htmlToMarkdown(root: DomLike): string {
  return toMarkdown(readHtml(root));
}

// ---------------------------------------------------------------------------------------------
// Text

function blocksText(blocks: MdBlock[]): string[] {
  return blocks.flatMap((b): string[] => {
    switch (b.type) {
      case "paragraph":
      case "heading":
        return [plainText(b.children, false)];
      case "code":
        return [b.value];
      case "quote":
        return blocksText(b.children);
      case "list":
        return b.items.flatMap((it) => blocksText(it.children));
      case "table":
        return [b.head, ...b.rows].map((r) => r.map((c) => plainText(c, false)).join(" "));
      default:
        return [];
    }
  });
}

/** The words of a Markdown text with the markup gone, a block a line (for a word count or a summary) */
export function markdownToText(src: string): string {
  return blocksText(parseMarkdown(src)).join("\n");
}

/** Words in a text: runs of letters and digits, with apostrophes and hyphens inside them */
export function countWords(text: string): number {
  return text.match(/[\p{L}\p{N}](?:[\p{L}\p{N}'’_-]*[\p{L}\p{N}])?/gu)?.length ?? 0;
}
