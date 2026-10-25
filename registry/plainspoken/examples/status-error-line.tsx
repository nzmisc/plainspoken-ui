import { ErrorLine } from "@/registry/plainspoken/ui/status";

/** ErrorLine: one red line for a failed fetch inside a panel or a cell, where an Alert would take over. */
export default function StatusErrorLine() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <ErrorLine>Couldn&apos;t load invoices: HTTP 503 from billing.example.com</ErrorLine>
      <ErrorLine label="Sync failed:">token expired at 09:14. Sign in again to resume.</ErrorLine>
    </div>
  );
}
