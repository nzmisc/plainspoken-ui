import { LibraryReadingHistory } from "@/registry/plainspoken/blocks/library/reading-history";

const ROWS = [
  ["the-remains-of-the-day", "The Remains of the Day", "Kazuo Ishiguro", "book", "2025-01-08", "2025-01-27"],
  ["educated", "Educated", "Tara Westover", "audiobook", "2025-01-29", "2025-02-19"],
  ["the-martian", "The Martian", "Andy Weir", "book", "2025-02-15", "2025-02-27"],
  ["paddington", "Paddington", "Paul King", "dvd", "2025-04-19", "2025-04-25"],
  ["circe", "Circe", "Madeline Miller", "ebook", "2025-05-03", "2025-05-21"],
  ["h-is-for-hawk", "H Is for Hawk", "Helen Macdonald", "book", "2025-07-12", "2025-08-02"],
] as const;

/** A year and a half of borrowing: sort by any column (Shift for several), filter, hide columns, export. */
export default function LibraryReadingHistoryDemo() {
  return (
    <LibraryReadingHistory
      basePath="/demos/library"
      rows={ROWS.map(([id, title, author, format, borrowed, returned]) => ({ book: { id, title, author }, format, borrowed, returned }))}
    />
  );
}
