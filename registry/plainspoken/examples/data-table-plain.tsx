"use client";

import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";

interface Loan {
  id: string;
  title: string;
  author: string;
  due: string;
  renewals: number;
}

const LOANS: Loan[] = [
  { id: "b1", title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", due: "2026-11-02", renewals: 1 },
  { id: "b2", title: "A Pattern Language", author: "Christopher Alexander", due: "2026-10-28", renewals: 2 },
  { id: "b3", title: "Middlemarch", author: "George Eliot", due: "2026-11-09", renewals: 0 },
  { id: "b4", title: "The Design of Everyday Things", author: "Don Norman", due: "2026-10-26", renewals: 3 },
  { id: "b5", title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", due: "2026-11-16", renewals: 0 },
];

const COLUMNS: DataColumn<Loan>[] = [
  {
    key: "title",
    header: "Title",
    type: "text",
    value: (l) => l.title,
    render: (l) => (
      <a href={`#book-${l.id}`} className="text-link underline visited:text-link-visited">
        {l.title}
      </a>
    ),
  },
  { key: "author", header: "Author", type: "text", value: (l) => l.author },
  { key: "due", header: "Due", type: "text", value: (l) => l.due, className: "whitespace-nowrap tabular-nums" },
  { key: "renewals", header: "Renewals", type: "number", value: (l) => l.renewals, format: (v) => `${v} of 3` },
];

/**
 * Everything switched off: a plain table whose headers sort. Cells can render anything, here a
 * link to the book. Paging is off too (pageSizes={[0]}).
 */
export default function DataTablePlain() {
  return (
    <DataTable
      label="Your loans"
      columns={COLUMNS}
      rows={LOANS}
      rowKey={(l) => l.id}
      initialSort={[{ key: "due", dir: "asc" }]}
      quickFilter={false}
      columnFilters={false}
      columnPicker={false}
      densityToggle={false}
      exportable={false}
      sortBar={false}
      pageSizes={[0]}
      maxHeight="none"
    />
  );
}
