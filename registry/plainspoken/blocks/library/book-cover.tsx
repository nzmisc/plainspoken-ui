import type { LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export type BookCoverSize = "xs" | "sm" | "md" | "lg";

const SIZE: Record<BookCoverSize, { box: string; title: string; author: string; pad: string; clamp: string }> = {
  xs: { box: "w-8", title: "text-[5px]", author: "", pad: "p-0.5", clamp: "line-clamp-3" },
  sm: { box: "w-16", title: "text-[8px]", author: "text-[6px]", pad: "p-1", clamp: "line-clamp-4" },
  md: { box: "w-24", title: "text-[11px]", author: "text-[8px]", pad: "p-1.5", clamp: "line-clamp-4" },
  lg: { box: "w-40", title: "text-[18px]", author: "text-[12px]", pad: "p-2.5", clamp: "line-clamp-5" },
};

/** Four of the chart colours, as background tint, solid fill and border, written out so Tailwind finds them */
const PALETTE = [
  { tint: "bg-chart-1/20", solid: "bg-chart-1", border: "border-chart-1" },
  { tint: "bg-chart-2/20", solid: "bg-chart-2", border: "border-chart-2" },
  { tint: "bg-chart-3/20", solid: "bg-chart-3", border: "border-chart-3" },
  { tint: "bg-chart-4/20", solid: "bg-chart-4", border: "border-chart-4" },
];

/** FNV-1a: a small, stable number from a string, so a book always gets the same cover */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface BookCoverProps {
  book: Pick<LibraryBook, "id" | "title" | "author" | "formats">;
  /** xs 32px wide (table rows), sm 64px (lists), md 96px (shelves, results), lg 160px (the book's page) */
  size?: BookCoverSize;
  /**
   * The accessible name, for a cover that stands alone. Leave it out when the title is written
   * next to it (the usual case): the cover is then hidden from screen readers.
   */
  label?: string;
  className?: string;
}

/**
 * A book cover made of type, for catalogues with no cover images: the title and author on a
 * coloured design in a 2:3 box. The colour and the design (bands, a spine, a frame) come from the
 * book's id, so a title always looks the same and a shelf of them looks varied. Theme colours
 * only, with the text always in the foreground colour, so it reads in light and dark mode.
 */
export function BookCover({ book, size = "md", label, className }: BookCoverProps) {
  const h = hash(book.id);
  const c = PALETTE[h % PALETTE.length];
  const design = (h >>> 3) % 3;
  const s = SIZE[size];
  const dvd = book.formats.length === 1 && book.formats[0] === "dvd";
  const text = (
    <>
      <span className={cn("leading-[1.1] font-bold break-words", s.title, s.clamp, "[overflow-wrap:anywhere]")}>{book.title}</span>
      {size !== "xs" && <span className={cn("mt-auto line-clamp-2 leading-tight text-foreground/75", s.author)}>{book.author}</span>}
    </>
  );
  return (
    <div
      data-slot="book-cover"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative flex aspect-[2/3] shrink-0 flex-col overflow-hidden border border-border bg-background text-foreground select-none", s.box, className)}
    >
      {design === 0 && (
        // Bands: colour, a pale middle with the type, colour
        <>
          <div className={cn("h-[22%] shrink-0", c.solid)} />
          <div className={cn("flex min-h-0 flex-1 flex-col text-center", s.pad)}>{text}</div>
          <div className={cn("h-[14%] shrink-0", c.solid)} />
        </>
      )}
      {design === 1 && (
        // A tinted board with a solid spine down the left
        <div className={cn("flex min-h-0 flex-1", c.tint)}>
          <div className={cn("w-[12%] shrink-0", c.solid)} />
          <div className={cn("flex min-h-0 flex-1 flex-col", s.pad)}>{text}</div>
        </div>
      )}
      {design === 2 && (
        // A frame inset from the edge, type centred inside
        <div className={cn("flex min-h-0 flex-1", size === "xs" ? "p-px" : "p-[6%]")}>
          <div className={cn("flex min-h-0 flex-1 flex-col items-center border-2 text-center", c.border, s.pad)}>{text}</div>
        </div>
      )}
      {dvd && size !== "xs" && (
        <span className="absolute top-0 right-0 bg-foreground px-1 text-[8px] leading-[12px] font-bold text-background">DVD</span>
      )}
    </div>
  );
}
