import type { BadgeVariant } from "@/registry/plainspoken/ui/badge";
import { PEOPLE, SECTIONS, STATUSES, type NotebookPage, type PageStatus } from "@/registry/plainspoken/blocks/milkdown/data";

/** A heading in a page's outline */
export interface OutlineEntry {
  level: 1 | 2 | 3;
  text: string;
}

/** Inline Markdown as plain words: links keep their text, marks and escapes go */
export function plainInline(s: string): string {
  return s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/(\*\*|__|~~|\*|_|`)/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!|~$<>])/g, "$1")
    .trim();
}

const FENCE = /^ {0,3}(`{3,}|~{3,}|\$\$)/;

/**
 * The headings of levels 1 to 3 at the top level of a page (not in code, quotes or lists), in the
 * order the editor shows them: ATX (`## Design`) and setext (a line underlined with === or ---).
 */
export function outline(markdown: string): OutlineEntry[] {
  const out: OutlineEntry[] = [];
  const lines = markdown.split("\n");
  let fence: string | null = null;
  lines.forEach((line, i) => {
    const f = FENCE.exec(line);
    if (fence) {
      if (f && f[1].startsWith(fence.slice(0, 2)) && f[1].length >= fence.length) fence = null;
      return;
    }
    if (f) {
      fence = f[1];
      return;
    }
    const atx = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
    if (atx) {
      if (atx[1].length <= 3) out.push({ level: atx[1].length as 1 | 2 | 3, text: plainInline(atx[2]) });
      return;
    }
    const under = /^ {0,3}(=+|-+)[ \t]*$/.exec(line);
    const prev = lines[i - 1];
    const paragraphAbove =
      prev?.trim() &&
      !/^ {0,3}([#>|]|[-*+][ \t]|\d+[.)][ \t]|(`{3}|~{3}|\$\$))/.test(prev) &&
      // the start of the paragraph is a plain line too
      (i < 2 || !lines[i - 2].trim() || !/^ {0,3}([-*+]|\d+[.)])[ \t]/.test(lines[i - 2]));
    if (under && paragraphAbove) out.push({ level: under[1][0] === "=" ? 1 : 2, text: plainInline(prev) });
  });
  return out;
}

/** The words of a page: what is read, not its Markdown */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/^ {0,3}(`{3,}|~{3,}).*$/gm, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\[\^[^\]]+\]:/gm, "")
    .replace(/https?:\/\/\S+/g, "link");
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,-]*/gu)?.length ?? 0;
}

/** Minutes to read, at 230 words a minute; at least one */
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 230));

const number = new Intl.NumberFormat("en");

/** "1,240 words · 6 min read" */
export function lengthLine(words: number): string {
  return `${number.format(words)} ${words === 1 ? "word" : "words"} · ${readingMinutes(words)} min read`;
}

/**
 * How often the query turns up in each page's title and text (case and accents ignored): the pages
 * with none are left out. An empty query gives null.
 */
export function searchPages(pages: NotebookPage[], query: string): Map<string, number> | null {
  const q = fold(query.trim());
  if (!q) return null;
  const hits = new Map<string, number>();
  for (const p of pages) {
    const hay = fold(`${p.title}\n${p.body}`);
    let n = 0;
    for (let at = hay.indexOf(q); at !== -1; at = hay.indexOf(q, at + q.length)) n++;
    if (n) hits.set(p.id, n);
  }
  return hits;
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

/** Where a page sits: "Operations / Runbooks"; "Notebook" for the pages at the top */
export function trail(page: Pick<NotebookPage, "section" | "folder">): string {
  const heading = SECTIONS.find((s) => s.key === page.section)?.heading ?? "Notebook";
  return page.folder ? `${heading} / ${page.folder}` : heading;
}

const VARIANTS: Record<PageStatus, BadgeVariant> = { draft: "default", review: "info", published: "success", outdated: "warning" };

export const statusLabel = (s: PageStatus) => STATUSES.find((x) => x.value === s)?.label ?? s;
export const statusVariant = (s: PageStatus) => VARIANTS[s];

export const personName = (key: string) => PEOPLE[key]?.name ?? key;

const list = new Intl.ListFormat("en", { type: "conjunction" });

/** "Tomasz Wójcik and Hana Sato" */
export const names = (keys: string[]) => list.format(keys.map(personName));

/** A new page's id, from its title where there is one: "untitled-3f9k" */
export function newPageId(title: string, taken: (id: string) => boolean): string {
  const base =
    fold(title)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "untitled";
  let id = base;
  for (let n = 2; taken(id); n++) id = `${base}-${n}`;
  return id;
}
