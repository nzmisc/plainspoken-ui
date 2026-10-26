import type { ReactNode } from "react";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { chapterName, verseRuns, type BibleBook, type BibleChapterText } from "@/registry/plainspoken/blocks/bible/lib";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

/*
 * The reader's settings (see reader-settings.tsx) are data attributes on <html>, set before the
 * first paint, and every rule here that depends on one is an `in-data-[…]` variant: it applies when
 * an ancestor has the attribute. So the server renders one chapter for every reader, and there is
 * no flash of the wrong size or layout while the page loads.
 */
const SIZE =
  "text-[17px] leading-[1.7] in-data-[bible-size=sm]:text-[15px] in-data-[bible-size=lg]:text-[19px] in-data-[bible-size=xl]:text-[22px] in-data-[bible-size=xl]:leading-[1.65]";
const SERIF = "in-data-[bible-font=serif]:[font-family:Charter,'Bitstream_Charter','Iowan_Old_Style','Sitka_Text',Cambria,Georgia,serif]";
const VERSE_NUMBER =
  "static mr-[0.2em] ml-[0.1em] align-[0.45em] text-[0.62em] leading-none font-semibold text-muted-foreground in-data-[bible-numbers=off]:hidden";

export interface BibleChapterProps {
  book: Pick<BibleBook, "slug" | "name" | "title">;
  chapter: number;
  text: BibleChapterText;
  /** Show the book's own title ("The First Book of Moses, called Genesis") over the heading. Default: on chapter 1. */
  showBookTitle?: boolean;
  /** Under the heading: a toolbar, the reader settings */
  toolbar?: ReactNode;
  /** The heading's level: h1 on the chapter's own page (default), h2 inside another page */
  as?: "h1" | "h2";
  /** Verse n gets the id `${verseIdPrefix}${n}`, and its number links there. Default "v": #v16. */
  verseIdPrefix?: string;
  className?: string;
}

/** Splits the chapter into paragraphs (and stanzas), starting a new one at each heading too */
function paragraphsOf(text: BibleChapterText) {
  const starts = new Set([1, ...(text.paragraphs ?? []), ...Object.keys(text.headings ?? {}).map(Number)]);
  const out: { heading?: string; verses: number[] }[] = [];
  text.verses.forEach((_, i) => {
    const n = i + 1;
    if (starts.has(n) || out.length === 0) out.push({ heading: text.headings?.[String(n)], verses: [] });
    out.at(-1)!.verses.push(n);
  });
  return out;
}

/**
 * One chapter of the Bible, set for reading: the heading, a psalm's title, the verses with small
 * raised numbers in paragraphs (or one verse per line), the words the translators supplied in
 * italics, and any closing note. Each verse is an element with the id `v<n>`, so `#v16` links to
 * it, and its number is that link. Size, typeface, numbers and layout follow the reader settings
 * (BibleReaderSettings) without a flash; poetry is always one verse per line.
 *
 * A verse linked to (#v16) is underlined. Each verse carries data-verse, for anything you add on
 * top (bookmarks, highlights). Renders on the server; no script.
 */
export function BibleChapter({ book, chapter, text, showBookTitle = chapter === 1, toolbar, as: H = "h1", verseIdPrefix = "v", className }: BibleChapterProps) {
  const H2 = H === "h1" ? "h2" : "h3";
  return (
    <Prose as="article" size="lg" data-slot="bible-chapter" className={cn(SIZE, SERIF, "max-w-[68ch]", className)} aria-labelledby={`${book.slug}-${chapter}-heading`}>
      <header className="mb-[1em]">
        {showBookTitle && book.title && <p className="mb-[0.2em]! font-sans text-[13px] text-muted-foreground">{book.title}</p>}
        <H id={`${book.slug}-${chapter}-heading`} className="mt-0! border-0! pb-0! text-[1.6em]">
          {chapterName(book, chapter)}
        </H>
        {toolbar && <div className="mt-2 font-sans text-[14px] leading-normal">{toolbar}</div>}
      </header>
      {text.title && <p className="text-[0.88em] text-muted-foreground italic">{text.title}</p>}
      {paragraphsOf(text).map((p) => (
        <div key={p.verses[0]} className="contents">
          {p.heading && <H2 className="mt-[1.2em]! mb-[0.3em]! border-0! pb-0! text-[0.95em] tracking-wide">{p.heading}</H2>}
          <p>
            {p.verses.map((n) => (
              <span
                key={n}
                id={`${verseIdPrefix}${n}`}
                data-verse={n}
                className={cn(
                  "scroll-mt-24 box-decoration-clone",
                  text.poetry ? "block pl-[1em] -indent-[1em]" : "in-data-[bible-layout=lines]:block",
                  "target:underline target:decoration-primary target:decoration-2 target:underline-offset-[0.2em]",
                )}
              >
                <sup className={VERSE_NUMBER}>
                  <a
                    href={`#${verseIdPrefix}${n}`}
                    aria-label={`Verse ${n}`}
                    className={cn("text-inherit! no-underline! hover:underline! visited:text-inherit!", FOCUS_RING)}
                  >
                    {n}
                  </a>
                </sup>
                {verseRuns(text.verses[n - 1]).map((r, i) => (r.added ? <i key={i}>{r.text}</i> : r.text))}{" "}
              </span>
            ))}
          </p>
        </div>
      ))}
      {text.postscript && <p className="mt-[1.2em]! text-[0.88em] text-muted-foreground italic">{text.postscript}</p>}
    </Prose>
  );
}
