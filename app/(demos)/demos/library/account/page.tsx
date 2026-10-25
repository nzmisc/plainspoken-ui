import type { Metadata } from "next";
import { daysBetween } from "@/registry/plainspoken/lib/dates";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { LibraryFines } from "@/registry/plainspoken/blocks/library/fines";
import { LibraryHolds } from "@/registry/plainspoken/blocks/library/holds";
import { LibraryLoans } from "@/registry/plainspoken/blocks/library/loans";
import { LibraryReadingHistory } from "@/registry/plainspoken/blocks/library/reading-history";
import { shortDate } from "@/registry/plainspoken/blocks/library/lib";
import { BASE, BRANCHES, FINES, HISTORY, HOLDS, LOANS, PATRON, TODAY, branchName, getBook } from "../data";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";

export const metadata: Metadata = {
  title: "My account",
  description: "Your loans and due dates, holds and your place in line, reading history and fines at the Lakemont Public Library.",
  alternates: { canonical: `${BASE}/account` },
  robots: { index: false },
};

const book = (id: string) => {
  const b = getBook(id);
  if (!b) throw new Error(`No book ${id}`);
  return b;
};

export default function AccountPage() {
  const loans = LOANS.map((l) => ({ ...l, book: book(l.id), maxRenewals: l.format === "dvd" ? 2 : 3 }));
  const holds = HOLDS.map((h) => ({ ...h, book: book(h.id) }));
  const history = HISTORY.map((h) => ({ ...h, book: book(h.id) }));
  const overdue = loans.filter((l) => l.due < TODAY);
  const ready = holds.filter((h) => h.status === "ready");
  const owed = FINES.filter((f) => !f.paid).reduce((n, f) => n + f.amount, 0);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <Avatar name={PATRON.name} size={40} />
        <div>
          <h1 className="text-[24px] leading-tight font-bold">{PATRON.name}</h1>
          <p className="text-[13px] text-muted-foreground">
            Card <span className="font-mono tabular-nums">{PATRON.card}</span> · Home branch: {branchName(PATRON.homeBranch)}
          </p>
        </div>
      </header>
      <StatGroup columns={4}>
        <Stat label="Checked out" value={loans.length} hint={`${overdue.length} overdue`} />
        <Stat label="Holds" value={holds.length} hint={`${ready.length} ready to collect`} />
        <Stat label="Read this year" value={history.filter((h) => h.borrowed >= "2026-01-01").length} hint="since 1 January" />
        <Stat label="Owed" value={`$${owed.toFixed(2)}`} hint="limit $10.00" />
      </StatGroup>
      {overdue.map((l) => (
        <Alert key={l.id} variant="destructive" announce={false} title={`${l.book.title} is overdue`}>
          It was due on {shortDate(l.due)}, {daysBetween(l.due, TODAY)} days ago, and someone is waiting for it. Please bring it back to any branch; the
          book drop at Riverside is open all night.
        </Alert>
      ))}
      {ready.map((h) => (
        <Alert key={h.id} variant="success" title={`${h.book.title} is ready to collect`}>
          On the hold shelf at {branchName(h.pickup)} until {shortDate(h.until!)}.
        </Alert>
      ))}
      <Tabs
        label="Account"
        tabs={[
          {
            id: "loans",
            label: "Loans",
            count: loans.length,
            content: <LibraryLoans loans={loans} today={TODAY} basePath={BASE} linkAs={Link} />,
          },
          { id: "holds", label: "Holds", count: holds.length, content: <LibraryHolds holds={holds} branches={BRANCHES} basePath={BASE} linkAs={Link} /> },
          { id: "history", label: "Reading history", content: <LibraryReadingHistory rows={history} basePath={BASE} linkAs={Link} /> },
          { id: "fines", label: "Fines", count: FINES.filter((f) => !f.paid).length, content: <LibraryFines fines={FINES} /> },
        ]}
      />
    </div>
  );
}
