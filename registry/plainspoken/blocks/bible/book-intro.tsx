import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { ArrowRight } from "@/registry/plainspoken/lib/icons";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { TESTAMENT_NAMES, bibleHref, chapterName, type BibleBook } from "@/registry/plainspoken/blocks/bible/lib";
import { cn } from "@/lib/utils";

export interface BibleBookIntroProps {
  book: BibleBook;
  /** A few sentences about the book */
  description?: string;
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

const nf = new Intl.NumberFormat("en-US");

/**
 * The top of a book's page: its name as the page heading, its own title in the KJV, a short
 * description, the facts (testament, section, chapters, verses) and a link to start at chapter 1.
 */
export function BibleBookIntro({ book, description, basePath = "/bible", linkAs, className }: BibleBookIntroProps) {
  const L = linkAs ?? "a";
  return (
    <header data-slot="bible-book-intro" className={cn("flex max-w-[68ch] flex-col gap-3", className)}>
      <div>
        <h1 className="text-[28px] leading-tight font-bold">{book.name}</h1>
        {book.title && book.title !== book.name && <p className="text-[14px] text-muted-foreground">{book.title}</p>}
      </div>
      {description && <p className="text-[16px] leading-relaxed">{description}</p>}
      <DescriptionList
        className="text-[14px]"
        items={[
          { term: "Testament", description: TESTAMENT_NAMES[book.testament] },
          { term: "Section", description: book.section },
          { term: "Chapters", description: <span className="tabular-nums">{book.chapters}</span> },
          ...(book.verses ? [{ term: "Verses", description: <span className="tabular-nums">{nf.format(book.verses)}</span> }] : []),
        ]}
      />
      <div>
        <L href={bibleHref(basePath, book.slug, 1)} className={buttonVariants({ variant: "primary" })}>
          Read {chapterName(book, 1)}
          <Icon icon={ArrowRight} />
        </L>
      </div>
    </header>
  );
}
