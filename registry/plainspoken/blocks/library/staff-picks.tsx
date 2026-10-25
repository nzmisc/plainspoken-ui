import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Card, CardContent, CardFooter } from "@/registry/plainspoken/ui/card";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import { creatorLine, type LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export interface StaffPick {
  book: Pick<LibraryBook, "id" | "title" | "author" | "creatorRole" | "formats" | "year">;
  /** Who recommends it */
  by: string;
  /** Where they work: "Riverside Branch" */
  branch: string;
  /** Why, in their words */
  note: string;
}

export interface LibraryStaffPicksProps {
  picks: StaffPick[];
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

/**
 * Librarians' recommendations as cards: the cover, the title and author, the note in the staff
 * member's own words, and who wrote it and where they work. Two to a row on wide screens.
 */
export function LibraryStaffPicks({ picks, basePath = "/library", linkAs, className }: LibraryStaffPicksProps) {
  const L = linkAs ?? "a";
  return (
    <ul data-slot="library-staff-picks" className={cn("grid gap-3 md:grid-cols-2", className)}>
      {picks.map((p) => (
        <li key={p.book.id} className="flex">
          <Card className="flex-1">
            <CardContent className="flex gap-3">
              <BookCover book={p.book} size="sm" />
              <div className="min-w-0">
                <h3 className="text-[15px] leading-snug font-bold">
                  <L href={`${basePath}/book/${p.book.id}`} className={linkVariants()}>
                    {p.book.title}
                  </L>
                </h3>
                <p className="text-[13px] text-muted-foreground">
                  {creatorLine(p.book)}, {p.book.year}
                </p>
                <blockquote className="mt-2 border-l-[3px] border-border pl-2.5 text-[14px] leading-relaxed">{p.note}</blockquote>
              </div>
            </CardContent>
            <CardFooter className="gap-2 text-[13px]">
              <Avatar name={p.by} size={20} />
              <span>
                <b className="font-semibold">{p.by}</b>
                <span className="text-muted-foreground">, {p.branch}</span>
              </span>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
