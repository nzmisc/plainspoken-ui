// The Library demo's data, for the stories: the real catalogue with its invented copies, branches
// and account.
import {
  BASE,
  BOOKS,
  BRANCHES,
  CLOSURES,
  FINES,
  HISTORY,
  HOLDS,
  LOANS,
  NEW_ARRIVALS,
  STAFF_PICKS,
  TODAY,
  availabilityOf,
  branchName,
  callNumber,
  copiesOf,
  getBook,
} from "@/app/(demos)/demos/library/data";

export { BASE, BOOKS, BRANCHES, FINES, NEW_ARRIVALS, TODAY, availabilityOf, callNumber, copiesOf };

export const book = (id: string) => getBook(id)!;
export const result = (id: string) => ({ book: book(id), availability: availabilityOf(book(id)) });
export const PICKS = STAFF_PICKS.map((p) => ({ ...p, book: book(p.id) }));
export const LOAN_ROWS = LOANS.map((l) => ({ ...l, book: book(l.id), maxRenewals: l.format === "dvd" ? 2 : 3 }));
export const HOLD_ROWS = HOLDS.map((h) => ({ ...h, book: book(h.id) }));
export const HISTORY_ROWS = HISTORY.map((h) => ({ ...h, book: book(h.id) }));
export const CLOSURE_ROWS = CLOSURES.map((c) => ({ ...c, branch: c.branch ? branchName(c.branch) : null }));
