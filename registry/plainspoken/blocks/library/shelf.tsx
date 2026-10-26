import type { ReactNode } from "react";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import type { LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export interface LibraryShelfProps {
  /** The shelf's heading: "New arrivals", "Similar titles" */
  title: ReactNode;
  books: Pick<LibraryBook, "id" | "title" | "author" | "formats" | "year">[];
  /** Books link to `${basePath}/book/${id}` */
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** Right of the heading: "See all" */
  action?: ReactNode;
  /** The heading's level. Default h2. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * A row of covers with their titles and authors, like a display shelf: new arrivals, similar
 * titles, a reading list. It scrolls sideways (and snaps cover by cover) when it holds more than
 * fit, so the page doesn't; it is a list, so screen readers say how many it holds.
 */
export function LibraryShelf({ title, books, basePath = "/library", linkAs, action, as: H = "h2", className }: LibraryShelfProps) {
  const L = linkAs ?? "a";
  return (
    <section data-slot="library-shelf" className={cn("min-w-0", className)}>
      <div className="mb-2 flex items-baseline gap-3 border-b border-border pb-1">
        <H className="text-[16px] font-bold">{title}</H>
        {action && <div className="ml-auto text-[13px]">{action}</div>}
      </div>
      <ul className="flex snap-x gap-4 overflow-x-auto pb-2">
        {books.map((b) => (
          <li key={b.id} className="w-24 shrink-0 snap-start">
            <L href={`${basePath}/book/${b.id}`} className="group block text-foreground no-underline visited:text-foreground">
              <BookCover book={b} size="md" />
              <span className={cn(linkVariants(), "mt-1.5 line-clamp-2 text-[13px] leading-snug font-medium group-hover:decoration-2")}>{b.title}</span>
            </L>
            <span className="line-clamp-1 text-[12px] text-muted-foreground">{b.author}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
