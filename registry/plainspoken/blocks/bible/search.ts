// Full-text search over the Bible, as plain functions: no React, no I/O. Hand it the books with
// their chapters (read however you like, on a server or from a prebuilt file) and a query.
import { plainVerse, type BibleBook, type BibleChapterText, type Testament } from "@/registry/plainspoken/blocks/bible/lib";

export interface BibleSearchSource {
  book: BibleBook;
  chapters: BibleChapterText[];
}

export interface BibleSearchTerm {
  text: string;
  /** "in quotes": the exact words; otherwise a word and its endings ("love" finds loved, loveth) */
  phrase: boolean;
}

export interface BibleSearchHit {
  book: string;
  chapter: number;
  verse: number;
  /** The verse, plain */
  text: string;
  /** Where the terms are in `text`: [start, end) pairs, sorted, not overlapping */
  marks: [number, number][];
}

export interface BibleReference {
  book: BibleBook;
  chapter?: number;
  verse?: number;
}

export interface BibleSearchResult {
  query: string;
  terms: BibleSearchTerm[];
  /** Matching verses with the testament and book filters applied */
  total: number;
  /** Matching verses per testament, before the filters */
  testaments: Record<Testament, number>;
  /** Books with matches, in canonical order, within the testament filter */
  books: { slug: string; name: string; testament: Testament; count: number }[];
  testament?: Testament;
  book?: string;
  /** This page of hits */
  hits: BibleSearchHit[];
  page: number;
  pageSize: number;
  pageCount: number;
  /** When the query reads as a reference ("John 3:16", "ps 23", "Ruth") */
  reference: BibleReference | null;
}

/** Words and "quoted phrases", lower-cased, with straight apostrophes made curly like the text's */
export function parseQuery(q: string): BibleSearchTerm[] {
  const terms: BibleSearchTerm[] = [];
  for (const m of q.replace(/[‘’']/g, "’").matchAll(/"([^"]+)"|“([^”]+)”|(\S+)/g)) {
    const phrase = m[1] ?? m[2];
    const text = (phrase ?? m[3]).toLowerCase().replace(/[^\p{L}\p{N}’\s-]/gu, " ").replace(/\s+/g, " ").trim();
    if (text) terms.push({ text, phrase: phrase != null });
  }
  return terms;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A term as a regular expression: from the start of a word; a phrase to the end of its last word */
export function termPattern(t: BibleSearchTerm): RegExp {
  const body = t.text.split(" ").map(escape).join("\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}${t.phrase ? "(?![\\p{L}\\p{N}])" : "[\\p{L}’]*"}`, "giu");
}

/** Every place the patterns match, merged where they overlap */
export function findMarks(text: string, patterns: RegExp[]): [number, number][] {
  const found: [number, number][] = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) found.push([m.index!, m.index! + m[0].length]);
  }
  found.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const r of found) {
    const last = out.at(-1);
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r]);
  }
  return out;
}

/** Reads "John 3:16", "1 cor 13", "Ps. 23", "jn 3.16" or "Genesis" as a reference, if it is one */
export function parseReference(q: string, books: BibleBook[], chapterLengths?: (slug: string, chapter: number) => number): BibleReference | null {
  const m = /^\s*([123]?\s*[a-z][a-z .]*?)\.?\s*(\d+)?(?:\s*[:.]\s*(\d+))?\s*$/i.exec(q);
  if (!m) return null;
  const name = m[1].toLowerCase().replace(/\./g, "").replace(/^([123])\s*/, "$1 ").replace(/\s+/g, " ").trim();
  if (name.replace(/^\d /, "").length < 2) return null;
  const book =
    books.find((b) => b.name.toLowerCase() === name || b.abbreviation.toLowerCase() === name || b.slug === name.replace(/ /g, "-")) ??
    (name.length >= 3 ? books.find((b) => b.name.toLowerCase().startsWith(name)) : undefined);
  if (!book) return null;
  const chapter = m[2] ? Number(m[2]) : undefined;
  const verse = m[3] ? Number(m[3]) : undefined;
  if (chapter != null && (chapter < 1 || chapter > book.chapters)) return null;
  if (chapter != null && verse != null && (verse < 1 || (chapterLengths && verse > chapterLengths(book.slug, chapter)))) return null;
  return { book, chapter, verse };
}

export interface BibleSearchOptions {
  testament?: Testament;
  book?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Finds the verses that contain every term, in canonical order. Counts per testament ignore the
 * filters (so the filter can show what each choice would give); counts per book honour the
 * testament. Only the requested page gets its highlight positions worked out.
 */
export function searchBible(sources: BibleSearchSource[], query: string, opts: BibleSearchOptions = {}): BibleSearchResult {
  const { testament, book, pageSize = 50 } = opts;
  const terms = parseQuery(query);
  const patterns = terms.map(termPattern);
  const books = sources.map((s) => s.book);
  const lengths = new Map(sources.map((s) => [s.book.slug, s.chapters.map((c) => c.verses.length)]));
  const reference = parseReference(query, books, (slug, ch) => lengths.get(slug)?.[ch - 1] ?? 0);
  const testaments: Record<Testament, number> = { OT: 0, NT: 0 };
  const perBook = new Map<string, number>();
  const all: { book: string; chapter: number; verse: number; text: string }[] = [];

  if (patterns.length)
    for (const { book: b, chapters } of sources)
      chapters.forEach((c, ci) =>
        c.verses.forEach((v, vi) => {
          const text = plainVerse(v);
          if (!patterns.every((re) => ((re.lastIndex = 0), re.test(text)))) return;
          testaments[b.testament]++;
          if (testament && b.testament !== testament) return;
          perBook.set(b.slug, (perBook.get(b.slug) ?? 0) + 1);
          if (book && b.slug !== book) return;
          all.push({ book: b.slug, chapter: ci + 1, verse: vi + 1, text });
        }),
      );

  const pageCount = Math.max(1, Math.ceil(all.length / pageSize));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const hits = all.slice((page - 1) * pageSize, page * pageSize).map((h) => ({ ...h, marks: findMarks(h.text, patterns) }));
  return {
    query,
    terms,
    total: all.length,
    testaments,
    books: books.filter((b) => perBook.has(b.slug)).map((b) => ({ slug: b.slug, name: b.name, testament: b.testament, count: perBook.get(b.slug)! })),
    testament,
    book,
    hits,
    page,
    pageSize,
    pageCount,
    reference,
  };
}
