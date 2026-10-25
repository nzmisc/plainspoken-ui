// The logic behind EditableTable (ui/editable-table.tsx), as plain functions: column definitions,
// lenient parsing of what people type or paste ("1,200.50", "1.2k", "4 Mar 2027", "yes"),
// formatting, validation, TSV in and out, and the list of changes against a saved version. No
// React here, so a server can check rows with the same rules before it stores them.
import { daysInMonth, makeDate, parseISODate, type ISODate } from "@/registry/plainspoken/lib/dates";

/** What a cell holds. Dates are ISO strings ("2027-03-04"), yes/no columns booleans. */
export type CellValue = string | number | boolean | null;

/**
 * How a column parses, shows and edits its values:
 * - text: one line, edited in an input
 * - longtext: notes, edited in a larger box over the cell; Shift+Enter starts a new line
 * - number: right-aligned, parsed leniently ("1,200", "1.2k", "(300)")
 * - money: a number with a fixed number of decimals (2 unless you say), currency symbols ignored
 * - date: an ISO date, typed in any common form or picked from a calendar
 * - select: one of `options`
 * - checkbox: yes or no, toggled with Space or a click
 */
export type ColumnType = "text" | "longtext" | "number" | "money" | "date" | "select" | "checkbox";

export interface ColumnOption {
  value: string;
  label: string;
}

export interface EditableColumn<T> {
  /** The row field this column reads and writes (for a computed column, just a unique key) */
  key: string;
  header: string;
  /** Default "text" */
  type?: ColumnType;
  /** Width in px. Columns have fixed widths, so editors fill the cell exactly. Defaults by type. */
  width?: number;
  /** Shown but not editable */
  readOnly?: boolean;
  /** Worked out from the row, so it follows every edit: a row total, a variance. Read-only. */
  compute?: (row: T) => CellValue;
  /** Choices of a select column, in order: plain strings, or values with labels */
  options?: (string | ColumnOption)[];
  required?: boolean;
  /** Lowest and highest allowed: numbers for number and money columns, ISO dates for date columns */
  min?: number | ISODate;
  max?: number | ISODate;
  /** Text columns: the whole value must match */
  pattern?: RegExp;
  /** What to say when `pattern` doesn't match: "Use the form INV-0000" */
  patternMessage?: string;
  /** Text columns: the longest allowed */
  maxLength?: number;
  /** Your own check, given the parsed value and the row. Return the message, or null when it is fine. */
  validate?: (value: CellValue, row: T) => string | null | undefined;
  /** Number columns: decimals kept (values are rounded to it) and shown. Money: exactly this many, default 2. */
  decimals?: number;
  /** Money columns: an ISO currency code, to show its symbol in every cell ("€1,200.00") */
  currency?: string;
  /** Totals row: the column's sum, average or count of filled cells, or your own figure */
  total?: "sum" | "average" | "count" | ((rows: T[]) => CellValue);
  /** Display text in place of the default formatting (the editor still shows the plain value). No row in the totals row. */
  format?: (value: CellValue, row: T | undefined) => string;
  /** Muted text in an empty editable cell: "Add a note" */
  placeholder?: string;
}

const DEFAULT_WIDTH: Record<ColumnType, number> = {
  text: 160,
  longtext: 220,
  number: 88,
  money: 104,
  date: 132,
  select: 132,
  checkbox: 64,
};

export const columnType = <T>(c: EditableColumn<T>): ColumnType => c.type ?? "text";
export const columnWidth = <T>(c: EditableColumn<T>): number => c.width ?? DEFAULT_WIDTH[columnType(c)];
export const isNumeric = <T>(c: EditableColumn<T>) => columnType(c) === "number" || columnType(c) === "money";
export const isEditableColumn = <T>(c: EditableColumn<T>) => !c.readOnly && !c.compute;

export function columnOptions<T>(c: EditableColumn<T>): ColumnOption[] {
  return (c.options ?? []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

/** A cell's value: the row's field, or the computed figure */
export function cellValue<T>(c: EditableColumn<T>, row: T): CellValue {
  if (c.compute) return c.compute(row);
  const v = (row as Record<string, unknown>)[c.key];
  return v === undefined ? null : (v as CellValue);
}

/** What a cleared cell holds: "" for text, false for yes/no, null for the rest */
export function emptyValue<T>(c: EditableColumn<T>): CellValue {
  const t = columnType(c);
  return t === "text" || t === "longtext" ? "" : t === "checkbox" ? false : null;
}

const isBlank = (v: CellValue) => v == null || v === "";

/** The row with one field set, as a new object */
export function withValue<T>(row: T, key: string, value: CellValue): T {
  return { ...row, [key]: value };
}

// -------------------------------------------------------------------------------------------------
// Parsing

const MULTIPLIER: Record<string, number> = { k: 1e3, m: 1e6, mm: 1e6, b: 1e9, bn: 1e9 };

/**
 * A number from what a person typed or pasted, as leniently as is safe: "1,200.50", "1 200,50",
 * "1.200,50", "$1,200", "-€30", "(300)" (accounting negative), "1.2k", "3m", "−5" (a real minus).
 * A lone comma with other than three digits after it is a decimal comma ("12,5"). Returns null
 * for nothing typed and undefined for text that isn't a number.
 */
export function parseNumber(input: string): number | null | undefined {
  let s = input.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/[−‒–—]/g, "-");
  // Currency symbols and three-letter codes, before or after the number
  s = s.replace(/[$€£¥₹₩₽₺₪฿₫₴₦¢]/g, "").replace(/^[A-Za-z]{3}\s+|\s+[A-Za-z]{3}$/g, "").trim();
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1).trim();
  } else if (s.startsWith("+")) s = s.slice(1).trim();
  if (s.endsWith("-")) {
    negative = !negative;
    s = s.slice(0, -1).trim();
  }
  let multiplier = 1;
  const suffix = /^(.*?)\s*(k|m|mm|b|bn)$/i.exec(s);
  if (suffix) {
    multiplier = MULTIPLIER[suffix[2].toLowerCase()];
    s = suffix[1];
  }
  s = s.replace(/[\s_'   ]/g, "");
  const dot = s.lastIndexOf(".");
  const comma = s.lastIndexOf(",");
  if (dot >= 0 && comma >= 0) {
    // Whichever comes last is the decimal separator
    s = comma > dot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (comma >= 0) {
    if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
    else if (/^\d*,\d+$/.test(s)) s = s.replace(",", ".");
    else return undefined;
  } else if ((s.match(/\./g) ?? []).length > 1) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    else return undefined;
  }
  if (!/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return undefined;
  const n = Number(s) * multiplier;
  if (!Number.isFinite(n)) return undefined;
  return negative ? -n : n;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function monthFromName(s: string): number | undefined {
  const k = s.toLowerCase().replace(/\.$/, "");
  if (k.length < 3) return undefined;
  const i = MONTHS.findIndex((m) => k.startsWith(m) || (k === "sept" && m === "sep"));
  return i >= 0 ? i + 1 : undefined;
}

function toDate(y: number, m: number, d: number): ISODate | undefined {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return undefined;
  return makeDate(y, m, d);
}

/** Whether a locale writes the day or the month first in a numeric date: "dmy" (en-GB, de) or "mdy" (en-US) */
export function dateOrder(locale?: string): "dmy" | "mdy" {
  const parts = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }).formatToParts(
    Date.UTC(2000, 10, 22),
  );
  const day = parts.findIndex((p) => p.type === "day");
  const month = parts.findIndex((p) => p.type === "month");
  return month >= 0 && month < day ? "mdy" : "dmy";
}

/**
 * A date from the common ways of writing one: "2027-03-04", "2027/3/4", "4 Mar 2027",
 * "March 4, 2027", "4-Mar-27" (Excel), "4/3/2027". In a numeric date, a part over 12 must be the
 * day; otherwise `order` decides (the locale's, see dateOrder). Returns null for nothing typed and
 * undefined for text that isn't a date, including Feb 30.
 */
export function parseDate(input: string, order: "dmy" | "mdy" = "dmy"): ISODate | null | undefined {
  const s = input.trim().replace(/\s+/g, " ");
  if (!s) return null;
  const iso = parseISODate(s);
  if (iso) return iso;
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return toDate(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(s);
  if (m) {
    const [a, b, y] = [+m[1], +m[2], +m[3]];
    const dayFirst = a > 12 ? true : b > 12 ? false : order === "dmy";
    return dayFirst ? toDate(y, b, a) : toDate(y, a, b);
  }
  // 4 Mar 2027, 4-Mar-27 (English month names only)
  m = /^(\d{1,2})(?:st|nd|rd|th)?[-/ .]+([A-Za-z]+\.?)[-/ ,.]+(\d{2}|\d{4})$/.exec(s);
  if (m) {
    const mo = monthFromName(m[2]);
    return mo ? toDate(+m[3], mo, +m[1]) : undefined;
  }
  // Mar 4, 2027 / March 4 2027
  m = /^([A-Za-z]+\.?)[ -]+(\d{1,2})(?:st|nd|rd|th)?,? +(\d{2}|\d{4})$/.exec(s);
  if (m) {
    const mo = monthFromName(m[1]);
    return mo ? toDate(+m[3], mo, +m[2]) : undefined;
  }
  return undefined;
}

const TRUE = new Set(["true", "yes", "y", "1", "x", "✓", "✔", "on", "checked", "ticked", "done"]);
const FALSE = new Set(["false", "no", "n", "0", "", "off", "unchecked", "-", "–"]);

/** yes/no from text: "TRUE" (Excel, Google Sheets), "yes", "y", "x", "1", "✓"; undefined when it is neither */
export function parseBoolean(input: string): boolean | undefined {
  const s = input.trim().toLowerCase();
  if (TRUE.has(s)) return true;
  if (FALSE.has(s)) return false;
  return undefined;
}

export type Parsed = { ok: true; value: CellValue } | { ok: false; error: string };

const round = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

/**
 * Text, as typed or pasted, into the column's type. It only checks the type; the column's rules
 * (required, min, max, pattern, validate) are validateCell's job, so a value that breaks one is
 * still stored and shown with its message.
 */
export function parseCell<T>(c: EditableColumn<T>, text: string, locale?: string): Parsed {
  switch (columnType(c)) {
    case "text":
      return { ok: true, value: text.replace(/[\r\n]+/g, " ") };
    case "longtext":
      return { ok: true, value: text.replace(/\r\n?/g, "\n") };
    case "number":
    case "money": {
      const n = parseNumber(text);
      if (n === undefined) return { ok: false, error: "Not a number" };
      if (n === null) return { ok: true, value: null };
      const decimals = c.decimals ?? (columnType(c) === "money" ? 2 : undefined);
      return { ok: true, value: decimals == null ? n : round(n, decimals) };
    }
    case "date": {
      const d = parseDate(text, dateOrder(locale));
      if (d === undefined) return { ok: false, error: "Not a date. Use YYYY-MM-DD, e.g. 2027-03-04" };
      return { ok: true, value: d };
    }
    case "select": {
      const s = text.trim();
      if (!s) return { ok: true, value: null };
      const opts = columnOptions(c);
      const hit = opts.find((o) => o.value === s) ?? opts.find((o) => o.label.toLowerCase() === s.toLowerCase() || o.value.toLowerCase() === s.toLowerCase());
      if (hit) return { ok: true, value: hit.value };
      const list = opts.map((o) => o.label);
      return { ok: false, error: `Not one of the choices: ${list.slice(0, 6).join(", ")}${list.length > 6 ? "…" : ""}` };
    }
    case "checkbox": {
      const b = parseBoolean(text);
      return b === undefined ? { ok: false, error: "Use yes or no" } : { ok: true, value: b };
    }
  }
}

// -------------------------------------------------------------------------------------------------
// Formatting

const formatters = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: string | undefined, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(opts)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, opts);
    formatters.set(key, f);
  }
  return f;
}

/** A number the way a column shows it */
export function formatNumber<T>(c: EditableColumn<T>, n: number, locale?: string): string {
  if (columnType(c) === "money") {
    const decimals = c.decimals ?? 2;
    const opts: Intl.NumberFormatOptions = c.currency
      ? { style: "currency", currency: c.currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: decimals, maximumFractionDigits: decimals }
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    return numberFormat(locale, opts).format(n);
  }
  return numberFormat(locale, c.decimals != null ? { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals } : { maximumFractionDigits: 6 }).format(n);
}

/** A cell's text as shown (and copied): the column's format, numbers grouped, options by label, yes/no */
export function formatCell<T>(c: EditableColumn<T>, value: CellValue, row: T | undefined, locale?: string): string {
  if (c.format) return c.format(value, row);
  if (value == null) return "";
  switch (columnType(c)) {
    case "number":
    case "money":
      return typeof value === "number" ? formatNumber(c, value, locale) : String(value);
    case "select":
      return columnOptions(c).find((o) => o.value === value)?.label ?? String(value);
    case "checkbox":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

/** The text an editor starts with: like formatCell but plain, so it parses back to the same value ("1200.5") */
export function editText<T>(c: EditableColumn<T>, value: CellValue): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

// -------------------------------------------------------------------------------------------------
// Validation

/** What is wrong with a parsed value under the column's rules, or null */
export function validateCell<T>(c: EditableColumn<T>, value: CellValue, row: T, locale?: string): string | null {
  const t = columnType(c);
  if (c.required && (isBlank(value) || (t === "checkbox" && value !== true))) return t === "checkbox" ? "Must be ticked" : "Required";
  if (!isBlank(value)) {
    if ((t === "number" || t === "money") && typeof value === "number") {
      if (typeof c.min === "number" && value < c.min) return `Must be at least ${formatNumber(c, c.min, locale)}`;
      if (typeof c.max === "number" && value > c.max) return `Must be at most ${formatNumber(c, c.max, locale)}`;
    }
    if (t === "date" && typeof value === "string") {
      if (typeof c.min === "string" && value < c.min) return `Must be ${c.min} or later`;
      if (typeof c.max === "string" && value > c.max) return `Must be ${c.max} or earlier`;
    }
    if ((t === "text" || t === "longtext") && typeof value === "string") {
      if (c.maxLength != null && value.length > c.maxLength) return `At most ${c.maxLength} characters (this is ${value.length})`;
      if (c.pattern) {
        const re = new RegExp(`^(?:${c.pattern.source})$`, c.pattern.flags.replace("g", ""));
        if (!re.test(value)) return c.patternMessage ?? "Not in the expected form";
      }
    }
  }
  return c.validate?.(value, row) ?? null;
}

/**
 * Typed text that didn't parse is kept per cell, by row key and column key, so the cell can show
 * it with its message instead of quietly dropping it. The row holds the column's empty value meanwhile.
 */
export type RawInput = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** The raw text kept for a cell, given the row's own entries, if it still applies (the row's value is still empty) */
export function keptText<T>(forRow: Readonly<Record<string, string>> | undefined, c: EditableColumn<T>, row: T): string | undefined {
  const text = forRow?.[c.key];
  if (text === undefined) return undefined;
  const v = cellValue(c, row);
  return isBlank(v) || v === false ? text : undefined;
}

/** The raw text kept for a cell, if it still applies (the row's value is still empty) */
export function rawFor<T>(raw: RawInput, rowKey: string, c: EditableColumn<T>, row: T): string | undefined {
  return keptText(raw[rowKey], c, row);
}

/** A cell's message: the parse error of its raw text, else the rule it breaks, else null */
export function cellError<T>(c: EditableColumn<T>, row: T, raw: string | undefined, locale?: string): string | null {
  if (c.compute) return null;
  if (raw !== undefined) {
    const p = parseCell(c, raw, locale);
    if (!p.ok) return p.error;
  }
  if (c.readOnly) return null;
  return validateCell(c, cellValue(c, row), row, locale);
}

export interface CellProblem {
  row: number;
  column: number;
  message: string;
}

/** Every cell with a message, in reading order */
export function collectErrors<T>(rows: T[], columns: EditableColumn<T>[], raw: RawInput, rowKey: (row: T) => string, locale?: string): CellProblem[] {
  const out: CellProblem[] = [];
  rows.forEach((row, r) => {
    const k = rowKey(row);
    columns.forEach((c, ci) => {
      const message = cellError(c, row, rawFor(raw, k, c, row), locale);
      if (message) out.push({ row: r, column: ci, message });
    });
  });
  return out;
}

// -------------------------------------------------------------------------------------------------
// Copy and paste

/**
 * Tab-separated text, as Excel, Numbers and Google Sheets put on the clipboard, into rows of
 * cells. Cells in double quotes may hold tabs, line breaks and doubled quotes. One trailing line
 * break is dropped.
 */
export function parseTSV(text: string): string[][] {
  const s = text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  if (!s) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let atStart = true;
  while (i < s.length) {
    const ch = s[i];
    if (atStart && ch === '"') {
      // A quoted cell runs to the next quote that isn't doubled
      let j = i + 1;
      let out = "";
      let closed = false;
      while (j < s.length) {
        if (s[j] === '"') {
          if (s[j + 1] === '"') {
            out += '"';
            j += 2;
            continue;
          }
          closed = true;
          j++;
          break;
        }
        out += s[j++];
      }
      if (closed && (j >= s.length || s[j] === "\t" || s[j] === "\n")) {
        cell = out;
        i = j;
        atStart = false;
        continue;
      }
      // Not a well-formed quoted cell: take the quote literally
    }
    if (ch === "\t") {
      row.push(cell);
      cell = "";
      atStart = true;
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      atStart = true;
    } else {
      cell += ch;
      atStart = false;
    }
    i++;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

/** Rows of cells as tab-separated text, quoting cells that hold a tab, a line break or a quote */
export function toTSV(cells: string[][]): string {
  return cells.map((r) => r.map((v) => (/[\t\n\r"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join("\t")).join("\n");
}

// -------------------------------------------------------------------------------------------------
// Changes against the saved version

export interface CellChange<T> {
  row: T;
  rowKey: string;
  column: string;
  from: CellValue;
  to: CellValue;
}

export interface TableChanges<T> {
  /** Cells whose value differs from the saved row (in rows that were already there) */
  edited: CellChange<T>[];
  /** Rows that aren't in the saved version */
  added: T[];
  /** Saved rows that are gone */
  deleted: T[];
  /** edited cells + added rows + deleted rows */
  count: number;
}

const same = (a: CellValue, b: CellValue) => a === b || (isBlank(a) && isBlank(b)) || (a === false && b == null) || (a == null && b === false);

/** Whether a cell differs from the saved version of its row (a missing saved row means the row is new) */
export function cellChanged<T>(c: EditableColumn<T>, row: T, saved: T | undefined, raw: string | undefined): boolean {
  if (c.compute || !saved) return false;
  return raw !== undefined || !same(cellValue(c, row), cellValue(c, saved));
}

/** What changed between the saved rows and the current ones, matching rows by key. Computed columns don't count. */
export function diffRows<T>(saved: T[], rows: T[], columns: EditableColumn<T>[], rowKey: (row: T) => string, raw: RawInput = {}): TableChanges<T> {
  const before = new Map(saved.map((r) => [rowKey(r), r]));
  const now = new Set<string>();
  const edited: CellChange<T>[] = [];
  const added: T[] = [];
  for (const row of rows) {
    const k = rowKey(row);
    now.add(k);
    const old = before.get(k);
    if (!old) {
      added.push(row);
      continue;
    }
    if (old === row && !raw[k]) continue;
    for (const c of columns) {
      if (cellChanged(c, row, old, rawFor(raw, k, c, row))) edited.push({ row, rowKey: k, column: c.key, from: cellValue(c, old), to: cellValue(c, row) });
    }
  }
  const deleted = saved.filter((r) => !now.has(rowKey(r)));
  return { edited, added, deleted, count: edited.length + added.length + deleted.length };
}

/** "3 cells edited, 1 row added" */
export function describeChanges<T>(ch: TableChanges<T>): string {
  const parts: string[] = [];
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  if (ch.edited.length) parts.push(n(ch.edited.length, "cell edited", "cells edited"));
  if (ch.added.length) parts.push(n(ch.added.length, "row added", "rows added"));
  if (ch.deleted.length) parts.push(n(ch.deleted.length, "row deleted", "rows deleted"));
  return parts.join(", ");
}

// -------------------------------------------------------------------------------------------------
// Totals

/** A totals-row figure as text: counts as plain numbers, the rest the way the column shows its values */
export function formatTotal<T>(c: EditableColumn<T>, value: CellValue, locale?: string): string {
  if (value == null) return "";
  if (c.total === "count" && typeof value === "number") return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  return formatCell(c, value, undefined, locale);
}

/** A column's figure for the totals row: the sum, average or count of its filled cells, or its own function */
export function columnTotal<T>(c: EditableColumn<T>, rows: T[]): CellValue {
  if (!c.total) return null;
  if (typeof c.total === "function") return c.total(rows);
  const values = rows.map((r) => cellValue(c, r)).filter((v) => !isBlank(v) && v !== false);
  if (c.total === "count") return values.length;
  const nums = values.filter((v): v is number => typeof v === "number");
  const sum = nums.reduce((a, b) => a + b, 0);
  if (c.total === "sum") return sum;
  return nums.length ? sum / nums.length : null;
}
