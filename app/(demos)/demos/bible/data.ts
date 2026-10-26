// The KJV text for the Bible demo, read from content/bible at build time. Synchronous reads, so
// every book and chapter page prerenders; search runs in a cached function over the same files.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import booksJson from "@/content/bible/books.json";
import descriptionsJson from "@/content/bible/descriptions.json";
import { plainVerse, type BibleBook, type BibleChapterText, type Testament } from "@/registry/plainspoken/blocks/bible/lib";
import { searchBible } from "@/registry/plainspoken/blocks/bible/search";

export const BASE = "/demos/bible";
export const SEARCH = `${BASE}/search`;

export const BOOKS = booksJson as BibleBook[];
export const DESCRIPTIONS = descriptionsJson as Record<string, string>;

export const getBook = (slug: string) => BOOKS.find((b) => b.slug === slug);

const texts = new Map<string, BibleChapterText[]>();

/** A book's chapters, read once per server process */
export function chaptersOf(slug: string): BibleChapterText[] {
  let t = texts.get(slug);
  if (!t) {
    const file = join(process.cwd(), "content/bible/kjv", `${slug}.json`);
    t = (JSON.parse(readFileSync(file, "utf8")) as { chapters: BibleChapterText[] }).chapters;
    texts.set(slug, t);
  }
  return t;
}

/** The first words of a chapter, for its meta description */
export function summary(slug: string, chapter: number, max = 155): string {
  const text = chaptersOf(slug)[chapter - 1].verses.map(plainVerse).join(" ");
  return text.length <= max ? text : text.slice(0, text.lastIndexOf(" ", max - 1)) + "…";
}

/** Full-text search over all 31,102 verses; each query's result is cached */
export async function searchKjv(q: string, testament?: Testament, book?: string, page?: number) {
  "use cache";
  cacheLife("max");
  return searchBible(
    BOOKS.map((b) => ({ book: b, chapters: chaptersOf(b.slug) })),
    q,
    { testament, book, page },
  );
}
