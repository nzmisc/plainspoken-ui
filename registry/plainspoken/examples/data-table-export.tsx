"use client";

import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";

interface Booking {
  ref: string;
  guest: string;
  arrives: number;
  nights: number;
  total: number;
  note: string;
}

const d = (m: number, day: number) => new Date(2026, m - 1, day).getTime();

const BOOKINGS: Booking[] = [
  { ref: "HB-2207", guest: "Inês Carvalho", arrives: d(11, 3), nights: 3, total: 486, note: 'Late arrival, "after 22:00"' },
  { ref: "HB-2208", guest: "Jonas Weber", arrives: d(11, 4), nights: 1, total: 139, note: "" },
  { ref: "HB-2209", guest: "Amara Nwosu", arrives: d(11, 6), nights: 5, total: 820.5, note: "Cot in the room\nVegetarian breakfast" },
  { ref: "HB-2210", guest: "Kenji Watanabe", arrives: d(11, 6), nights: 2, total: 298, note: "Parking, one car" },
  { ref: "HB-2211", guest: "Léa Dubois", arrives: d(11, 9), nights: 4, total: 612, note: "Anniversary: flowers, 1 bottle\tof cava" },
];

const eur = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });
const day = (t: number) => {
  const x = new Date(t);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const COLUMNS: DataColumn<Booking>[] = [
  { key: "ref", header: "Booking", type: "text", value: (b) => b.ref, className: "font-mono text-[13px]" },
  { key: "guest", header: "Guest", type: "text", value: (b) => b.guest, className: "whitespace-nowrap" },
  { key: "arrives", header: "Arrives", type: "date", value: (b) => b.arrives, format: (v) => day(v as number), className: "tabular-nums" },
  { key: "nights", header: "Nights", type: "number", value: (b) => b.nights, summary: "sum" },
  { key: "total", header: "Total", type: "number", value: (b) => b.total, format: (v) => eur.format(v as number), xlsxFormat: '"€"#,##0.00', summary: "sum" },
  { key: "note", header: "Note", type: "text", value: (b) => b.note, className: "whitespace-pre-line" },
];

/**
 * Export copies or downloads what the table shows: the visible columns in their order, filtered
 * and sorted, or only the ticked rows when some are. Copy puts tab-separated text and an HTML
 * table on the clipboard, so the two-line note and the one with a tab paste into Excel or Google
 * Sheets as single cells. The .xlsx has real numbers (Total with a euro format, from xlsxFormat)
 * and dates, a bold header row that stays put, filter buttons, and the table's column widths.
 */
export default function DataTableExport() {
  return (
    <DataTable
      label="Bookings"
      columns={COLUMNS}
      rows={BOOKINGS}
      rowKey={(b) => b.ref}
      selectable
      columnFilters={false}
      densityToggle={false}
      sortBar={false}
      pageSizes={[0]}
      maxHeight="none"
    />
  );
}
