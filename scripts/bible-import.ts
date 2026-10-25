// Converts eBible.org's King James Version (USFM) into the JSON the Bible demo reads.
//
//   node scripts/bible-import.ts <folder of unzipped eng-kjv_usfm.zip> content/bible
//
// Writes <out>/books.json (the 66 books, in canonical order) and <out>/kjv/<slug>.json (one per
// book). Only the 66 books of the Protestant canon are kept; the Apocrypha in the download is
// skipped. See content/bible/README.md for where the text comes from and how to fetch it.
//
// The downloaded files are only read as text, never run.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Testament = "OT" | "NT";

interface BookDef {
  code: string;
  slug: string;
  name: string;
  abbreviation: string;
  testament: Testament;
  section: string;
}

// prettier-ignore
const BOOKS: BookDef[] = [
  ["GEN", "genesis", "Genesis", "Gen", "OT", "Law"],
  ["EXO", "exodus", "Exodus", "Exod", "OT", "Law"],
  ["LEV", "leviticus", "Leviticus", "Lev", "OT", "Law"],
  ["NUM", "numbers", "Numbers", "Num", "OT", "Law"],
  ["DEU", "deuteronomy", "Deuteronomy", "Deut", "OT", "Law"],
  ["JOS", "joshua", "Joshua", "Josh", "OT", "History"],
  ["JDG", "judges", "Judges", "Judg", "OT", "History"],
  ["RUT", "ruth", "Ruth", "Ruth", "OT", "History"],
  ["1SA", "1-samuel", "1 Samuel", "1 Sam", "OT", "History"],
  ["2SA", "2-samuel", "2 Samuel", "2 Sam", "OT", "History"],
  ["1KI", "1-kings", "1 Kings", "1 Kgs", "OT", "History"],
  ["2KI", "2-kings", "2 Kings", "2 Kgs", "OT", "History"],
  ["1CH", "1-chronicles", "1 Chronicles", "1 Chr", "OT", "History"],
  ["2CH", "2-chronicles", "2 Chronicles", "2 Chr", "OT", "History"],
  ["EZR", "ezra", "Ezra", "Ezra", "OT", "History"],
  ["NEH", "nehemiah", "Nehemiah", "Neh", "OT", "History"],
  ["EST", "esther", "Esther", "Esth", "OT", "History"],
  ["JOB", "job", "Job", "Job", "OT", "Poetry"],
  ["PSA", "psalms", "Psalms", "Ps", "OT", "Poetry"],
  ["PRO", "proverbs", "Proverbs", "Prov", "OT", "Poetry"],
  ["ECC", "ecclesiastes", "Ecclesiastes", "Eccl", "OT", "Poetry"],
  ["SNG", "song-of-solomon", "Song of Solomon", "Song", "OT", "Poetry"],
  ["ISA", "isaiah", "Isaiah", "Isa", "OT", "Major Prophets"],
  ["JER", "jeremiah", "Jeremiah", "Jer", "OT", "Major Prophets"],
  ["LAM", "lamentations", "Lamentations", "Lam", "OT", "Major Prophets"],
  ["EZK", "ezekiel", "Ezekiel", "Ezek", "OT", "Major Prophets"],
  ["DAN", "daniel", "Daniel", "Dan", "OT", "Major Prophets"],
  ["HOS", "hosea", "Hosea", "Hos", "OT", "Minor Prophets"],
  ["JOL", "joel", "Joel", "Joel", "OT", "Minor Prophets"],
  ["AMO", "amos", "Amos", "Amos", "OT", "Minor Prophets"],
  ["OBA", "obadiah", "Obadiah", "Obad", "OT", "Minor Prophets"],
  ["JON", "jonah", "Jonah", "Jonah", "OT", "Minor Prophets"],
  ["MIC", "micah", "Micah", "Mic", "OT", "Minor Prophets"],
  ["NAM", "nahum", "Nahum", "Nah", "OT", "Minor Prophets"],
  ["HAB", "habakkuk", "Habakkuk", "Hab", "OT", "Minor Prophets"],
  ["ZEP", "zephaniah", "Zephaniah", "Zeph", "OT", "Minor Prophets"],
  ["HAG", "haggai", "Haggai", "Hag", "OT", "Minor Prophets"],
  ["ZEC", "zechariah", "Zechariah", "Zech", "OT", "Minor Prophets"],
  ["MAL", "malachi", "Malachi", "Mal", "OT", "Minor Prophets"],
  ["MAT", "matthew", "Matthew", "Matt", "NT", "Gospels"],
  ["MRK", "mark", "Mark", "Mark", "NT", "Gospels"],
  ["LUK", "luke", "Luke", "Luke", "NT", "Gospels"],
  ["JHN", "john", "John", "John", "NT", "Gospels"],
  ["ACT", "acts", "Acts", "Acts", "NT", "History"],
  ["ROM", "romans", "Romans", "Rom", "NT", "Pauline Epistles"],
  ["1CO", "1-corinthians", "1 Corinthians", "1 Cor", "NT", "Pauline Epistles"],
  ["2CO", "2-corinthians", "2 Corinthians", "2 Cor", "NT", "Pauline Epistles"],
  ["GAL", "galatians", "Galatians", "Gal", "NT", "Pauline Epistles"],
  ["EPH", "ephesians", "Ephesians", "Eph", "NT", "Pauline Epistles"],
  ["PHP", "philippians", "Philippians", "Phil", "NT", "Pauline Epistles"],
  ["COL", "colossians", "Colossians", "Col", "NT", "Pauline Epistles"],
  ["1TH", "1-thessalonians", "1 Thessalonians", "1 Thess", "NT", "Pauline Epistles"],
  ["2TH", "2-thessalonians", "2 Thessalonians", "2 Thess", "NT", "Pauline Epistles"],
  ["1TI", "1-timothy", "1 Timothy", "1 Tim", "NT", "Pauline Epistles"],
  ["2TI", "2-timothy", "2 Timothy", "2 Tim", "NT", "Pauline Epistles"],
  ["TIT", "titus", "Titus", "Titus", "NT", "Pauline Epistles"],
  ["PHM", "philemon", "Philemon", "Phlm", "NT", "Pauline Epistles"],
  ["HEB", "hebrews", "Hebrews", "Heb", "NT", "Pauline Epistles"],
  ["JAS", "james", "James", "Jas", "NT", "General Epistles"],
  ["1PE", "1-peter", "1 Peter", "1 Pet", "NT", "General Epistles"],
  ["2PE", "2-peter", "2 Peter", "2 Pet", "NT", "General Epistles"],
  ["1JN", "1-john", "1 John", "1 John", "NT", "General Epistles"],
  ["2JN", "2-john", "2 John", "2 John", "NT", "General Epistles"],
  ["3JN", "3-john", "3 John", "3 John", "NT", "General Epistles"],
  ["JUD", "jude", "Jude", "Jude", "NT", "General Epistles"],
  ["REV", "revelation", "Revelation", "Rev", "NT", "Prophecy"],
].map(([code, slug, name, abbreviation, testament, section]) => ({ code, slug, name, abbreviation, testament: testament as Testament, section }));

interface Chapter {
  /** The verses, verse n at index n-1. Words the translators added (printed in italics) are in {braces}. */
  verses: string[];
  /** Verses that start a paragraph (a stanza in the Psalms) */
  paragraphs: number[];
  /** A psalm's title ("A Psalm of David."), printed above verse 1 */
  title?: string;
  /** Headings before a verse: the Hebrew letters of Psalm 119 */
  headings?: Record<string, string>;
  /** The note after the last verse of most epistles: "Written to the Romans from Corinthus…" */
  postscript?: string;
  /** Psalms: every verse is a line of verse */
  poetry?: boolean;
}

const fail = (msg: string): never => {
  console.error(`bible-import: ${msg}`);
  process.exit(1);
};

/** USFM character markup to plain text, keeping the italics of added words as {braces} */
function inline(s: string): string {
  let t = s
    .replace(/\\f\s.*?\\f\*/g, "") // footnotes: the KJV margin notes
    .replace(/\\x\s.*?\\x\*/g, "") // cross references
    .replace(/\\\+?w\s([^\\|]*?)(\|[^\\]*)?\\\+?w\*/g, "$1") // words with Strong's numbers
    .replace(/\\\+?add\s/g, "{")
    .replace(/\\\+?add\*/g, "}")
    .replace(/\\\+?(nd|wj|tl|sc|it|bd|qs)\s/g, "")
    .replace(/\\\+?(nd|wj|tl|sc|it|bd|qs)\*/g, "")
    .replace(/¶\s*/g, "");
  t = t.replace(/\s+/g, " ").replace(/\{\s+/g, "{").replace(/\s+\}/g, "}").replace(/\s+([,.;:?!’)])/g, "$1").trim();
  if (t.includes("\\")) fail(`unhandled markup in: ${t.slice(0, 120)}`);
  if (t.includes("{") !== t.includes("}")) fail(`unbalanced italics in: ${t.slice(0, 120)}`);
  return t;
}

function parseBook(text: string, def: BookDef) {
  // Split into [marker, rest] pieces at every paragraph-level marker
  const parts = text.split(/\\(id|ide|h|toc1|toc2|toc3|mt1|mt2|imt1|ip|is1|ms1|c|v|p|q1|q2|m|b|d|s1|s2)(?=\s|$)/);
  let title = "";
  const chapters: Chapter[] = [];
  let ch: Chapter | null = null;
  let verse = 0;
  let pendingParagraph = false;
  let pendingHeading: string | null = null;
  let lastKind: "verse" | "title" | "heading" | "other" = "other";

  const closeChapter = () => {
    if (ch && pendingHeading) ch.postscript = pendingHeading;
    pendingHeading = null;
  };

  for (let i = 1; i < parts.length; i += 2) {
    const marker = parts[i];
    const body = parts[i + 1] ?? "";
    switch (marker) {
      case "toc1":
        title = inline(body);
        break;
      case "c": {
        closeChapter();
        const n = Number(body.trim().split(/\s/)[0]);
        if (n !== chapters.length + 1) fail(`${def.code}: chapter ${n} after ${chapters.length}`);
        ch = { verses: [], paragraphs: [] };
        if (def.code === "PSA") ch.poetry = true;
        chapters.push(ch);
        verse = 0;
        pendingParagraph = true;
        lastKind = "other";
        break;
      }
      case "v": {
        if (!ch) fail(`${def.code}: verse before a chapter`);
        const m = /^\s*(\d+)\s?([\s\S]*)$/.exec(body);
        if (!m) fail(`${def.code} ${chapters.length}: bad verse "${body.slice(0, 40)}"`);
        const n = Number(m![1]);
        if (n !== verse + 1) fail(`${def.code} ${chapters.length}: verse ${n} after ${verse}`);
        verse = n;
        ch!.verses.push(inline(m![2]));
        if (pendingParagraph) ch!.paragraphs.push(n);
        pendingParagraph = false;
        if (pendingHeading) (ch!.headings ??= {})[String(n)] = pendingHeading;
        pendingHeading = null;
        lastKind = "verse";
        break;
      }
      case "p":
      case "m":
      case "b":
        pendingParagraph = true;
        // Text straight after the marker continues the verse it is in
        if (body.trim() && ch && lastKind === "verse") ch.verses[verse - 1] += " " + inline(body);
        break;
      case "q1":
      case "q2":
        // In the Psalms every verse starts with \q1; only \b (a stanza break) starts a paragraph
        if (def.code !== "PSA") pendingParagraph = true;
        if (body.trim() && ch && lastKind === "verse") ch.verses[verse - 1] += " " + inline(body);
        break;
      case "d":
        if (!ch) fail(`${def.code}: title before a chapter`);
        ch!.title = inline(body);
        lastKind = "title";
        break;
      case "s1":
      case "s2":
        pendingHeading = inline(body);
        lastKind = "heading";
        break;
      default:
        // Book metadata and introductions: not needed
        lastKind = "other";
    }
  }
  closeChapter();
  // A psalm's first verse starts its first paragraph; elsewhere make sure verse 1 does
  for (const c of chapters) if (c.paragraphs[0] !== 1) c.paragraphs.unshift(1);
  return { title, chapters };
}

function main() {
  const [src, out] = process.argv.slice(2);
  if (!src || !out) fail("usage: node scripts/bible-import.ts <usfm folder> <output folder>");
  const files = readdirSync(src).filter((f) => f.endsWith(".usfm"));
  mkdirSync(join(out, "kjv"), { recursive: true });
  const index = [];
  let totalChapters = 0;
  let totalVerses = 0;
  for (const def of BOOKS) {
    const file = files.find((f) => new RegExp(`^\\d+-${def.code}`).test(f));
    if (!file) fail(`no file for ${def.code}`);
    const text = readFileSync(join(src, file!), "utf8");
    const { title, chapters } = parseBook(text, def);
    const verses = chapters.reduce((n, c) => n + c.verses.length, 0);
    for (const [i, c] of chapters.entries()) if (!c.verses.length || c.verses.some((v) => !v)) fail(`${def.code} ${i + 1}: empty verse`);
    totalChapters += chapters.length;
    totalVerses += verses;
    writeFileSync(join(out, "kjv", `${def.slug}.json`), JSON.stringify({ slug: def.slug, name: def.name, title, chapters }) + "\n");
    index.push({ slug: def.slug, name: def.name, title, abbreviation: def.abbreviation, testament: def.testament, section: def.section, chapters: chapters.length, verses });
  }
  writeFileSync(join(out, "books.json"), JSON.stringify(index, null, 2) + "\n");
  console.log(`${index.length} books, ${totalChapters} chapters, ${totalVerses} verses`);
  const ot = index.filter((b) => b.testament === "OT");
  console.log(`OT: ${ot.length} books, ${ot.reduce((n, b) => n + b.chapters, 0)} chapters, ${ot.reduce((n, b) => n + b.verses, 0)} verses`);
  if (index.length !== 66) fail("expected 66 books");
}

main();
