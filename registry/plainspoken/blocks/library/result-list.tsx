import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Status } from "@/registry/plainspoken/ui/status";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import { LibraryHoldDialog } from "@/registry/plainspoken/blocks/library/hold-dialog";
import {
  FORMAT_ICONS,
  FORMAT_LABELS,
  availabilityText,
  creatorLine,
  type Branch,
  type FormatAvailability,
  type LibraryBook,
} from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export interface LibraryResult {
  book: LibraryBook;
  availability: FormatAvailability[];
}

export interface LibraryResultListProps {
  results: LibraryResult[];
  /** Titles link to `${basePath}/book/${id}` */
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** For the hold dialog */
  branches: Pick<Branch, "id" | "name">[];
  defaultBranch?: string;
  today?: ISODate;
  /** Number of the first result, so a second page continues the count */
  start?: number;
  className?: string;
}

/**
 * Catalogue search results: for each title its cover, the title as a link, the author and year,
 * a line of description, and every format it comes in with where that format stands ("2 of 5
 * available", "On hold: 3 waiting") in words and a symbol, plus a Place hold button. An ordered
 * list, numbered from `start`, so a screen reader hears "3 of 20" and page two goes on from 21.
 */
export function LibraryResultList({ results, basePath = "/library", linkAs, branches, defaultBranch, today, start = 1, className }: LibraryResultListProps) {
  const L = linkAs ?? "a";
  return (
    <ol start={start} data-slot="library-result-list" className={cn("border-t border-border", className)}>
      {results.map(({ book: b, availability }) => (
        <li key={b.id} className="flex gap-3 border-b border-border py-3">
          <L href={`${basePath}/book/${b.id}`} tabIndex={-1} aria-hidden className="shrink-0">
            <BookCover book={b} size="sm" />
          </L>
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] leading-snug font-bold">
                <L href={`${basePath}/book/${b.id}`} className={linkVariants()}>
                  {b.title}
                </L>
                {b.subtitle && <span className="font-normal">: {b.subtitle}</span>}
              </h3>
              <p className="text-[13px] text-muted-foreground">
                {creatorLine(b)} · {b.year}
                {b.language !== "English" && ` · ${b.language}`}
                {b.audience !== "Adult" && ` · ${b.audience}`}
              </p>
              <p className="mt-1 hidden max-w-[70ch] text-[13px] sm:block">
                <span className="line-clamp-2">{b.description}</span>
              </p>
              <ul className="mt-1.5 flex flex-col gap-1 text-[13px]">
                {availability.map((a) => {
                  const s = availabilityText(a);
                  return (
                    <li key={a.format} className="flex flex-wrap items-baseline gap-x-2">
                      <Badge icon={FORMAT_ICONS[a.format]} className="min-w-[6.5rem]">
                        {FORMAT_LABELS[a.format]}
                      </Badge>
                      <Status variant={s.variant}>{s.text}</Status>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="ctl-sm mt-1 shrink-0 sm:mt-0">
              <LibraryHoldDialog book={b} availability={availability} branches={branches} defaultBranch={defaultBranch} today={today} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
