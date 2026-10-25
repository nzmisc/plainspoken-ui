import type { ReactNode } from "react";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import { FORMAT_ICONS, FORMAT_LABELS, availabilityText, shortDate, type FormatAvailability, type LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export interface LibraryBookDetailsProps {
  book: LibraryBook;
  availability: FormatAvailability[];
  /** The shelf mark, shown with the facts */
  callNumber?: string;
  /** Subjects and the author link to the search page: `${searchPath}?in=subject&q=…` */
  searchPath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** Buttons under the description: Place hold, Add to list */
  actions?: ReactNode;
  className?: string;
}

/**
 * The top of a title's page in the catalogue: a large cover, the title as the page heading, the
 * author (a link to their other books), the formats with how each stands, the description, the
 * actions, and the facts as a description list (published, language, audience, subjects, call
 * number, added). Subjects are links to a subject search. Renders on the server.
 */
export function LibraryBookDetails({ book: b, availability, callNumber, searchPath = "/library/search", linkAs, actions, className }: LibraryBookDetailsProps) {
  const L = linkAs ?? "a";
  const search = (field: string, q: string) => `${searchPath}?in=${field}&q=${encodeURIComponent(q)}`;
  return (
    <article data-slot="library-book-details" className={cn("flex flex-col gap-5 sm:flex-row", className)}>
      <BookCover book={b} size="lg" className="self-start" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header>
          <h1 className="text-[26px] leading-tight font-bold">{b.title}</h1>
          {b.subtitle && <p className="text-[17px] leading-snug">{b.subtitle}</p>}
          <p className="mt-1 text-[15px]">
            {b.creatorRole ? `${b.creatorRole}: ` : "by "}
            <L href={search("author", b.author)} className={linkVariants()}>
              {b.author}
            </L>{" "}
            <span className="text-muted-foreground">· {b.year}</span>
          </p>
        </header>
        <ul aria-label="Formats" className="flex flex-wrap gap-1.5">
          {availability.map((a) => {
            const s = availabilityText(a);
            return (
              <li key={a.format}>
                <Badge icon={FORMAT_ICONS[a.format]} variant={s.variant === "default" ? "default" : s.variant}>
                  {FORMAT_LABELS[a.format]}: {s.text.toLowerCase()}
                </Badge>
              </li>
            );
          })}
        </ul>
        <p className="max-w-[68ch] text-[15px] leading-relaxed">{b.description}</p>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        <DescriptionList
          divided
          className="mt-1 max-w-2xl"
          items={[
            { term: b.creatorRole ?? "Author", description: b.author },
            { term: b.creatorRole ? "Released" : "First published", description: b.year },
            { term: "Language", description: b.language },
            { term: "Audience", description: b.audience },
            {
              term: "Subjects",
              description: (
                <span className="flex flex-wrap gap-x-3">
                  {b.subjects.map((s) => (
                    <L key={s} href={search("subject", s)} className={linkVariants()}>
                      {s}
                    </L>
                  ))}
                </span>
              ),
            },
            { term: "Formats", description: b.formats.map((f) => FORMAT_LABELS[f]).join(", ") },
            ...(callNumber ? [{ term: "Call number", description: <span className="font-mono text-[13px]">{callNumber}</span> }] : []),
            { term: "Added", description: shortDate(b.added, true) },
          ]}
        />
      </div>
    </article>
  );
}
