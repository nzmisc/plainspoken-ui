import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";

const BOOKS = [
  { id: "beloved", title: "Beloved", author: "Toni Morrison", formats: ["book" as const] },
  { id: "station-eleven", title: "Station Eleven", author: "Emily St. John Mandel", formats: ["book" as const] },
  { id: "the-left-hand-of-darkness", title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", formats: ["book" as const] },
  { id: "salt-fat-acid-heat", title: "Salt, Fat, Acid, Heat", author: "Samin Nosrat", formats: ["book" as const] },
  { id: "spirited-away", title: "Spirited Away", author: "Hayao Miyazaki", formats: ["dvd" as const] },
];

/** Five titles, five covers: the colour and design come from each book's id, so they never change between visits. */
export default function LibraryBookCoverDemo() {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {BOOKS.map((b) => (
        <BookCover key={b.id} book={b} size="md" label={`${b.title} by ${b.author}`} />
      ))}
    </div>
  );
}
