// The logic behind DataTable (ui/data-table.tsx), as plain functions: column definitions, filtering,
// multi-column sorting and CSV/TSV export. No React here, so it can sort or filter rows on a server
// too, or behind a table of your own.
import type { ReactNode } from "react";

/** How a column's values compare, filter and align. Dates are epoch milliseconds. */
export type ColumnType = "text" | "number" | "date" | "enum";

export type CellValue = string | number | null;

export interface DataColumn<T> {
  key: string;
  header: string;
  type: ColumnType;
  /** The raw value used for sorting, filtering and export */
  value: (row: T) => CellValue;
  /** Text for display, quick filter and export. Defaults to String(value). */
  format?: (v: CellValue, row: T) => string;
  /** Custom cell content (a link, a badge); falls back to format */
  render?: (row: T) => ReactNode;
  /** Set false to drop the filter control for this column */
  filterable?: boolean;
  /** Set false to stop the header sorting by this column */
  sortable?: boolean;
  /** Enum choices in display order; derived from the data when omitted */
  options?: string[];
  /** Hidden until turned on in the column picker */
  defaultHidden?: boolean;
  /** Extra classes for this column's cells, e.g. whitespace-nowrap */
  className?: string;
}

export type SortDir = "asc" | "desc";
export interface SortKey {
  key: string;
  dir: SortDir;
}

export type ColumnFilter =
  | { kind: "text"; q: string; regex: boolean }
  | { kind: "enum"; values: string[] }
  | { kind: "number"; min: string; max: string }
  | { kind: "date"; from: string; to: string };

export type Filters = Record<string, ColumnFilter | undefined>;

/** The filter a column starts with: nothing typed, nothing ticked. */
export function emptyFilter(type: ColumnType): ColumnFilter {
  switch (type) {
    case "enum":
      return { kind: "enum", values: [] };
    case "number":
      return { kind: "number", min: "", max: "" };
    case "date":
      return { kind: "date", from: "", to: "" };
    default:
      return { kind: "text", q: "", regex: false };
  }
}

/** True when a filter would leave rows out */
export function isFilterActive(f: ColumnFilter | undefined): boolean {
  if (!f) return false;
  switch (f.kind) {
    case "text":
      return f.q !== "";
    case "enum":
      return f.values.length > 0;
    case "number":
      return f.min !== "" || f.max !== "";
    case "date":
      return f.from !== "" || f.to !== "";
  }
}

/** A cell as text: the column's format, else the raw value, else "" */
export function formatCell<T>(c: DataColumn<T>, row: T): string {
  const v = c.value(row);
  if (c.format) return c.format(v, row);
  return v == null ? "" : String(v);
}

/** The error message for a text filter whose regular expression doesn't compile, else null. */
export function regexError(f: ColumnFilter | undefined): string | null {
  if (!f || f.kind !== "text" || !f.regex || !f.q) return null;
  try {
    new RegExp(f.q);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

/** A date input's value (yyyy-mm-dd) as epoch ms at local midnight; an end bound gets the end of that day. */
function dayBound(s: string, end: boolean): number | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(y, m - 1, d).getTime();
  return end ? t + 86_400_000 - 1 : t;
}

function columnMatcher<T>(c: DataColumn<T>, f: ColumnFilter): ((row: T) => boolean) | null {
  switch (f.kind) {
    case "text": {
      if (!f.q) return null;
      if (f.regex) {
        let re: RegExp;
        try {
          re = new RegExp(f.q, "i");
        } catch {
          return null; // shown as an error on the input; doesn't filter
        }
        return (r) => re.test(formatCell(c, r));
      }
      const q = f.q.toLowerCase();
      return (r) => formatCell(c, r).toLowerCase().includes(q);
    }
    case "enum": {
      if (!f.values.length) return null;
      const set = new Set(f.values);
      return (r) => set.has(String(c.value(r) ?? ""));
    }
    case "number": {
      const min = f.min === "" ? null : Number(f.min);
      const max = f.max === "" ? null : Number(f.max);
      if ((min == null || Number.isNaN(min)) && (max == null || Number.isNaN(max))) return null;
      return (r) => {
        const v = c.value(r);
        if (typeof v !== "number") return false;
        if (min != null && !Number.isNaN(min) && v < min) return false;
        if (max != null && !Number.isNaN(max) && v > max) return false;
        return true;
      };
    }
    case "date": {
      const from = dayBound(f.from, false);
      const to = dayBound(f.to, true);
      if (from == null && to == null) return null;
      return (r) => {
        const v = c.value(r);
        if (typeof v !== "number") return false;
        return (from == null || v >= from) && (to == null || v <= to);
      };
    }
  }
}

/** Rows matching every column filter and the quick filter (case-insensitive, any column in `visible`). */
export function applyFilters<T>(rows: T[], columns: DataColumn<T>[], filters: Filters, quick: string, visible: Set<string>): T[] {
  const tests: ((r: T) => boolean)[] = [];
  for (const c of columns) {
    const f = filters[c.key];
    const m = f && columnMatcher(c, f);
    if (m) tests.push(m);
  }
  const q = quick.trim().toLowerCase();
  if (q) {
    const cols = columns.filter((c) => visible.has(c.key));
    tests.push((r) => cols.some((c) => formatCell(c, r).toLowerCase().includes(q)));
  }
  return tests.length ? rows.filter((r) => tests.every((t) => t(r))) : rows;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/**
 * Multi-key sort. Numbers and dates compare numerically, text and enums with a natural, locale-aware
 * collator ("node2" before "node10"). Empty values sort last in both directions. Stable: ties keep
 * the original order.
 */
export function applySort<T>(rows: T[], columns: DataColumn<T>[], sort: SortKey[]): T[] {
  const keys = sort
    .map((s) => ({ col: columns.find((c) => c.key === s.key), sign: s.dir === "asc" ? 1 : -1 }))
    .filter((k): k is { col: DataColumn<T>; sign: 1 | -1 } => !!k.col);
  if (!keys.length) return rows;
  const decorated = rows.map((row, i) => ({ row, i, vals: keys.map((k) => k.col.value(row)) }));
  decorated.sort((a, b) => {
    for (let k = 0; k < keys.length; k++) {
      const x = a.vals[k];
      const y = b.vals[k];
      const xn = x == null || x === "";
      const yn = y == null || y === "";
      if (xn || yn) {
        if (xn && yn) continue;
        return xn ? 1 : -1;
      }
      const d = typeof x === "number" && typeof y === "number" ? x - y : collator.compare(String(x), String(y));
      if (d !== 0) return d * keys[k].sign;
    }
    return a.i - b.i;
  });
  return decorated.map((d) => d.row);
}

/**
 * A header click. A plain click sorts by this column alone (asc → desc → off). With `add` (shift-click,
 * or the sort bar) the column is appended as the next key, or its direction cycles if already there.
 */
export function nextSort(sort: SortKey[], key: string, add: boolean): SortKey[] {
  const i = sort.findIndex((s) => s.key === key);
  if (!add) {
    if (sort.length === 1 && i === 0) return sort[0].dir === "asc" ? [{ key, dir: "desc" }] : [];
    return [{ key, dir: "asc" }];
  }
  if (i < 0) return [...sort, { key, dir: "asc" }];
  if (sort[i].dir === "asc") return sort.map((s, j) => (j === i ? { key, dir: "desc" } : s));
  return sort.filter((_, j) => j !== i);
}

/** A filter in words, for the "Filtered by" line: `contains "node"`, `is running or idle`, `≥ 100`. */
export function describeFilter(f: ColumnFilter): string {
  switch (f.kind) {
    case "text":
      return f.regex ? `matches /${f.q}/i` : `contains "${f.q}"`;
    case "enum":
      return `is ${f.values.join(" or ")}`;
    case "number":
      return f.min && f.max ? `${f.min}–${f.max}` : f.min ? `≥ ${f.min}` : `≤ ${f.max}`;
    case "date":
      return f.from && f.to ? `${f.from} to ${f.to}` : f.from ? `from ${f.from}` : `until ${f.to}`;
  }
}

function escapeCsv(s: string) {
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows as CSV (RFC 4180 quoting) or TSV (tabs and newlines in values become spaces), with a header line. */
export function toDelimited<T>(rows: T[], columns: DataColumn<T>[], sep: "," | "\t"): string {
  const cell = sep === "," ? escapeCsv : (s: string) => s.replace(/[\t\r\n]+/g, " ");
  const lines = [columns.map((c) => cell(c.header)).join(sep)];
  for (const r of rows) lines.push(columns.map((c) => cell(formatCell(c, r))).join(sep));
  return lines.join(sep === "," ? "\r\n" : "\n");
}
