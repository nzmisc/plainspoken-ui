import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { bibleHref, groupBooks, type BibleBook } from "@/registry/plainspoken/blocks/bible/lib";
import { cn } from "@/lib/utils";

export interface BibleBookListProps {
  /** The books in canonical order */
  books: BibleBook[];
  /** Where the reader lives: books link to `${basePath}/${slug}` */
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** Heading level of the testaments; the sections get the next one down. Default h2. */
  headingLevel?: 2 | 3;
  className?: string;
}

/**
 * The table of contents of a Bible: the Old and New Testaments side by side on wide screens, each
 * book under its section (Law, History, Poetry, the Prophets, Gospels, Epistles), with its number
 * of chapters. The book names are ordinary links, so the list reads and prints like a contents page.
 */
export function BibleBookList({ books, basePath = "/bible", linkAs, headingLevel = 2, className }: BibleBookListProps) {
  const L = linkAs ?? "a";
  const H = `h${headingLevel}` as "h2";
  const H2 = `h${headingLevel + 1}` as "h3";
  return (
    <div data-slot="bible-book-list" className={cn("grid gap-x-10 gap-y-8 md:grid-cols-2", className)}>
      {groupBooks(books).map((g) =>
        g.sections.length === 0 ? null : (
          <section key={g.testament} aria-labelledby={`testament-${g.testament}`} className="min-w-0">
            <H id={`testament-${g.testament}`} className="flex items-baseline gap-2 border-b border-border pb-1 text-[16px] font-bold">
              {g.name}
              <span className="text-[13px] font-normal text-muted-foreground">
                {g.sections.reduce((n, s) => n + s.books.length, 0)} books
              </span>
            </H>
            {g.sections.map((s) => (
              <section key={s.name} className="mt-3">
                <H2 className="mb-1 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{s.name}</H2>
                <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
                  {s.books.map((b) => (
                    <li key={b.slug} className="flex items-baseline justify-between gap-2 py-0.5">
                      <L href={bibleHref(basePath, b.slug)} className={cn(linkVariants(), "min-w-0 truncate")}>
                        {b.name}
                      </L>
                      <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums" title={`${b.chapters} chapters`}>
                        <span className="sr-only">, </span>
                        {b.chapters}
                        <span className="sr-only"> {b.chapters === 1 ? "chapter" : "chapters"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
        ),
      )}
    </div>
  );
}
