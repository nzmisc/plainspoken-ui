import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChartDataTableMode = "hidden" | "details" | "none";

export interface ChartDataTableProps {
  /** What the table holds, read out as its caption: "Sign-ups per day" */
  caption: string;
  /** Header of the first column (the time or category), then one per series */
  columns: string[];
  /** One row per time or category: the first cell is the row's header, the rest its values */
  rows: { key: string; cells: ReactNode[] }[];
  /**
   * hidden: only for screen readers (the default for charts). details: under a "Data" disclosure
   * everyone can open. none: nothing, for when the page shows the numbers some other way.
   */
  mode?: ChartDataTableMode;
  className?: string;
}

/**
 * The numbers behind a chart as a plain table, so nothing in a chart is only available as a
 * picture: screen readers get it (hidden), and anyone can open it (details). The charts render it
 * for you; use it directly for a chart of your own.
 */
export function ChartDataTable({ caption, columns, rows, mode = "hidden", className }: ChartDataTableProps) {
  if (mode === "none") return null;
  const table = (
    <table className={cn("text-[13px] tabular-nums", mode === "details" && "mt-1 border-collapse")}>
      <caption className={mode === "details" ? "sr-only" : undefined}>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th
              key={i}
              scope="col"
              className={cn(mode === "details" && "border border-border bg-muted px-2 py-0.5 text-left font-medium whitespace-nowrap")}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            {r.cells.map((cell, i) =>
              i === 0 ? (
                <th key={i} scope="row" className={cn(mode === "details" && "border border-border px-2 py-0.5 text-left font-normal whitespace-nowrap")}>
                  {cell}
                </th>
              ) : (
                <td key={i} className={cn(mode === "details" && "border border-border px-2 py-0.5 text-right")}>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
  if (mode === "hidden")
    return (
      <div data-slot="chart-data-table" className={cn("sr-only", className)}>
        {table}
      </div>
    );
  return (
    <details data-slot="chart-data-table" className={cn("text-[13px]", className)}>
      <summary className="w-fit cursor-pointer text-muted-foreground select-none hover:text-foreground">Data</summary>
      <div className="max-h-72 max-w-full overflow-auto">{table}</div>
    </details>
  );
}
