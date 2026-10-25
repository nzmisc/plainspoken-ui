import { LibraryFines } from "@/registry/plainspoken/blocks/library/fines";

/** Two charges owed and two paid: what is owed against the limit, the charges, and the total. */
export default function LibraryFinesDemo() {
  return (
    <LibraryFines
      fines={[
        { id: "f1", date: "2026-10-22", description: "Overdue: 3 days at $0.25 a day", title: "The Covenant of Water", amount: 0.75, paid: false },
        { id: "f2", date: "2026-09-18", description: "Damaged dust jacket", title: "The Secret History", amount: 3, paid: false },
        { id: "f3", date: "2026-06-30", description: "Overdue: 6 days", title: "Middlemarch", amount: 1.5, paid: true },
        { id: "f4", date: "2026-03-02", description: "Replacement library card", amount: 2, paid: true },
      ]}
    />
  );
}
