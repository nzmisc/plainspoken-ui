import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { bibleHref, chapterName, type BibleBook } from "@/registry/plainspoken/blocks/bible/lib";
import { cn } from "@/lib/utils";

export interface BibleChapterGridProps {
  book: Pick<BibleBook, "slug" | "name" | "chapters">;
  /** Chapters link to `${basePath}/${book}/${n}` */
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** The chapter being read, marked as the current page */
  current?: number;
  className?: string;
}

/**
 * Every chapter of a book as a grid of numbered squares, 36px each so they are easy to hit on a
 * phone. A navigation landmark named after the book; the chapter being read is filled in and
 * marked aria-current.
 */
export function BibleChapterGrid({ book, basePath = "/bible", linkAs, current, className }: BibleChapterGridProps) {
  const L = linkAs ?? "a";
  return (
    <nav aria-label={`Chapters of ${book.name}`} data-slot="bible-chapter-grid" className={className}>
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
          <li key={n} className="flex">
            <L
              href={bibleHref(basePath, book.slug, n)}
              aria-current={n === current ? "page" : undefined}
              aria-label={chapterName(book, n)}
              className={cn(buttonVariants({ variant: n === current ? "primary" : "outline", size: "lg" }), "w-full px-0 tabular-nums")}
            >
              {n}
            </L>
          </li>
        ))}
      </ol>
    </nav>
  );
}
