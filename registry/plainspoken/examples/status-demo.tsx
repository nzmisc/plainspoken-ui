import { Status } from "@/registry/plainspoken/ui/status";

/** Coloured words with a symbol: quieter than a badge, for lists and table cells. */
export default function StatusDemo() {
  return (
    <ul className="flex flex-col gap-1">
      <li>
        API: <Status variant="success">operational</Status>
      </li>
      <li>
        Search: <Status variant="warning">slow responses</Status>
      </li>
      <li>
        Email delivery: <Status variant="destructive">outage</Status>
      </li>
      <li>
        Webhooks: <Status variant="info">maintenance at 02:00</Status>
      </li>
      <li>
        Legacy export: <Status>retired</Status>
      </li>
    </ul>
  );
}
