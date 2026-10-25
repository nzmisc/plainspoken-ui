"use client";

import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { daysBetween, type ISODate } from "@/registry/plainspoken/lib/dates";
import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { FORMAT_LABELS, shortDate, type Format, type LibraryBook } from "@/registry/plainspoken/blocks/library/lib";

export interface LibraryHistoryRow {
  book: Pick<LibraryBook, "id" | "title" | "author">;
  format: Format;
  borrowed: ISODate;
  returned: ISODate;
}

export interface LibraryReadingHistoryProps {
  rows: LibraryHistoryRow[];
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

/** ISO date to epoch ms at local midnight, how DataTable compares and filters dates */
const ms = (d: ISODate) => new Date(`${d}T00:00:00`).getTime();

/**
 * Everything a patron has borrowed, in a DataTable: filter by any column (format by ticking
 * values, dates by range, days kept by number), sort by several, hide columns, and export the
 * list as CSV. Newest first to start with.
 */
export function LibraryReadingHistory({ rows, basePath = "/library", linkAs, className }: LibraryReadingHistoryProps) {
  const L = linkAs ?? "a";
  const columns: DataColumn<LibraryHistoryRow>[] = [
    {
      key: "title",
      header: "Title",
      type: "text",
      value: (r) => r.book.title,
      render: (r) => (
        <L href={`${basePath}/book/${r.book.id}`} className={linkVariants()}>
          {r.book.title}
        </L>
      ),
    },
    { key: "author", header: "Author", type: "text", value: (r) => r.book.author },
    { key: "format", header: "Format", type: "enum", value: (r) => FORMAT_LABELS[r.format], options: Object.values(FORMAT_LABELS) },
    { key: "borrowed", header: "Borrowed", type: "date", value: (r) => ms(r.borrowed), format: (_, r) => shortDate(r.borrowed, true), className: "whitespace-nowrap" },
    { key: "returned", header: "Returned", type: "date", value: (r) => ms(r.returned), format: (_, r) => shortDate(r.returned, true), className: "whitespace-nowrap" },
    { key: "days", header: "Days", type: "number", value: (r) => daysBetween(r.borrowed, r.returned) },
  ];
  return (
    <div data-slot="library-reading-history" className={className}>
      <DataTable
        label="Reading history"
        columns={columns}
        rows={rows}
        rowKey={(r) => `${r.book.id}/${r.format}/${r.borrowed}`}
        initialSort={[{ key: "borrowed", dir: "desc" }]}
        initialShowFilters={false}
        pageSizes={[10, 25, 0]}
        maxHeight="none"
      />
    </div>
  );
}
