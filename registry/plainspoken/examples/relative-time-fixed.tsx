import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";

const NOW = "2026-10-25T12:00:00Z";

/** With a fixed now the relative text renders straight away, on the server too, and stays put: for tests, and pages that know when they were made. */
export default function RelativeTimeFixed() {
  const rows = [
    ["2026-10-25T11:59:48Z", "Build started"],
    ["2026-10-25T11:48:00Z", "Pushed to main"],
    ["2026-10-25T08:40:00Z", "Issue opened"],
    ["2026-10-20T07:00:00Z", "Release 1.4"],
  ];
  return (
    <table className="text-[14px]">
      <tbody>
        {rows.map(([t, what]) => (
          <tr key={t}>
            <td className="pr-4">{what}</td>
            <td className="pr-4 text-right">
              <RelativeTime date={t} now={NOW} />
            </td>
            <td className="text-muted-foreground">
              <RelativeTime date={t} now={NOW} format="long" locale="en" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
