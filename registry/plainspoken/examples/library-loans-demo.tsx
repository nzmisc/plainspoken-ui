import { LibraryLoans } from "@/registry/plainspoken/blocks/library/loans";

/** One loan overdue, one due today, one that can't be renewed because someone is waiting. Tick rows to renew several. */
export default function LibraryLoansDemo() {
  return (
    <LibraryLoans
      basePath="/demos/library"
      today="2026-10-24"
      loans={[
        { book: { id: "the-covenant-of-water", title: "The Covenant of Water", author: "Abraham Verghese", formats: ["book"] }, format: "book", due: "2026-10-21", renewals: 1, maxRenewals: 3, holdsWaiting: true },
        { book: { id: "salt-fat-acid-heat", title: "Salt, Fat, Acid, Heat", author: "Samin Nosrat", formats: ["book"] }, format: "book", due: "2026-10-24", renewals: 0, maxRenewals: 3 },
        { book: { id: "being-mortal", title: "Being Mortal", author: "Atul Gawande", formats: ["audiobook"] }, format: "audiobook", due: "2026-11-02", renewals: 0, maxRenewals: 3 },
        { book: { id: "spirited-away", title: "Spirited Away", author: "Hayao Miyazaki", formats: ["dvd"] }, format: "dvd", due: "2026-10-27", renewals: 2, maxRenewals: 2 },
      ]}
    />
  );
}
