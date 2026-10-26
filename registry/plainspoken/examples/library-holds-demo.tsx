import { LibraryHolds } from "@/registry/plainspoken/blocks/library/holds";

/** One hold ready, one on its way, two in a queue (one paused). Each row's ⋯ menu pauses, moves or cancels it. */
export default function LibraryHoldsDemo() {
  return (
    <LibraryHolds
      basePath="/demos/library"
      branches={[
        { id: "central", name: "Central Library" },
        { id: "riverside", name: "Riverside Branch" },
        { id: "northgate", name: "Northgate Branch" },
      ]}
      holds={[
        { book: { id: "james", title: "James", author: "Percival Everett", formats: ["book"] }, format: "book", pickup: "riverside", position: 1, queue: 14, status: "ready", until: "2026-10-28" },
        { book: { id: "orbital", title: "Orbital", author: "Samantha Harvey", formats: ["book"] }, format: "book", pickup: "riverside", position: 1, queue: 6, status: "in-transit" },
        { book: { id: "intermezzo", title: "Intermezzo", author: "Sally Rooney", formats: ["ebook"] }, format: "ebook", pickup: "riverside", position: 4, queue: 19, status: "waiting" },
        { book: { id: "onyx-storm", title: "Onyx Storm", author: "Rebecca Yarros", formats: ["audiobook"] }, format: "audiobook", pickup: "central", position: 27, queue: 31, status: "suspended", until: "2026-11-30" },
      ]}
    />
  );
}
