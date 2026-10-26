// The logic behind DataTable (ui/data-table.tsx), as plain functions: column definitions, the
// filter model (value lists and conditions, like Excel's AutoFilter), multi-column sorting, and
// export to CSV, TSV, HTML and .xlsx. No React here, so it can sort or filter rows on a server too,
// or behind a table of your own.
import type { ReactNode } from "react";
import { writeXlsx, type XlsxCell } from "@/registry/plainspoken/lib/xlsx";

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
  /** Set false to drop the filter button for this column */
  filterable?: boolean;
  /** Set false to stop the header sorting by this column */
  sortable?: boolean;
  /** Enum choices in display order; derived from the data when omitted */
  options?: string[];
  /** Hidden until turned on in the column picker */
  defaultHidden?: boolean;
  /** Extra classes for this column's cells, e.g. whitespace-nowrap */
  className?: string;
  /** Starting width in px. Without one the column fits its content until a column is resized. */
  width?: number;
  /** Narrowest it can be dragged, in px. Default 48. */
  minWidth?: number;
  /** Widest it can be dragged, in px. Default 800. */
  maxWidth?: number;
  /**
   * The totals row under the table, over every row the filters leave: "sum" or "average" (shown
   * with the column's format), or your own from those rows.
   */
  summary?: "sum" | "average" | ((rows: T[]) => ReactNode);
  /** Excel number format for the .xlsx download: "#,##0.00", '"€"#,##0.00', "0.0%". Dates get one of their own. */
  xlsxFormat?: string;
}

export const MIN_COLUMN_WIDTH = 48;
export const MAX_COLUMN_WIDTH = 800;

/** A width within the column's limits, in whole pixels */
export function clampWidth<T>(c: DataColumn<T>, w: number): number {
  return Math.round(Math.min(c.maxWidth ?? MAX_COLUMN_WIDTH, Math.max(c.minWidth ?? MIN_COLUMN_WIDTH, w)));
}

export type SortDir = "asc" | "desc";
export interface SortKey {
  key: string;
  dir: SortDir;
}

// ---------------------------------------------------------------------------------------------
// The filter model

/** Text conditions, on the cell's text, ignoring case */
export type TextOp = "equals" | "notEquals" | "beginsWith" | "endsWith" | "contains" | "notContains" | "regex";
/** Comparisons, for numbers and dates (dates compare whole days) */
export type CompareOp = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "between";
/** Conditions that look at the whole column: the n largest or smallest, above or below the mean */
export type RankOp = "top" | "bottom" | "aboveAverage" | "belowAverage";
/** Date ranges relative to today. Weeks start on Monday. */
export type DatePeriod = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisQuarter" | "thisYear" | "yearToDate";
export type FilterOp = TextOp | CompareOp | RankOp | "period";

/** One condition. Plain data (strings and numbers), so a filter can be saved as JSON. */
export interface FilterCondition {
  op: FilterOp;
  /** What is compared with: text, a number, or a date as yyyy-mm-dd. For between, the lower end. */
  value?: string;
  /** between: the upper end */
  to?: string;
  /** top and bottom: how many (default 10) */
  count?: number;
  /** top and bottom: count is a percentage of the rows */
  percent?: boolean;
  /** op "period": which one */
  period?: DatePeriod;
}

/**
 * A column's filter. `values`: only rows whose value is one of these (the checklist, see
 * valueKey: "" stands for blank cells, dates are whole days as yyyy-mm-dd, numbers their shown text). `conditions`: one or two conditions joined by
 * and (the default) or or.
 *
 * The other four kinds are the table's earlier one-control filters, still understood: `text`
 * (contains, or a regular expression), `enum` (one of), `number` (min and max) and `date` (from
 * and to, whole days).
 */
export type ColumnFilter =
  | { kind: "values"; values: string[] }
  | { kind: "conditions"; conditions: FilterCondition[]; join?: "and" | "or" }
  | { kind: "text"; q: string; regex: boolean }
  | { kind: "enum"; values: string[] }
  | { kind: "number"; min: string; max: string }
  | { kind: "date"; from: string; to: string };

export type Filters = Record<string, ColumnFilter | undefined>;

/** A filter in one of the two current shapes, with nothing incomplete left in it */
export type NormalFilter = { kind: "values"; values: string[] } | { kind: "conditions"; conditions: FilterCondition[]; join: "and" | "or" };

/** The filter a column started with in the earlier model: nothing typed, nothing ticked. */
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

/** A condition with everything it needs filled in */
export function isConditionComplete(c: FilterCondition | null | undefined): c is FilterCondition {
  if (!c) return false;
  switch (c.op) {
    case "aboveAverage":
    case "belowAverage":
      return true;
    case "top":
    case "bottom":
      return (c.count ?? 10) > 0;
    case "period":
      return !!c.period;
    case "between":
      return !!c.value && !!c.to;
    default:
      return !!c.value;
  }
}

/** Any filter, older shapes included, as values or conditions; null when it would leave nothing out. */
export function normalizeFilter(f: ColumnFilter | undefined): NormalFilter | null {
  if (!f) return null;
  const conds = (conditions: FilterCondition[], join: "and" | "or" = "and"): NormalFilter | null => {
    const done = conditions.filter(isConditionComplete);
    return done.length ? { kind: "conditions", conditions: done, join } : null;
  };
  switch (f.kind) {
    case "values":
    case "enum":
      return f.values.length ? { kind: "values", values: f.values } : null;
    case "conditions":
      return conds(f.conditions.slice(0, 2), f.join);
    case "text":
      return conds([{ op: f.regex ? "regex" : "contains", value: f.q }]);
    case "number":
      return conds([
        { op: "gte", value: f.min },
        { op: "lte", value: f.max },
      ]);
    case "date":
      return conds([
        { op: "gte", value: f.from },
        { op: "lte", value: f.to },
      ]);
  }
}

/** True when a filter would leave rows out */
export function isFilterActive(f: ColumnFilter | undefined): boolean {
  return normalizeFilter(f) !== null;
}

/** A cell as text: the column's format, else the raw value, else "" */
export function formatCell<T>(c: DataColumn<T>, row: T): string {
  const v = c.value(row);
  if (c.format) return c.format(v, row);
  return v == null ? "" : String(v);
}

/** The error message for a regular expression in the filter that doesn't compile, else null. */
export function regexError(f: ColumnFilter | undefined): string | null {
  const n = normalizeFilter(f);
  if (n?.kind !== "conditions") return null;
  for (const c of n.conditions) {
    if (c.op !== "regex") continue;
    try {
      new RegExp(c.value!);
    } catch (e) {
      return (e as Error).message;
    }
  }
  return null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Epoch ms as the local day it falls on, yyyy-mm-dd */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** A yyyy-mm-dd day as epoch ms at local midnight; an end bound gets the last millisecond of that day. */
function dayBound(s: string | undefined, end: boolean): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  return end ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1).getTime() - 1 : t;
}

/** The days a period covers, as [first ms, last ms], around `now` in local time */
export function periodRange(p: DatePeriod, now: number): [number, number] {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const at = (yy: number, mm: number, dd: number) => new Date(yy, mm, dd).getTime();
  const monday = day - ((d.getDay() + 6) % 7);
  const q = m - (m % 3);
  switch (p) {
    case "today":
      return [at(y, m, day), at(y, m, day + 1) - 1];
    case "yesterday":
      return [at(y, m, day - 1), at(y, m, day) - 1];
    case "thisWeek":
      return [at(y, m, monday), at(y, m, monday + 7) - 1];
    case "lastWeek":
      return [at(y, m, monday - 7), at(y, m, monday) - 1];
    case "thisMonth":
      return [at(y, m, 1), at(y, m + 1, 1) - 1];
    case "lastMonth":
      return [at(y, m - 1, 1), at(y, m, 1) - 1];
    case "thisQuarter":
      return [at(y, q, 1), at(y, q + 3, 1) - 1];
    case "thisYear":
      return [at(y, 0, 1), at(y + 1, 0, 1) - 1];
    case "yearToDate":
      return [at(y, 0, 1), at(y, m, day + 1) - 1];
  }
}

/**
 * The key a row has in a column's value list ("" for blank): the day for dates (yyyy-mm-dd), the
 * shown text for numbers (as Excel does, so 3,145,728 and 3,200,000 are both "3 MiB"), and the raw
 * value for text and enums.
 */
export function valueKey<T>(c: DataColumn<T>, row: T): string {
  const v = c.value(row);
  if (v == null || v === "") return "";
  if (c.type === "date" && typeof v === "number") return dayKey(v);
  if (c.type === "number") return formatCell(c, row);
  return String(v);
}

export interface DistinctValue {
  key: string;
  /** As shown: the cell's text, or the day for dates; "" for blanks */
  label: string;
  count: number;
  /** For ordering numbers: the smallest raw value with this key */
  order?: number;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** A column's different values in `rows` with how often each occurs, in the column's order; blanks last. */
export function distinctValues<T>(c: DataColumn<T>, rows: T[]): DistinctValue[] {
  const map = new Map<string, DistinctValue>();
  for (const r of rows) {
    const key = valueKey(c, r);
    const raw = c.value(r);
    const hit = map.get(key);
    if (hit) {
      hit.count++;
      if (typeof raw === "number" && raw < (hit.order ?? Infinity)) hit.order = raw;
    } else map.set(key, { key, label: key === "" ? "" : c.type === "date" ? key : formatCell(c, r), count: 1, order: typeof raw === "number" ? raw : undefined });
  }
  const list = [...map.values()];
  const rank = c.options ? new Map(c.options.map((o, i) => [o, i])) : null;
  list.sort((a, b) => {
    if (a.key === "" || b.key === "") return a.key === "" ? (b.key === "" ? 0 : 1) : -1;
    if (c.type === "number") return (a.order ?? 0) - (b.order ?? 0) || collator.compare(a.label, b.label);
    if (c.type === "date") return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    const ra = rank?.get(a.key) ?? Infinity;
    const rb = rank?.get(b.key) ?? Infinity;
    return ra !== rb ? ra - rb : collator.compare(a.label, b.label);
  });
  return list;
}

function numbersOf<T>(c: DataColumn<T>, rows: T[]): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = c.value(r);
    if (typeof v === "number" && Number.isFinite(v)) out.push(v);
  }
  return out;
}

/** One condition as a row test, or null when it can't be read (a regular expression that doesn't compile) */
function conditionTest<T>(c: DataColumn<T>, cond: FilterCondition, rows: T[], now: number | undefined): ((r: T) => boolean) | null {
  const op = cond.op;
  const text = (r: T) => formatCell(c, r).toLowerCase();
  const q = (cond.value ?? "").toLowerCase();
  switch (op) {
    case "equals":
      return (r) => text(r) === q;
    case "notEquals":
      return (r) => text(r) !== q;
    case "beginsWith":
      return (r) => text(r).startsWith(q);
    case "endsWith":
      return (r) => text(r).endsWith(q);
    case "contains":
      return (r) => text(r).includes(q);
    case "notContains":
      return (r) => !text(r).includes(q);
    case "regex": {
      let re: RegExp;
      try {
        re = new RegExp(cond.value ?? "", "i");
      } catch {
        return null; // shown as an error in the filter; doesn't filter
      }
      return (r) => re.test(formatCell(c, r));
    }
    case "top":
    case "bottom": {
      const nums = numbersOf(c, rows).sort((a, b) => (op === "top" ? b - a : a - b));
      if (!nums.length) return () => false;
      const n = cond.percent ? Math.max(1, Math.floor((nums.length * (cond.count ?? 10)) / 100)) : (cond.count ?? 10);
      const edge = nums[Math.min(n, nums.length) - 1];
      return (r) => {
        const v = c.value(r);
        return typeof v === "number" && (op === "top" ? v >= edge : v <= edge);
      };
    }
    case "aboveAverage":
    case "belowAverage": {
      const nums = numbersOf(c, rows);
      const mean = nums.reduce((s, v) => s + v, 0) / (nums.length || 1);
      return (r) => {
        const v = c.value(r);
        return typeof v === "number" && (op === "aboveAverage" ? v > mean : v < mean);
      };
    }
    case "period": {
      const [from, to] = periodRange(cond.period!, now ?? Date.now());
      return (r) => {
        const v = c.value(r);
        return typeof v === "number" && v >= from && v <= to;
      };
    }
  }
  // Comparisons: whole days for dates, numbers otherwise. Blanks only pass "does not equal".
  let lo: number | null;
  let hi: number | null;
  if (c.type === "date") {
    lo = dayBound(cond.value, false);
    hi = dayBound(op === "between" ? cond.to : cond.value, true);
  } else {
    lo = cond.value === undefined || cond.value === "" ? null : Number(cond.value);
    hi = op === "between" ? (cond.to === undefined || cond.to === "" ? null : Number(cond.to)) : lo;
  }
  if (lo == null || hi == null || Number.isNaN(lo) || Number.isNaN(hi)) return null;
  if (op === "between" && lo > hi) {
    // Typed the wrong way round: for days, swap the days rather than the bounds
    if (c.type === "date") [lo, hi] = [dayBound(cond.to, false)!, dayBound(cond.value, true)!];
    else [lo, hi] = [hi, lo];
  }
  const a = lo;
  const b = hi;
  const test: Record<CompareOp, (v: number) => boolean> = {
    eq: (v) => v >= a && v <= b,
    ne: (v) => v < a || v > b,
    gt: (v) => v > b,
    gte: (v) => v >= a,
    lt: (v) => v < a,
    lte: (v) => v <= b,
    between: (v) => v >= a && v <= b,
  };
  const t = test[op];
  return (r) => {
    const v = c.value(r);
    if (typeof v !== "number") return op === "ne";
    return t(v);
  };
}

/** A column filter as a row test, or null when it leaves everything in */
export function filterTest<T>(c: DataColumn<T>, f: ColumnFilter | undefined, rows: T[], now?: number): ((r: T) => boolean) | null {
  const n = normalizeFilter(f);
  if (!n) return null;
  if (n.kind === "values") {
    const set = new Set(n.values);
    return (r) => set.has(valueKey(c, r));
  }
  const tests = n.conditions.map((cond) => conditionTest(c, cond, rows, now)).filter((t) => t != null);
  if (!tests.length) return null;
  if (tests.length === 1) return tests[0];
  return n.join === "or" ? (r) => tests.some((t) => t(r)) : (r) => tests.every((t) => t(r));
}

/**
 * Rows matching every column filter and the quick filter (case-insensitive, any column in
 * `visible`). Top, bottom and average conditions are worked out over all of `rows`, as Excel does,
 * not over what the other filters leave. Date periods count from `now` (default: the time of the
 * call, so pass one when filtering while rendering on a server).
 */
export function applyFilters<T>(rows: T[], columns: DataColumn<T>[], filters: Filters, quick: string, visible: Set<string>, now?: number): T[] {
  const tests: ((r: T) => boolean)[] = [];
  for (const c of columns) {
    const t = filterTest(c, filters[c.key], rows, now);
    if (t) tests.push(t);
  }
  const q = quick.trim().toLowerCase();
  if (q) {
    const cols = columns.filter((c) => visible.has(c.key));
    tests.push((r) => cols.some((c) => formatCell(c, r).toLowerCase().includes(q)));
  }
  return tests.length ? rows.filter((r) => tests.every((t) => t(r))) : rows;
}

// ---------------------------------------------------------------------------------------------
// Words for filters

/** The conditions a column's filter offers, with their names, in Excel's order */
export function conditionOps(type: ColumnType): { op: FilterOp; label: string }[] {
  if (type === "number")
    return [
      { op: "eq", label: "= equals" },
      { op: "ne", label: "≠ does not equal" },
      { op: "gt", label: "> greater than" },
      { op: "gte", label: "≥ greater than or equal to" },
      { op: "lt", label: "< less than" },
      { op: "lte", label: "≤ less than or equal to" },
      { op: "between", label: "between" },
      { op: "top", label: "top…" },
      { op: "bottom", label: "bottom…" },
      { op: "aboveAverage", label: "above average" },
      { op: "belowAverage", label: "below average" },
    ];
  if (type === "date")
    return [
      { op: "eq", label: "is on" },
      { op: "ne", label: "is not on" },
      { op: "lt", label: "is before" },
      { op: "lte", label: "is on or before" },
      { op: "gt", label: "is after" },
      { op: "gte", label: "is on or after" },
      { op: "between", label: "is between" },
      { op: "period", label: "is in a period…" },
    ];
  return [
    { op: "equals", label: "equals" },
    { op: "notEquals", label: "does not equal" },
    { op: "beginsWith", label: "begins with" },
    { op: "endsWith", label: "ends with" },
    { op: "contains", label: "contains" },
    { op: "notContains", label: "does not contain" },
    { op: "regex", label: "matches regular expression" },
  ];
}

export const DATE_PERIODS: { period: DatePeriod; label: string }[] = [
  { period: "today", label: "today" },
  { period: "yesterday", label: "yesterday" },
  { period: "thisWeek", label: "this week" },
  { period: "lastWeek", label: "last week" },
  { period: "thisMonth", label: "this month" },
  { period: "lastMonth", label: "last month" },
  { period: "thisQuarter", label: "this quarter" },
  { period: "thisYear", label: "this year" },
  { period: "yearToDate", label: "year to date" },
];

/** Numbers in filter descriptions: the same text on the server and in every browser */
const num = (s: string | undefined) => {
  const n = Number(s);
  return s !== undefined && s !== "" && Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 10 }) : (s ?? "");
};

function describeCondition(type: ColumnType, c: FilterCondition): string {
  const v = type === "number" ? num(c.value) : (c.value ?? "");
  const to = type === "number" ? num(c.to) : (c.to ?? "");
  const date = type === "date";
  switch (c.op) {
    case "equals":
      return `is "${v}"`;
    case "notEquals":
      return `is not "${v}"`;
    case "beginsWith":
      return `begins with "${v}"`;
    case "endsWith":
      return `ends with "${v}"`;
    case "contains":
      return `contains "${v}"`;
    case "notContains":
      return `does not contain "${v}"`;
    case "regex":
      return `matches /${v}/i`;
    case "eq":
      return date ? `on ${v}` : `= ${v}`;
    case "ne":
      return date ? `not on ${v}` : `≠ ${v}`;
    case "gt":
      return date ? `after ${v}` : `> ${v}`;
    case "gte":
      return date ? `from ${v}` : `≥ ${v}`;
    case "lt":
      return date ? `before ${v}` : `< ${v}`;
    case "lte":
      return date ? `until ${v}` : `≤ ${v}`;
    case "between":
      return date ? `${v} to ${to}` : `${v}–${to}`;
    case "top":
    case "bottom":
      return `${c.op} ${c.count ?? 10}${c.percent ? "%" : ""}`;
    case "aboveAverage":
      return "above average";
    case "belowAverage":
      return "below average";
    case "period":
      return DATE_PERIODS.find((p) => p.period === c.period)?.label ?? String(c.period);
  }
}

/**
 * A filter in words, for its chip: `Paid, Sent`, `contains "node"`, `> 1,000`, `this month`,
 * `≥ 10 and < 20`. Give the column to word numbers and dates its way, and `labelOf` to show value
 * keys as their cell text.
 */
export function describeFilter<T>(f: ColumnFilter, column?: DataColumn<T>, labelOf?: (key: string) => string): string {
  const n = normalizeFilter(f);
  if (!n) return "";
  if (n.kind === "values") {
    const words = n.values.map((k) => (k === "" ? "(Blanks)" : (labelOf?.(k) ?? k)));
    return words.length > 3 ? `${words.slice(0, 2).join(", ")} and ${words.length - 2} more` : words.join(", ");
  }
  const type = column?.type ?? "text";
  const [a, b] = n.conditions;
  // min and max: a range reads better than two conditions
  if (b && n.join === "and" && a.op === "gte" && b.op === "lte") return describeCondition(type, { op: "between", value: a.value, to: b.value });
  return n.conditions.map((c) => describeCondition(type, c)).join(` ${n.join} `);
}

/** "Status: Paid, Sent" for a value list, "Total > 1,000" for conditions */
export function filterLabel<T>(column: DataColumn<T>, f: ColumnFilter, labelOf?: (key: string) => string): string {
  const n = normalizeFilter(f);
  const words = describeFilter(f, column, labelOf);
  return n?.kind === "values" ? `${column.header}: ${words}` : `${column.header} ${words}`;
}

// ---------------------------------------------------------------------------------------------
// Sorting

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

/** Sort by a column in one direction: alone, or with `add` as another level (keeping its place if it is one already) */
export function setSortLevel(sort: SortKey[], key: string, dir: SortDir, add: boolean): SortKey[] {
  if (!add) return [{ key, dir }];
  return sort.some((s) => s.key === key) ? sort.map((s) => (s.key === key ? { key, dir } : s)) : [...sort, { key, dir }];
}

// ---------------------------------------------------------------------------------------------
// Export

function escapeCsv(s: string) {
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A TSV cell as Excel and Google Sheets write it to the clipboard: quoted when it holds a tab, line break or quote */
function escapeTsv(s: string) {
  return /[\t\n\r"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Rows as CSV (RFC 4180) or TSV, with a header line and CRLF line ends. TSV is quoted the way
 * spreadsheets quote their own clipboard text, so a cell with tabs or line breaks in it pastes into
 * Excel and Google Sheets as one cell.
 */
export function toDelimited<T>(rows: T[], columns: DataColumn<T>[], sep: "," | "\t"): string {
  const cell = sep === "," ? escapeCsv : escapeTsv;
  const lines = [columns.map((c) => cell(c.header)).join(sep)];
  for (const r of rows) lines.push(columns.map((c) => cell(formatCell(c, r))).join(sep));
  return lines.join("\r\n");
}

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Rows as an HTML table, the clipboard flavour spreadsheets prefer when pasting. Line breaks stay
 * inside their cell in Excel too (`mso-data-placement`), and text columns are marked as text so
 * Excel doesn't turn "0042" or "3-4" into a number or a date.
 */
export function toHtmlTable<T>(rows: T[], columns: DataColumn<T>[]): string {
  const br = '<br style="mso-data-placement:same-cell">';
  const cell = (s: string) => escHtml(s).replace(/\r\n|\r|\n/g, br);
  const asText = columns.map((c) => (c.type === "text" || c.type === "enum" ? ` style="mso-number-format:'\\@'"` : ""));
  let html = `<table><thead><tr>${columns.map((c) => `<th>${cell(c.header)}</th>`).join("")}</tr></thead><tbody>`;
  for (const r of rows) html += `<tr>${columns.map((c, i) => `<td${asText[i]}>${cell(formatCell(c, r))}</td>`).join("")}</tr>`;
  return `<meta charset="utf-8">${html}</tbody></table>`;
}

const DEFAULT_EXPORT_WIDTH: Record<ColumnType, number> = { text: 160, enum: 110, number: 90, date: 120 };

/**
 * Rows as an .xlsx file (lib/xlsx): numbers as numbers, dates as dates, everything else as its
 * cell text, a bold frozen header row with an autofilter, and the columns as wide as `widths`
 * (px, by column key; else each column's `width`, else a width for its type).
 */
export function toXlsx<T>(rows: T[], columns: DataColumn<T>[], opts: { sheetName: string; widths?: Record<string, number> }): Uint8Array {
  const cells = rows.map((r) =>
    columns.map((c): XlsxCell => {
      const v = c.value(r);
      if (c.type === "number") return typeof v === "number" ? v : v == null || v === "" ? null : formatCell(c, r);
      if (c.type === "date") return typeof v === "number" ? new Date(v) : null;
      return formatCell(c, r) || null;
    }),
  );
  return writeXlsx({
    name: opts.sheetName,
    columns: columns.map((c) => ({ header: c.header, width: opts.widths?.[c.key] ?? c.width ?? DEFAULT_EXPORT_WIDTH[c.type], format: c.xlsxFormat })),
    rows: cells,
  });
}
