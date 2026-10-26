import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { Agenda } from "@/registry/plainspoken/ui/agenda";
import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";
import { Pagination } from "@/registry/plainspoken/ui/pagination";
import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { LibraryBookDetails } from "@/registry/plainspoken/blocks/library/book-details";
import { LibraryBranchCard } from "@/registry/plainspoken/blocks/library/branch-card";
import { LibraryClosures } from "@/registry/plainspoken/blocks/library/closures";
import { LibraryCopiesTable } from "@/registry/plainspoken/blocks/library/copies-table";
import { LibraryFacets } from "@/registry/plainspoken/blocks/library/facets";
import { LibraryFines } from "@/registry/plainspoken/blocks/library/fines";
import { LibraryHeader } from "@/registry/plainspoken/blocks/library/header";
import { LibraryHoldDialog } from "@/registry/plainspoken/blocks/library/hold-dialog";
import { LibraryHolds } from "@/registry/plainspoken/blocks/library/holds";
import { LibraryHoursToday } from "@/registry/plainspoken/blocks/library/hours-today";
import { LibraryLoans } from "@/registry/plainspoken/blocks/library/loans";
import { LibraryReadingHistory } from "@/registry/plainspoken/blocks/library/reading-history";
import { LibraryResultList } from "@/registry/plainspoken/blocks/library/result-list";
import { LibraryResultsBar } from "@/registry/plainspoken/blocks/library/results-bar";
import { LibrarySearchForm } from "@/registry/plainspoken/blocks/library/search-form";
import { LibraryShelf } from "@/registry/plainspoken/blocks/library/shelf";
import { LibraryStaffPicks } from "@/registry/plainspoken/blocks/library/staff-picks";
import { EVENTS } from "@/app/(demos)/demos/library/data";
import {
  BASE,
  BOOKS,
  BRANCHES,
  CLOSURE_ROWS,
  FINES,
  HISTORY_ROWS,
  HOLD_ROWS,
  LOAN_ROWS,
  NEW_ARRIVALS,
  PICKS,
  TODAY,
  availabilityOf,
  book,
  callNumber,
  copiesOf,
  result,
} from "../blocks/library/fixtures";

function Frame({ path, children }: { path: string; children: ReactNode }) {
  return (
    <>
      <LibraryHeader basePath={BASE} name="Lakemont Public Library" patron="Ada Okafor" pathname={path} />
      <main className="mx-auto w-full max-w-6xl px-3 pt-4 pb-10 sm:px-6 sm:pt-6">{children}</main>
      <Toaster />
    </>
  );
}

const meta: Meta = {
  title: "Demos/Library",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

/** The catalogue's home: search, new arrivals, staff picks, today's hours and this week's events. */
export const Home: Story = {
  render: () => (
    <Frame path={BASE}>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3 border border-border bg-muted px-4 py-5 sm:px-6">
          <h1 className="text-[26px] leading-tight font-bold">Find something to read</h1>
          <LibrarySearchForm action={`${BASE}/search`} size="lg" className="max-w-2xl" />
        </section>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-8">
            <LibraryShelf title="New arrivals" books={NEW_ARRIVALS} basePath={BASE} />
            <LibraryStaffPicks picks={PICKS} basePath={BASE} />
            <Agenda events={EVENTS} from={TODAY} to="2026-10-31" today={TODAY} locale="en-US" label="Events this week" />
          </div>
          <LibraryHoursToday branches={BRANCHES} date={TODAY} closed={{ "oak-hill": "Floor refinishing" }} />
        </div>
      </div>
    </Frame>
  ),
};

/** Results for “the”: facets, the count and sort, results with availability per format, pages. */
export const Search: Story = {
  render: () => {
    const found = BOOKS.filter((b) => b.title.toLowerCase().includes("the"));
    return (
      <Frame path={`${BASE}/search`}>
        <div className="flex flex-col gap-4">
          <h1 className="text-[24px] leading-tight font-bold">Search the catalogue</h1>
          <LibrarySearchForm action={`${BASE}/search`} defaultValue="the" className="max-w-3xl" />
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-[15rem_minmax(0,1fr)]">
            <LibraryFacets
              branches={BRANCHES}
              years={{ min: 1813, max: 2025 }}
              groups={[
                { key: "format", label: "Format", options: [{ value: "Book", label: "Book", count: 52 }, { value: "E-book", label: "E-book", count: 44 }, { value: "Audiobook", label: "Audiobook", count: 31 }, { value: "DVD", label: "DVD", count: 9 }] },
                { key: "audience", label: "Audience", options: [{ value: "Adult", label: "Adult", count: 41 }, { value: "Teen", label: "Teen", count: 8 }, { value: "Children", label: "Children", count: 9 }] },
              ]}
            />
            <div className="flex min-w-0 flex-col gap-3">
              <LibraryResultsBar total={found.length} from={1} to={8} query="the" filters={["Format: Book"]} />
              <LibraryResultList results={found.slice(0, 8).map((b) => result(b.id))} basePath={BASE} branches={BRANCHES} today={TODAY} defaultBranch="riverside" />
              <Pagination page={1} pageCount={Math.ceil(found.length / 8)} href={(p) => `#page-${p}`} total={found.length} pageSize={8} />
            </div>
          </div>
        </div>
      </Frame>
    );
  },
};

/** A title: cover, facts, place a hold, where every copy is. */
export const Book: Story = {
  render: () => {
    const b = book("the-hobbit");
    const availability = availabilityOf(b);
    return (
      <Frame path={`${BASE}/book/${b.id}`}>
        <div className="flex flex-col gap-8">
          <Breadcrumb items={[{ label: "Catalogue", href: BASE }, { label: "Children", href: `${BASE}/search` }, { label: b.title }]} />
          <LibraryBookDetails
            book={b}
            availability={availability}
            callNumber={callNumber(b)}
            searchPath={`${BASE}/search`}
            actions={<LibraryHoldDialog book={b} availability={availability} branches={BRANCHES} today={TODAY} variant="primary" />}
          />
          <LibraryCopiesTable copies={copiesOf(b)} branches={BRANCHES} digital={availability} />
        </div>
      </Frame>
    );
  },
};

/** A patron's account: the numbers, then loans, holds, history and fines in tabs. */
export const Account: Story = {
  render: () => (
    <Frame path={`${BASE}/account`}>
      <div className="flex flex-col gap-5">
        <h1 className="text-[24px] leading-tight font-bold">Ada Okafor</h1>
        <StatGroup columns={4}>
          <Stat label="Checked out" value={LOAN_ROWS.length} hint="1 overdue" />
          <Stat label="Holds" value={HOLD_ROWS.length} hint="1 ready to collect" />
          <Stat label="Borrowed" value={HISTORY_ROWS.length} hint="since January 2025" />
          <Stat label="Owed" value="$3.75" hint="limit $10.00" />
        </StatGroup>
        <Tabs
          label="Account"
          tabs={[
            { id: "loans", label: "Loans", count: LOAN_ROWS.length, content: <LibraryLoans loans={LOAN_ROWS} today={TODAY} basePath={BASE} /> },
            { id: "holds", label: "Holds", count: HOLD_ROWS.length, content: <LibraryHolds holds={HOLD_ROWS} branches={BRANCHES} basePath={BASE} /> },
            { id: "history", label: "Reading history", content: <LibraryReadingHistory rows={HISTORY_ROWS} basePath={BASE} /> },
            { id: "fines", label: "Fines", count: 2, content: <LibraryFines fines={FINES} /> },
          ]}
        />
      </div>
    </Frame>
  ),
};

/** Branches: hours by day, and a calendar of closures. */
export const Branches: Story = {
  render: () => (
    <Frame path={`${BASE}/branches`}>
      <div className="flex flex-col gap-8">
        <h1 className="text-[24px] leading-tight font-bold">Branches and opening hours</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {BRANCHES.map((b) => (
            <LibraryBranchCard key={b.id} branch={b} today={TODAY} closedToday={b.id === "oak-hill" ? "Floor refinishing" : undefined} />
          ))}
        </div>
        <LibraryClosures closures={CLOSURE_ROWS} today={TODAY} month="2026-11-01" until="2027-01-31" />
      </div>
    </Frame>
  ),
};

/** Search on a phone: filters in a drawer, the button under each result. */
export const SearchOnAPhone: Story = { ...Search, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
