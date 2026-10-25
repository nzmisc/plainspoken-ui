import { LibraryCopiesTable } from "@/registry/plainspoken/blocks/library/copies-table";

/** Every copy of one title by branch, with its shelf, call number and status, and the e-book licences last. */
export default function LibraryCopiesTableDemo() {
  return (
    <LibraryCopiesTable
      branches={[
        { id: "central", name: "Central Library" },
        { id: "riverside", name: "Riverside Branch" },
        { id: "northgate", name: "Northgate Branch" },
      ]}
      copies={[
        { branch: "central", format: "book", callNumber: "FIC ATW", location: "Adult fiction", status: "available" },
        { branch: "central", format: "book", callNumber: "FIC ATW", location: "Adult fiction", status: "checked-out", due: "2026-11-02" },
        { branch: "riverside", format: "book", callNumber: "FIC ATW", location: "Adult fiction", status: "hold-shelf" },
        { branch: "northgate", format: "book", callNumber: "FIC ATW", location: "Adult fiction", status: "in-transit" },
      ]}
      digital={[{ format: "ebook", total: 3, available: 0, holds: 7 }]}
    />
  );
}
