"use client";

import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";

interface Invoice {
  number: string;
  client: string;
  issued: number;
  amount: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
}

// Local-time dates: printed with local getters, they read the same on the server and in the browser
const d = (m: number, day: number) => new Date(2026, m - 1, day).getTime();
const NOW = new Date(2026, 9, 24, 12).getTime();

const INVOICES: Invoice[] = [
  { number: "2026-041", client: "Lumen Opticians", issued: d(10, 21), amount: 4200, status: "Sent" },
  { number: "2026-040", client: "Harbour Bakery", issued: d(10, 14), amount: 640, status: "Paid" },
  { number: "2026-039", client: "Kestrel Outdoor", issued: d(10, 9), amount: 12800, status: "Sent" },
  { number: "2026-038", client: "Atelier Nord", issued: d(10, 2), amount: 1850, status: "Overdue" },
  { number: "2026-037", client: "Lumen Opticians", issued: d(9, 26), amount: 980, status: "Paid" },
  { number: "2026-036", client: "Smørrebrød & Co", issued: d(9, 18), amount: 2300, status: "Overdue" },
  { number: "2026-035", client: "Harbour Bakery", issued: d(9, 11), amount: 410, status: "Paid" },
  { number: "2026-034", client: "Fernhill Library", issued: d(9, 3), amount: 5600, status: "Paid" },
  { number: "2026-033", client: "Kestrel Outdoor", issued: d(8, 27), amount: 7400, status: "Paid" },
  { number: "2026-042", client: "Atelier Nord", issued: d(10, 23), amount: 1200, status: "Draft" },
];

const eur = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const day = (t: number) => {
  const x = new Date(t);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const COLUMNS: DataColumn<Invoice>[] = [
  { key: "number", header: "Invoice", type: "text", value: (i) => i.number, className: "font-mono text-[13px]" },
  { key: "client", header: "Client", type: "text", value: (i) => i.client, className: "whitespace-nowrap" },
  { key: "issued", header: "Issued", type: "date", value: (i) => i.issued, format: (v) => day(v as number), className: "tabular-nums" },
  { key: "amount", header: "Amount", type: "number", value: (i) => i.amount, format: (v) => eur.format(v as number), summary: "sum" },
  { key: "status", header: "Status", type: "enum", value: (i) => i.status, options: ["Draft", "Sent", "Paid", "Overdue"] },
];

/**
 * Started with two filters, shown as chips above the table: a list of values (Status is Sent or
 * Overdue) and a condition (Amount ≥ 1,000). Click a chip, or a funnel in a header, to change one:
 * tick values (with counts), or switch to "Number filters" for conditions such as "top 10" or
 * "between", two of them joined by and/or. Dates offer periods like "this month". The filter edits
 * a draft until OK, like Excel's; Alt+↓ on a header opens it from the keyboard.
 */
export default function DataTableFilters() {
  return (
    <DataTable
      label="Invoices"
      columns={COLUMNS}
      rows={INVOICES}
      rowKey={(i) => i.number}
      now={NOW}
      initialFilters={{
        status: { kind: "values", values: ["Sent", "Overdue"] },
        amount: { kind: "conditions", conditions: [{ op: "gte", value: "1000" }] },
      }}
      initialSort={[{ key: "issued", dir: "desc" }]}
      densityToggle={false}
      pageSizes={[0]}
      maxHeight="none"
    />
  );
}
