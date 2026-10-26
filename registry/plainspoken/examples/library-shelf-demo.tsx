import { LibraryShelf } from "@/registry/plainspoken/blocks/library/shelf";

const BOOKS = [
  { id: "james", title: "James", author: "Percival Everett", year: 2024, formats: ["book" as const] },
  { id: "orbital", title: "Orbital", author: "Samantha Harvey", year: 2023, formats: ["book" as const] },
  { id: "intermezzo", title: "Intermezzo", author: "Sally Rooney", year: 2024, formats: ["book" as const] },
  { id: "north-woods", title: "North Woods", author: "Daniel Mason", year: 2023, formats: ["book" as const] },
  { id: "the-covenant-of-water", title: "The Covenant of Water", author: "Abraham Verghese", year: 2023, formats: ["book" as const] },
  { id: "long-island", title: "Long Island", author: "Colm Tóibín", year: 2024, formats: ["book" as const] },
  { id: "prophet-song", title: "Prophet Song", author: "Paul Lynch", year: 2023, formats: ["book" as const] },
  { id: "the-god-of-the-woods", title: "The God of the Woods", author: "Liz Moore", year: 2024, formats: ["book" as const] },
];

/** New arrivals: more covers than fit, so the shelf scrolls sideways on its own. */
export default function LibraryShelfDemo() {
  return <LibraryShelf title="New arrivals" books={BOOKS} basePath="/demos/library" action={<a href="/demos/library/search" className="text-link underline">See all</a>} />;
}
