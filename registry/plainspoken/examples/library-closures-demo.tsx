import { LibraryClosures } from "@/registry/plainspoken/blocks/library/closures";

/** November's closures in a month calendar; switch to List for the same as a table. */
export default function LibraryClosuresDemo() {
  return (
    <LibraryClosures
      today="2026-10-24"
      month="2026-11-01"
      until="2026-12-31"
      closures={[
        { date: "2026-11-11", branch: null, reason: "Veterans Day" },
        { date: "2026-11-20", branch: "Northgate Branch", reason: "Staff training" },
        { date: "2026-11-26", to: "2026-11-27", branch: null, reason: "Thanksgiving" },
        { date: "2026-12-24", to: "2026-12-25", branch: null, reason: "Christmas" },
      ]}
    />
  );
}
