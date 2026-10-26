// What the Bible blocks share: the shape of the text, verse references and links, books grouped
// for a contents page. No React here, so it is safe on the server.

export type Testament = "OT" | "NT";

export const TESTAMENT_NAMES: Record<Testament, string> = { OT: "Old Testament", NT: "New Testament" };

/** One book, without its text: what a list of books or a chapter picker needs */
export interface BibleBook {
  slug: string;
  /** Short name: "Genesis", "1 Samuel", "Song of Solomon" */
  name: string;
  /** The book's own title in the KJV: "The First Book of Moses, called Genesis" */
  title?: string;
  /** "Gen", "1 Sam" */
  abbreviation: string;
  testament: Testament;
  /** Law, History, Poetry, Major Prophets, Minor Prophets, Gospels, Pauline Epistles, General Epistles, Prophecy */
  section: string;
  chapters: number;
  verses?: number;
}

/** One chapter's text */
export interface BibleChapterText {
  /** Verse n at index n-1. Words in {braces} were supplied by the translators and are set in italics. */
  verses: string[];
  /** Verses that start a paragraph (a stanza, in poetry) */
  paragraphs?: number[];
  /** A psalm's title, printed above verse 1 */
  title?: string;
  /** Headings before a verse, by verse number (Psalm 119's Hebrew letters) */
  headings?: Record<string, string>;
  /** A note after the last verse ("Written to the Romans from Corinthus…") */
  postscript?: string;
  /** Every verse on its own line, whatever the reader's layout setting */
  poetry?: boolean;
}

/** "Psalm 23" rather than "Psalms 23": the book of Psalms, but one psalm */
export function chapterName(book: Pick<BibleBook, "slug" | "name">, chapter: number): string {
  return `${book.slug === "psalms" ? "Psalm" : book.name} ${chapter}`;
}

/** "John 3:16", "Psalm 23:1", "John 3" without a verse */
export function verseRef(book: Pick<BibleBook, "slug" | "name">, chapter: number, verse?: number): string {
  return verse == null ? chapterName(book, chapter) : `${chapterName(book, chapter)}:${verse}`;
}

/** The URL of a book, a chapter or a verse under `basePath` ("/bible/john/3#v16") */
export function bibleHref(basePath: string, book: string, chapter?: number, verse?: number): string {
  return `${basePath}/${book}${chapter ? `/${chapter}` : ""}${chapter && verse ? `#v${verse}` : ""}`;
}

/** The verse text without the italics markers */
export function plainVerse(text: string): string {
  return text.replace(/[{}]/g, "");
}

/** The verse split into runs of plain text and of the translators' added (italic) words */
export function verseRuns(text: string): { text: string; added: boolean }[] {
  return text
    .split(/(\{[^}]*\})/)
    .filter(Boolean)
    .map((t) => (t.startsWith("{") ? { text: t.slice(1, -1), added: true } : { text: t, added: false }));
}

/** The chapter before and after, across book boundaries; null at Genesis 1 and Revelation 22 */
export function neighbours(books: BibleBook[], slug: string, chapter: number) {
  const i = books.findIndex((b) => b.slug === slug);
  const book = books[i];
  const prev =
    chapter > 1 ? { book, chapter: chapter - 1 } : i > 0 ? { book: books[i - 1], chapter: books[i - 1].chapters } : null;
  const next =
    chapter < book.chapters ? { book, chapter: chapter + 1 } : i < books.length - 1 ? { book: books[i + 1], chapter: 1 } : null;
  return { prev, next };
}

/** Books in canonical order, grouped by testament, then by section in order of first appearance */
export function groupBooks(books: BibleBook[]) {
  return (["OT", "NT"] as const).map((t) => {
    const sections: { name: string; books: BibleBook[] }[] = [];
    for (const b of books.filter((x) => x.testament === t)) {
      const last = sections.at(-1);
      if (last?.name === b.section) last.books.push(b);
      else sections.push({ name: b.section, books: [b] });
    }
    return { testament: t, name: TESTAMENT_NAMES[t], sections };
  });
}
