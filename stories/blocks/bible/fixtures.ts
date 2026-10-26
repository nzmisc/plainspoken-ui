// Real KJV text for the Bible stories: the book list and two whole books, Ruth and John.
import booksJson from "@/content/bible/books.json";
import johnJson from "@/content/bible/kjv/john.json";
import ruthJson from "@/content/bible/kjv/ruth.json";
import type { BibleBook, BibleChapterText } from "@/registry/plainspoken/blocks/bible/lib";

export const BASE = "/demos/bible";
export const BOOKS = booksJson as BibleBook[];
export const book = (slug: string) => BOOKS.find((b) => b.slug === slug)!;
export const RUTH = { book: book("ruth"), chapters: ruthJson.chapters as BibleChapterText[] };
export const JOHN = { book: book("john"), chapters: johnJson.chapters as BibleChapterText[] };
