import { LibraryHoldDialog } from "@/registry/plainspoken/blocks/library/hold-dialog";

/** Choose a format, a pickup branch and a date after which you don't want it; placing the hold shows your place in line. */
export default function LibraryHoldDialogDemo() {
  return (
    <LibraryHoldDialog
      book={{ id: "the-hobbit", title: "The Hobbit", author: "J. R. R. Tolkien", formats: ["book", "ebook", "audiobook"] }}
      availability={[
        { format: "book", total: 4, available: 0, holds: 2 },
        { format: "ebook", total: 2, available: 1, holds: 0 },
        { format: "audiobook", total: 1, available: 0, holds: 6 },
      ]}
      branches={[
        { id: "central", name: "Central Library" },
        { id: "riverside", name: "Riverside Branch" },
        { id: "northgate", name: "Northgate Branch" },
      ]}
      defaultBranch="riverside"
      today="2026-10-24"
      variant="primary"
    />
  );
}
