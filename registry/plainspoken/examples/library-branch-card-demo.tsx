import { LibraryBranchCard } from "@/registry/plainspoken/blocks/library/branch-card";

/** A branch on a Saturday: today's row is marked, the phone number is a tel: link, services are labels. */
export default function LibraryBranchCardDemo() {
  return (
    <LibraryBranchCard
      className="max-w-md"
      today="2026-10-24"
      branch={{
        id: "riverside-demo",
        name: "Riverside Branch",
        address: "41 Mill Road, Lakemont",
        phone: "(555) 014-2310",
        hours: [null, ["10:00", "19:00"], ["10:00", "18:00"], ["10:00", "19:00"], ["10:00", "18:00"], ["10:00", "17:00"], ["10:00", "14:00"]],
        services: ["Children's garden", "Book drop open 24 hours"],
      }}
    />
  );
}
