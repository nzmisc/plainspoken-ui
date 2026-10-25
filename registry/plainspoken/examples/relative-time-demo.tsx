import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";

/**
 * The server sends a fixed UTC date; the browser swaps in "3h 20m ago" once the page is
 * interactive, and keeps it current. Hover a time for the full local date.
 */
export default function RelativeTimeDemo() {
  return (
    <ul className="flex flex-col gap-1">
      <li>
        Last deploy: <RelativeTime date="2026-10-24T16:40:00Z" />
      </li>
      <li>
        Account created: <RelativeTime date="2026-03-02T09:15:00Z" format="long" />
      </li>
      <li>
        Trial ends: <RelativeTime date="2027-01-01T00:00:00Z" format="long" />
      </li>
    </ul>
  );
}
