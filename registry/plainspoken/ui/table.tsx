import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TableDensity = "compact" | "default" | "relaxed";

/**
 * Density sets the cell padding through a variable on the table, so a cell's own className
 * (`py-3`) still wins over it. Rows come out about 22 / 26 / 34px tall.
 */
const DENSITY: Record<TableDensity, string> = {
  compact: "text-[13px] leading-[1.35] [--cell-py:2px] [--cell-px:6px]",
  default: "text-[14px] leading-normal [--cell-py:2px] [--cell-px:8px]",
  relaxed: "text-[14px] leading-normal [--cell-py:6px] [--cell-px:10px]",
};

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
  /** grid (default): a border round every cell, like a plain HTML table. rows: only lines between rows, for lists. */
  rules?: "grid" | "rows";
  /**
   * Leave off the outer border, for a table that fills a box with its own border (a flush
   * Panel, a Card), so the edges don't double up
   */
  frameless?: boolean;
  /** Keep the header row in view while the table's box scrolls (give the wrapper a height with `wrapperClassName`) */
  stickyHeader?: boolean;
  /** Classes for the scrolling wrapper: a max height, a border */
  wrapperClassName?: string;
}

/**
 * A plain HTML table, styled: 1px borders, a gray header row, rows about 26px tall. It scrolls
 * sideways inside its own box when it is wider than the screen, so the page doesn't. Build it from
 * TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell and TableCaption, like
 * shadcn's, or hand columns and rows to SimpleTable. Numbers go in `<TableCell numeric>`:
 * right-aligned, tabular, with the header above left-aligned like every other.
 */
export function Table({
  density = "default",
  rules = "grid",
  frameless = false,
  stickyHeader = false,
  wrapperClassName,
  className,
  ...rest
}: TableProps) {
  return (
    <div data-slot="table-wrapper" className={cn("relative max-w-full overflow-x-auto", wrapperClassName)}>
      <table
        data-slot="table"
        data-rules={rules}
        className={cn(
          "w-full border-collapse",
          DENSITY[density],
          rules === "rows" && "[&_td]:border-x-0 [&_th]:border-x-0",
          // Only the outer edges: the first row of the head (or of the body when there is no head),
          // the last row of the foot (or of the body), and the first and last cell of every row
          frameless && [
            "[&_tr>:first-child]:border-l-0 [&_tr>:last-child]:border-r-0",
            "[&>thead>tr:first-child>*]:border-t-0 [&:not(:has(>thead))>tbody:first-of-type>tr:first-child>*]:border-t-0",
            "[&>tfoot>tr:last-child>*]:border-b-0 [&:not(:has(>tfoot))>tbody:last-of-type>tr:last-child>*]:border-b-0",
          ],
          // Collapsed borders don't travel with a sticky cell, so the header draws its bottom line as an inset edge
          stickyHeader && "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:shadow-[inset_0_-1px_0_var(--color-border)]",
          className,
        )}
        {...rest}
      />
    </div>
  );
}

export function TableHeader({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead data-slot="table-header" className={className} {...rest} />;
}

export function TableBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody data-slot="table-body" className={className} {...rest} />;
}

/** Totals and summaries under the body: bold-ish on a gray band, like the header. */
export function TableFooter({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot data-slot="table-footer" className={cn("bg-muted font-medium", className)} {...rest} />;
}

/** A row. Mark a chosen row with `data-state="selected"`: it gets the accent background. */
export function TableRow({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr data-slot="table-row" className={cn("data-[state=selected]:bg-accent", className)} {...rest} />;
}

/**
 * A header cell: bold on gray, left-aligned and top-aligned, always, even over a column of
 * numbers (so the column titles read as one line). scope="col" unless you say otherwise.
 */
export function TableHead({ className, scope = "col", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn("border border-border bg-muted px-(--cell-px) py-(--cell-py) text-left align-top font-semibold", className)}
      {...rest}
    />
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** A number: right-aligned, tabular figures (so digits line up), never wrapped */
  numeric?: boolean;
}

export function TableCell({ numeric = false, className, ...rest }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "border border-border px-(--cell-px) py-(--cell-py) align-top",
        numeric && "text-right whitespace-nowrap tabular-nums",
        className,
      )}
      {...rest}
    />
  );
}

/** What the table shows, under it in small print. It is the table's accessible name. */
export function TableCaption({ className, ...rest }: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption data-slot="table-caption" className={cn("mt-1.5 caption-bottom text-left text-[13px] text-muted-foreground", className)} {...rest} />;
}

// -------------------------------------------------------------------------------------------------
// SimpleTable: columns and rows in, a table out

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  /** The cell's content for one row */
  cell: (row: T, index: number) => ReactNode;
  /** Right-aligned tabular numbers in the cells; the header stays left-aligned like every other */
  numeric?: boolean;
  /** Classes for this column's cells and header: a width, `hidden sm:table-cell` */
  className?: string;
}

export interface SimpleTableProps<T> extends Omit<TableProps, "children"> {
  columns: TableColumn<T>[];
  rows: T[];
  /** A stable key per row: an id, a name */
  rowKey: (row: T, index: number) => string;
  /** What to say in place of the rows when there are none. Default "Nothing to show." */
  empty?: ReactNode;
  caption?: ReactNode;
}

/**
 * A table from column definitions and an array of rows, for the common case of a list of records
 * with no sorting or selection: each column says how to draw its cell. With no rows it says so in
 * a single cell across the table.
 */
export function SimpleTable<T>({ columns, rows, rowKey, empty = "Nothing to show.", caption, ...rest }: SimpleTableProps<T>) {
  return (
    <Table {...rest}>
      {caption != null && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead key={c.key} className={c.className}>
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-muted-foreground">
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, i) => (
            <TableRow key={rowKey(row, i)}>
              {columns.map((c) => (
                <TableCell key={c.key} numeric={c.numeric} className={c.className}>
                  {c.cell(row, i)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
