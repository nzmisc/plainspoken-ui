import type { Metadata } from "next";
import { Agenda } from "@/registry/plainspoken/ui/agenda";
import { LibraryBranchCard } from "@/registry/plainspoken/blocks/library/branch-card";
import { LibraryClosures } from "@/registry/plainspoken/blocks/library/closures";
import { BASE, BRANCHES, CLOSURES, EVENTS, TODAY, branchName, closureOn } from "../data";

export const metadata: Metadata = {
  title: "Branches and opening hours",
  description: "Addresses, phone numbers and opening hours of the four Lakemont Public Library branches, the days they are closed, and upcoming events.",
  alternates: { canonical: `${BASE}/branches` },
};

export default function BranchesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[24px] leading-tight font-bold">Branches and opening hours</h1>
        <p className="text-muted-foreground">Return items to any branch. Holds go to the branch you choose.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {BRANCHES.map((b) => (
          <LibraryBranchCard key={b.id} branch={b} today={TODAY} closedToday={closureOn(b.id, TODAY)?.reason} />
        ))}
      </div>
      <section aria-labelledby="closures" className="flex flex-col gap-2">
        <h2 id="closures" className="border-b border-border pb-1 text-[18px] font-bold">
          Closures
        </h2>
        <LibraryClosures
          closures={CLOSURES.map((c) => ({ ...c, branch: c.branch ? branchName(c.branch) : null }))}
          today={TODAY}
          month="2026-11-01"
          until="2027-01-31"
        />
      </section>
      <section aria-labelledby="events" className="flex flex-col gap-2">
        <h2 id="events" className="border-b border-border pb-1 text-[18px] font-bold">
          Events
        </h2>
        <Agenda events={EVENTS} from={TODAY} to="2026-11-30" today={TODAY} locale="en-US" label="Events at every branch" />
      </section>
    </div>
  );
}
