"use client";

import { useStoredState } from "@/registry/plainspoken/hooks/use-stored-state";
import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";

interface Release {
  version: string;
  name: string;
  notes: string;
  downloads: number;
}

const RELEASES: Release[] = [
  { version: "4.2.0", name: "Wren", notes: "Column resizing, Excel export and filters that work like a spreadsheet's", downloads: 18240 },
  { version: "4.1.3", name: "Wren", notes: "Fixes the date picker skipping a day when the clocks change", downloads: 9312 },
  { version: "4.1.0", name: "Wren", notes: "Drawers on phones come up from the bottom", downloads: 14877 },
  { version: "4.0.0", name: "Kestrel", notes: "One height scale for every control; the old size props are gone", downloads: 30551 },
  { version: "3.9.2", name: "Heron", notes: "Security: escape file names in upload errors", downloads: 8120 },
];

const COLUMNS: DataColumn<Release>[] = [
  { key: "version", header: "Version", type: "text", value: (r) => r.version, className: "font-mono text-[13px]", width: 96, minWidth: 80, maxWidth: 140 },
  { key: "name", header: "Name", type: "text", value: (r) => r.name, width: 104 },
  { key: "notes", header: "Notes", type: "text", value: (r) => r.notes, width: 280, minWidth: 160 },
  { key: "downloads", header: "Downloads", type: "number", value: (r) => r.downloads, format: (v) => (v as number).toLocaleString("en-US"), width: 120 },
];

/**
 * Drag the line at a header's right edge to resize the column (touch works too), or double-click
 * it to fit the content. Without a mouse: Tab to the edge, then ← → (Shift for bigger steps), Home
 * and End for the column's minimum and maximum, Enter to fit. Text that doesn't fit ends in "…".
 * The widths are kept in this browser through onWidthsChange; "Reset widths" in the Columns menu
 * goes back to the columns' own.
 */
export default function DataTableResizing() {
  const [widths, setWidths] = useStoredState<Record<string, number>>("data-table-resizing-widths", {});
  return (
    <DataTable
      label="Releases"
      columns={COLUMNS}
      rows={RELEASES}
      rowKey={(r) => r.version}
      initialWidths={widths}
      onWidthsChange={setWidths}
      quickFilter={false}
      densityToggle={false}
      exportable={false}
      sortBar={false}
      pageSizes={[0]}
      maxHeight="none"
    />
  );
}
