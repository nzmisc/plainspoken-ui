import type { Metadata } from "next";
import { Agenda } from "@/registry/plainspoken/ui/agenda";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";
import { Status } from "@/registry/plainspoken/ui/status";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { LibraryHoursToday } from "@/registry/plainspoken/blocks/library/hours-today";
import { LibrarySearchForm } from "@/registry/plainspoken/blocks/library/search-form";
import { LibraryShelf } from "@/registry/plainspoken/blocks/library/shelf";
import { LibraryStaffPicks } from "@/registry/plainspoken/blocks/library/staff-picks";
import { cn } from "@/lib/utils";
import { BASE, BOOKS, BRANCHES, CLOSURES, EVENTS, LIBRARY_NAME, NEW_ARRIVALS, PATRON, STAFF_PICKS, TODAY, closureOn, getBook } from "./data";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";

export const metadata: Metadata = {
  title: { absolute: `${LIBRARY_NAME}: catalogue` },
  description: "Search the Lakemont Public Library catalogue, see new arrivals and staff picks, today's opening hours at every branch, and upcoming events.",
  alternates: { canonical: BASE },
};

const SUBJECTS = ["Mystery", "Science fiction", "Historical fiction", "Biography & memoir", "History", "Cooking", "Graphic novels", "Picture books", "Poetry", "Travel"];

export default function LibraryHome() {
  const closed = Object.fromEntries(BRANCHES.flatMap((b) => (closureOn(b.id, TODAY) ? [[b.id, closureOn(b.id, TODAY)!.reason]] : [])));
  const notice = CLOSURES.find((c) => c.branch && TODAY >= c.date && TODAY <= (c.to ?? c.date));
  const picks = STAFF_PICKS.map((p) => ({ ...p, book: getBook(p.id)! }));
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="welcome" className="flex flex-col gap-3 border border-border bg-muted px-4 py-5 sm:px-6">
        <div>
          <h1 id="welcome" className="text-[26px] leading-tight font-bold">
            Find something to read
          </h1>
          <p className="text-muted-foreground">
            {BOOKS.length} titles in books, e-books, audiobooks and DVDs at {BRANCHES.length} branches. Free with a library card.
          </p>
        </div>
        <LibrarySearchForm action={`${BASE}/search`} size="lg" className="max-w-2xl" />
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
          <span className="text-muted-foreground">Browse:</span>
          {SUBJECTS.map((s) => (
            <Link key={s} href={`${BASE}/search?in=subject&q=${encodeURIComponent(s)}`} className={linkVariants()}>
              {s}
            </Link>
          ))}
        </p>
      </section>
      {notice && (
        <Alert variant="warning" title={`${BRANCHES.find((b) => b.id === notice.branch)?.name} is closed until 25 October`}>
          {notice.reason}. Holds waiting there can be picked up at the Central Library;{" "}
          <Link href={`${BASE}/branches`} className={linkVariants()}>
            see all branches
          </Link>
          .
        </Alert>
      )}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <LibraryShelf
            title="New arrivals"
            books={NEW_ARRIVALS}
            basePath={BASE}
            linkAs={Link}
            action={
              <Link href={`${BASE}/search?sort=added`} className={linkVariants()}>
                See all
              </Link>
            }
          />
          <section aria-labelledby="picks">
            <h2 id="picks" className="mb-2 border-b border-border pb-1 text-[16px] font-bold">
              Staff picks
            </h2>
            <LibraryStaffPicks picks={picks} basePath={BASE} linkAs={Link} />
          </section>
          <section aria-labelledby="events" className="flex flex-col gap-2">
            <div className="flex items-baseline gap-3 border-b border-border pb-1">
              <h2 id="events" className="text-[16px] font-bold">
                Events this week
              </h2>
              <Link href={`${BASE}/branches#events`} className={cn(linkVariants(), "ml-auto text-[13px]")}>
                All events
              </Link>
            </div>
            <Agenda events={EVENTS} from={TODAY} to="2026-10-31" today={TODAY} locale="en-US" label="Events this week" />
            <p className="text-[13px] text-muted-foreground">All events are free and open to everyone; no need to book.</p>
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <LibraryHoursToday branches={BRANCHES} date={TODAY} closed={closed} href={`${BASE}/branches`} linkAs={Link} />
          <Card>
            <CardHeader>
              <CardTitle as="h2">Your account</CardTitle>
              <CardDescription>Signed in as {PATRON.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1.5 text-[14px]">
                <li>
                  <Status variant="destructive">1 item overdue</Status>
                </li>
                <li>
                  <Status variant="success">1 hold ready to collect</Status>
                </li>
                <li>
                  <Status variant="warning">$3.75 in fines</Status>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={`${BASE}/account`} className={buttonVariants({ size: "sm" })}>
                Loans and holds
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
