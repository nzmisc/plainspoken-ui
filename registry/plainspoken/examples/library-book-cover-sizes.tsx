import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";

const BOOK = { id: "north-woods", title: "North Woods", author: "Daniel Mason", formats: ["book" as const] };

/** xs for table rows, sm for lists, md for shelves and results, lg for the book's own page. */
export default function LibraryBookCoverSizes() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {(["xs", "sm", "md", "lg"] as const).map((s) => (
        <figure key={s} className="flex flex-col items-start gap-1">
          <BookCover book={BOOK} size={s} />
          <figcaption className="font-mono text-[12px] text-muted-foreground">{s}</figcaption>
        </figure>
      ))}
    </div>
  );
}
