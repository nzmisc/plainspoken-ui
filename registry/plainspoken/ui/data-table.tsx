"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Funnel,
  Search,
  X,
} from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import {
  applyFilters,
  applySort,
  clampWidth,
  describeFilter,
  formatCell,
  isFilterActive,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  nextSort,
  normalizeFilter,
  toDelimited,
  toHtmlTable,
  toXlsx,
  valueKey,
  type ColumnFilter,
  type DataColumn,
  type Filters,
  type SortKey,
} from "@/registry/plainspoken/lib/data-table";
import { XLSX_MIME } from "@/registry/plainspoken/lib/xlsx";
import { useMediaQuery } from "@/registry/plainspoken/hooks/use-media-query";
import { Button, ButtonGroup, IconButton } from "@/registry/plainspoken/ui/button";
import { Checkbox, CheckboxBox } from "@/registry/plainspoken/ui/checkbox";
import { ColumnFilterPanel } from "@/registry/plainspoken/ui/data-table-filter";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { MenuButton } from "@/registry/plainspoken/ui/menu-button";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

export type {
  CellValue,
  ColumnFilter,
  ColumnType,
  DataColumn,
  DatePeriod,
  FilterCondition,
  FilterOp,
  Filters,
  SortDir,
  SortKey,
} from "@/registry/plainspoken/lib/data-table";

export type ExportFormat = "copy" | "xlsx" | "csv";

/** What the table shows, as plain data: for saved views, or to keep it in the URL */
export interface DataTableState {
  sort: SortKey[];
  filters: Filters;
  quick: string;
  /** Every column key, in display order */
  columnOrder: string[];
  hiddenColumns: string[];
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  /** A stable, unique key per row (an id), for selection and React */
  rowKey: (row: T) => string;
  /** Accessible name of the table, and the name of the downloaded files */
  label: string;
  initialSort?: SortKey[];
  initialFilters?: Filters;
  initialQuick?: string;
  /** Column keys in the order to show them; columns left out follow in their own order */
  initialColumnOrder?: string[];
  /** Columns to hide at first, instead of each column's `defaultHidden` */
  initialHiddenColumns?: string[];
  /** Column widths in px by key, e.g. from the last visit; others fit their content until one is resized */
  initialWidths?: Record<string, number>;
  /** After a column is resized (at the end of a drag, a key press, a fit or a reset): every width, in px */
  onWidthsChange?: (widths: Record<string, number>) => void;
  /** After the sort, filters or columns change, for saved views */
  onStateChange?: (state: DataTableState) => void;
  /** The rows the filters leave, in the sorted order (every page), whenever they change: for a detail view's Previous and Next */
  onViewRowsChange?: (rows: T[]) => void;
  /** Page-size choices; 0 means "all". `[0]` turns paging off. */
  pageSizes?: number[];
  initialPageSize?: number;
  /** A checkbox column; shift-click a second box to select the range between */
  selectable?: boolean;
  /** Selected row keys, controlled. Leave out to let the table keep them. */
  selected?: ReadonlySet<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  /** Buttons for the selection bar, given the selected rows: "Mark as paid", "Delete" */
  selectionActions?: (rows: T[]) => ReactNode;
  /**
   * Height of the scroll box; the header row sticks to its top. "none" lets the table grow; "fill"
   * takes the height left in the DataTable's own box (give it one: `h-full`, `flex-1 min-h-0`).
   */
  maxHeight?: string;
  initialDensity?: "compact" | "comfortable";
  /** @deprecated Filters moved into a button in each header; this does nothing now. */
  initialShowFilters?: boolean;
  /** The "filter all columns" box. Default on. */
  quickFilter?: boolean;
  /** A filter button in each header (values and conditions, like Excel), and the chips that list them. Default on. */
  columnFilters?: boolean;
  /** The menu to show, hide and reorder columns. Default on. */
  columnPicker?: boolean;
  /** Drag (or focus and use the arrow keys on) a header's right edge to change its width. Default on. */
  resizableColumns?: boolean;
  /** The compact / comfortable rows choice. Default on. */
  densityToggle?: boolean;
  /**
   * Draw only the rows in view (and a few either side), for long pages: thousands of rows scroll
   * and sort as quickly as fifty. Needs a scroll box (`maxHeight` other than "none"). Rows are one
   * line each, columns get fixed widths, and the browser's find-in-page only sees the rows drawn.
   * Off by default.
   */
  windowed?: boolean;
  /** The Export menu: copy, Excel, CSV. Default on. */
  exportable?: boolean;
  /** Which exports the menu offers. Default all three. */
  exportFormats?: ExportFormat[];
  /** The "Sorted by" line, which is how keyboard and touch users sort by several columns. Default on. */
  sortBar?: boolean;
  /** The time date filters ("this week") count from. Default: now, in the browser. */
  now?: number;
  /** More controls at the end of the toolbar, e.g. "New invoice" */
  actions?: ReactNode;
  /** What the body says when there are no rows at all (not when filters hide them) */
  empty?: ReactNode;
  /**
   * Each row's page: the first visible cell becomes a link to it (the keyboard way in), and a
   * click anywhere else on the row follows it; Ctrl/Cmd-click opens it in a new tab. Don't render
   * a link of your own in that first column.
   */
  rowHref?: (row: T) => string;
  /**
   * Called when a row is clicked: the first visible cell becomes a button (the keyboard way in:
   * Tab to it, Enter), and a click anywhere else on the row does the same. With rowHref, it is
   * called as the link is followed.
   */
  onRowClick?: (row: T) => void;
  /** The row to mark as open (a detail drawer's row), by key */
  activeRowKey?: string | null;
  /** Draws the rowHref links: with Next.js, `NextLink` from `@/lib/next-link`. Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

const TH = "border-r border-b border-border bg-muted p-0 text-left align-bottom font-semibold whitespace-nowrap last:border-r-0";
const TD = "border-r border-b border-border px-2 align-top last:border-r-0";
/** The checkbox column: the box (at least 14px, the icon size) plus px-2 and a border */
const SELECT_COL_WIDTH = "calc(max(14px, var(--ctl-icon)) + 1rem + 1px)";
const ALL_FORMATS: ExportFormat[] = ["copy", "xlsx", "csv"];
/** Narrow screens get the column filter as a sheet from the bottom instead of a popover */
const NARROW = "(max-width: 639px)";

const widthsOf = <T,>(columns: DataColumn<T>[]) => Object.fromEntries(columns.filter((c) => c.width != null).map((c) => [c.key, c.width!]));

/**
 * A table for working with up to a few thousand rows in the browser: a quick filter over every
 * visible column, Excel-style filters per column (a checklist of values with counts, or one or two
 * conditions such as "contains", "> 1,000", "top 10", "this month"), sorting by several columns,
 * columns to show, hide, reorder and resize, row selection, paging, two densities, a totals row,
 * and export (copy for spreadsheets, Excel .xlsx, CSV). Every part can be switched off, down to a
 * plain sortable table.
 *
 * Sorting: click a header to sort by it alone (ascending, descending, off). Shift-click adds it as
 * the next sort level, numbered in the header. Without a mouse, the "Sorted by" line does the same:
 * add a level, flip it, move it earlier or later, remove it.
 *
 * Filtering: the funnel in a header (or Alt+↓ on the header) opens its filter, which edits a draft
 * until OK, like Excel's. Active filters show as chips in the toolbar: click one to edit it, × to
 * remove it. On narrow screens the filter opens as a sheet from the bottom.
 *
 * Widths: drag a header's right edge, or double-click it to fit the column to its content (the
 * header and the rows on this page). The edge is focusable: ← and → change the width by 10px
 * (Shift: 50px), Home and End go to the column's minimum and maximum, Enter fits it. Once a column
 * has a width the table lays out at fixed widths, and cells that don't fit end in an ellipsis.
 *
 * Export follows the view: the visible columns in their order, filtered and sorted as shown, or
 * only the selected rows when there are some. Copy puts both tab-separated text and an HTML table
 * on the clipboard, which Excel and Google Sheets paste as cells.
 *
 * Clickable rows (`rowHref`, `onRowClick`) stay a plain table: the first cell holds a real link or
 * button, which is what the keyboard and screen readers use; the rest of the row is a bigger target
 * for the mouse, and clicks on the row's own controls (checkbox, links, buttons) are left alone.
 *
 * The toolbar and paging controls are sm (24px), the header's filter buttons xs (20px).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  label,
  initialSort = [],
  initialFilters = {},
  initialQuick = "",
  initialColumnOrder,
  initialHiddenColumns,
  initialWidths,
  onWidthsChange,
  onStateChange,
  onViewRowsChange,
  pageSizes = [25, 50, 100, 0],
  initialPageSize = pageSizes[0],
  selectable = false,
  selected: selectedProp,
  onSelectionChange,
  selectionActions,
  maxHeight = "28rem",
  initialDensity = "compact",
  quickFilter = true,
  columnFilters = true,
  columnPicker = true,
  resizableColumns = true,
  densityToggle = true,
  windowed = false,
  exportable = true,
  exportFormats = ALL_FORMATS,
  sortBar = true,
  now,
  actions,
  empty,
  rowHref,
  onRowClick,
  activeRowKey,
  linkAs,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortKey[]>(initialSort);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [quick, setQuick] = useState(initialQuick);
  const [order, setOrder] = useState(() => initialColumnOrder ?? columns.map((c) => c.key));
  const [hidden, setHidden] = useState(() => new Set(initialHiddenColumns ?? columns.filter((c) => c.defaultHidden).map((c) => c.key)));
  const [widths, setWidths] = useState<Record<string, number>>(() => ({ ...widthsOf(columns), ...initialWidths }));
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(0);
  const [ownSelected, setOwnSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [density, setDensity] = useState(initialDensity);
  const [filterOpen, setFilterOpen] = useState<{ key: string; anchor: HTMLElement } | null>(null);
  const anchor = useRef<string | null>(null);
  const table = useRef<HTMLTableElement>(null);
  const headRow = useRef<HTMLTableRowElement>(null);
  const filterButtons = useRef(new Map<string, HTMLButtonElement>());
  const narrow = useMediaQuery(NARROW);

  const byKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  // Columns added after the first render go at the end, so a changing column list keeps working.
  const fullOrder = useMemo(() => [...order.filter((k) => byKey.has(k)), ...columns.map((c) => c.key).filter((k) => !order.includes(k))], [order, byKey, columns]);
  const visibleCols = useMemo(() => fullOrder.map((k) => byKey.get(k)!).filter((c) => !hidden.has(c.key)), [fullOrder, byKey, hidden]);
  const visibleSet = useMemo(() => new Set(visibleCols.map((c) => c.key)), [visibleCols]);

  const filtered = useMemo(() => applyFilters(rows, columns, columnFilters ? filters : {}, quick, visibleSet, now), [rows, columns, columnFilters, filters, quick, visibleSet, now]);
  const sorted = useMemo(() => applySort(filtered, columns, sort), [filtered, columns, sort]);

  const size = pageSize === 0 ? Math.max(1, sorted.length) : pageSize;
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const p = Math.min(page, pages - 1);
  const pageRows = sorted.slice(p * size, p * size + size);

  // Saved views: tell the page what the table shows, once per real change
  const stateKey = JSON.stringify([sort, filters, quick, fullOrder, [...hidden].sort()]);
  const latest = useRef({ onStateChange, onWidthsChange, onViewRowsChange, widths });
  useLayoutEffect(() => {
    latest.current = { onStateChange, onWidthsChange, onViewRowsChange, widths };
  });
  useEffect(() => {
    latest.current.onViewRowsChange?.(sorted);
  }, [sorted]);
  const firstState = useRef(true);
  useEffect(() => {
    if (firstState.current) {
      firstState.current = false;
      return;
    }
    const [s, f, q, o, h] = JSON.parse(stateKey) as [SortKey[], Filters, string, string[], string[]];
    latest.current.onStateChange?.({ sort: s, filters: f, quick: q, columnOrder: o, hiddenColumns: h });
  }, [stateKey]);

  // Any change to what matches starts again from page 1.
  const changeSort = (next: SortKey[] | ((cur: SortKey[]) => SortKey[])) => {
    setSort(next);
    setPage(0);
  };
  const setFilter = (key: string, f: ColumnFilter | undefined) => {
    setFilters((fs) => {
      const next = { ...fs };
      if (f) next[key] = f;
      else delete next[key];
      return next;
    });
    setPage(0);
  };
  const clearFilters = () => {
    setFilters({});
    setQuick("");
    setPage(0);
  };
  const activeFilters = columnFilters ? columns.filter((c) => isFilterActive(filters[c.key])) : [];

  // Value keys as their cell text, for the chips ("Paid, Sent"; "$1,200.00")
  const chipLabels = useMemo(() => {
    const out = new Map<string, (k: string) => string>();
    for (const c of columns) {
      const n = normalizeFilter(filters[c.key]);
      if (n?.kind !== "values" || c.type === "date" || c.type === "number") continue;
      const want = new Set(n.values);
      const labels = new Map<string, string>();
      for (const r of rows) {
        const k = valueKey(c, r);
        if (want.has(k) && !labels.has(k)) labels.set(k, formatCell(c, r));
        if (labels.size === want.size) break;
      }
      out.set(c.key, (k) => labels.get(k) ?? k);
    }
    return out;
  }, [columns, filters, rows]);

  // Selection
  const selected = selectedProp ?? ownSelected;
  const setSelected = (next: Set<string>) => {
    if (selectedProp === undefined) setOwnSelected(next);
    onSelectionChange?.(next);
  };
  const filteredKeys = useMemo(() => sorted.map(rowKey), [sorted, rowKey]);
  const selectedInView = filteredKeys.filter((k) => selected.has(k)).length;
  const allSelected = filteredKeys.length > 0 && selectedInView === filteredKeys.length;

  const toggleRow = (key: string, shift: boolean) => {
    const on = !selected.has(key);
    const next = new Set(selected);
    const a = shift && anchor.current && anchor.current !== key ? filteredKeys.indexOf(anchor.current) : -1;
    const b = filteredKeys.indexOf(key);
    if (a >= 0 && b >= 0) {
      for (const k of filteredKeys.slice(Math.min(a, b), Math.max(a, b) + 1)) {
        if (on) next.add(k);
        else next.delete(k);
      }
    } else if (on) next.add(key);
    else next.delete(key);
    anchor.current = key;
    setSelected(next);
  };
  const toggleAll = () => {
    const next = new Set(selected);
    for (const k of filteredKeys) {
      if (allSelected) next.delete(k);
      else next.add(k);
    }
    setSelected(next);
  };
  // Rows are memoized; they get these stable callbacks, which call the latest versions.
  const rowHandlers = useRef({ toggleRow, onRowMouse: (() => {}) as (e: ReactMouseEvent<HTMLTableRowElement>, r: T) => void });
  const onToggle = useCallback((key: string, shift: boolean) => rowHandlers.current.toggleRow(key, shift), []);
  const onRowMouseStable = useCallback((e: ReactMouseEvent<HTMLTableRowElement>, r: T) => rowHandlers.current.onRowMouse(e, r), []);
  /** The selected rows in the view's order, including any the filters hide */
  const selectedRows = () => applySort(rows.filter((r) => selected.has(rowKey(r))), columns, sort);

  // ---------------------------------------------------------------------------------------------
  // Column widths. Until a column has a width the browser lays the table out by content; after
  // that every visible column gets one (measured from the screen) and the layout is fixed.

  const fixed = visibleCols.length > 0 && visibleCols.every((c) => widths[c.key] != null);
  const someWidths = visibleCols.some((c) => widths[c.key] != null);
  const [dragging, setDragging] = useState<string | null>(null);

  /** Widths as drawn now, for the columns that have none yet */
  const measured = (): Record<string, number> => {
    const out: Record<string, number> = {};
    headRow.current?.querySelectorAll<HTMLElement>("th[data-col]").forEach((th) => {
      const c = byKey.get(th.dataset.col!);
      if (c) out[c.key] = clampWidth(c, th.getBoundingClientRect().width);
    });
    return out;
  };
  const complete = (): Record<string, number> => ({ ...measured(), ...latest.current.widths });
  // A column shown again, or widths given for some columns only: measure the rest before painting.
  useLayoutEffect(() => {
    // Windowed rows need fixed widths too, or columns would change width while scrolling.
    // Measuring has to wait for layout, so this sets state in an effect, before the browser paints.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((someWidths || (windowed && maxHeight !== "none")) && !fixed) setWidths((w) => ({ ...measured(), ...w }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [someWidths, fixed, windowed, maxHeight]);

  const commitWidths = (next: Record<string, number>) => {
    setWidths(next);
    latest.current.onWidthsChange?.(next);
  };
  /** The width the column's content wants: the header and the rendered rows, laid out unconstrained */
  const fitWidth = (c: DataColumn<T>): number => {
    const t = table.current;
    if (!t?.parentElement) return widths[c.key] ?? 120;
    const probe = document.createElement("table");
    probe.className = t.className;
    probe.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;width:max-content;min-width:0;table-layout:auto;pointer-events:none";
    const body = document.createElement("tbody");
    t.querySelectorAll<HTMLElement>(`[data-col="${CSS.escape(c.key)}"]`).forEach((cell) => {
      const copy = cell.cloneNode(true) as HTMLElement;
      copy.style.width = "auto";
      copy.style.overflow = "visible";
      const tr = document.createElement("tr");
      tr.append(copy);
      body.append(tr);
    });
    probe.append(body);
    t.parentElement.append(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return clampWidth(c, Math.ceil(w) + 1);
  };
  const resizeTo = (c: DataColumn<T>, w: number) => commitWidths({ ...complete(), [c.key]: clampWidth(c, w) });

  const drag = useRef<{ key: string; x: number; w: number; base: Record<string, number> } | null>(null);
  const onResizeDown = (e: ReactPointerEvent<HTMLDivElement>, c: DataColumn<T>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const base = complete();
    drag.current = { key: c.key, x: e.clientX, w: base[c.key], base };
    setWidths(base);
    setDragging(c.key);
    dragCursor(true);
  };
  const onResizeMove = (e: ReactPointerEvent<HTMLDivElement>, c: DataColumn<T>) => {
    const d = drag.current;
    if (!d || d.key !== c.key) return;
    const w = clampWidth(c, d.w + e.clientX - d.x);
    setWidths((cur) => (cur[c.key] === w ? cur : { ...cur, [c.key]: w }));
  };
  const onResizeEnd = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(null);
    dragCursor(false);
    // After the last move has rendered
    requestAnimationFrame(() => latest.current.onWidthsChange?.(latest.current.widths));
  };
  const onResizeKey = (e: ReactKeyboardEvent<HTMLDivElement>, c: DataColumn<T>) => {
    const cur = complete()[c.key];
    const step = e.shiftKey ? 50 : 10;
    let w: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") w = cur - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") w = cur + step;
    else if (e.key === "Home") w = c.minWidth ?? MIN_COLUMN_WIDTH;
    else if (e.key === "End") w = c.maxWidth ?? MAX_COLUMN_WIDTH;
    else if (e.key === "Enter") w = fitWidth(c);
    if (w == null) return;
    e.preventDefault();
    resizeTo(c, w);
  };
  const resetWidths = () => commitWidths(widthsOf(columns));
  const widthsChanged = JSON.stringify(widths) !== JSON.stringify(widthsOf(columns));

  // ---------------------------------------------------------------------------------------------
  // Column filters: one popover (or sheet) for the column being edited, anchored to whatever opened it

  const filterLayer = useRef<HTMLDivElement>(null);
  // Pressing the funnel (or chip) of the open filter closes it by light dismiss before the click
  // arrives; remembering that at pointerdown keeps the click from opening it again.
  const pressedOpen = useRef<string | null>(null);
  const notePress = (key: string) => {
    pressedOpen.current = filterOpen?.key === key ? key : null;
  };
  const openFilter = (key: string, from?: HTMLElement | null) => {
    if (pressedOpen.current === key) {
      pressedOpen.current = null;
      return;
    }
    const el = from ?? filterButtons.current.get(key);
    if (el) setFilterOpen({ key, anchor: el });
  };
  const closeFilter = () => {
    const open = filterOpen;
    if (!open) return;
    const active = document.activeElement;
    const inside = !active || active === document.body || filterLayer.current?.contains(active) || narrow;
    setFilterOpen(null);
    if (inside) requestAnimationFrame(() => (open.anchor.isConnected ? open.anchor : filterButtons.current.get(open.key))?.focus());
  };
  const filterCol = filterOpen ? byKey.get(filterOpen.key) : undefined;
  const otherRows = useMemo(
    () => (filterCol ? applyFilters(rows, columns, { ...filters, [filterCol.key]: undefined }, quick, visibleSet, now) : []),
    [filterCol, rows, columns, filters, quick, visibleSet, now],
  );
  const filterPanel = filterCol && (
    <ColumnFilterPanel
      key={filterCol.key}
      column={filterCol}
      filter={filters[filterCol.key]}
      rows={otherRows}
      allRows={rows}
      now={now}
      sort={sort}
      onSort={filterCol.sortable === false ? undefined : changeSort}
      onApply={(f) => {
        setFilter(filterCol.key, f);
        closeFilter();
      }}
      onCancel={closeFilter}
      className={narrow ? undefined : "w-72"}
    />
  );

  // ---------------------------------------------------------------------------------------------
  // Export

  const formats = exportable ? exportFormats : [];
  const [exportScope, setExportScope] = useState<"selected" | "view">("selected");
  const scope = selectable && selected.size > 0 ? exportScope : "view";
  const exportRows = () => (scope === "selected" ? selectedRows() : sorted);
  const exportWidths = () => ({ ...measured(), ...widths });
  const copyRows = (which: T[]) => copyTable(toDelimited(which, visibleCols, "\t"), toHtmlTable(which, visibleCols));
  const name = slug(label);

  const sortIndex = (key: string) => sort.findIndex((s) => s.key === key);
  const pad = density === "comfortable" ? "py-1.5" : "py-0.5";
  const colCount = visibleCols.length + (selectable ? 1 : 0) + (fixed ? 1 : 0);
  const cellFit = fixed && "overflow-hidden text-ellipsis whitespace-nowrap";

  // Totals, over every row the filters leave
  const summaries = useMemo(() => {
    if (!visibleCols.some((c) => c.summary)) return null;
    return visibleCols.map((c): ReactNode => {
      const s = c.summary;
      if (!s) return null;
      if (typeof s === "function") return s(sorted);
      const nums = sorted.map((r) => c.value(r)).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      if (!nums.length) return "";
      const total = nums.reduce((a, b) => a + b, 0);
      const v = s === "sum" ? total : total / nums.length;
      const text = c.format ? c.format(v, sorted[0]) : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
      return s === "average" ? (
        <>
          <span className="font-normal text-muted-foreground">avg </span>
          {text}
        </>
      ) : (
        text
      );
    });
  }, [visibleCols, sorted]);

  // Clickable rows: the first cell's link or button is the real target; the row passes clicks on.
  const clickable = rowHref != null || onRowClick != null;
  const onRowMouse = (e: ReactMouseEvent<HTMLTableRowElement>, r: T) => {
    // The row's own controls handle their clicks, and dragging to select text isn't a click.
    if ((e.target as Element).closest("a, button, input, select, textarea, label, summary, [role=button]")) return;
    if (window.getSelection()?.toString()) return;
    if (rowHref && (e.metaKey || e.ctrlKey)) {
      window.open(rowHref(r), "_blank", "noopener");
      return;
    }
    // Through the first cell's link or button, so a router's Link handles it as its own click
    e.currentTarget.cells[selectable ? 1 : 0]?.querySelector<HTMLElement>("a[href], button")?.click();
  };
  useLayoutEffect(() => {
    rowHandlers.current = { toggleRow, onRowMouse };
  });

  // Windowed rendering: only the rows in the scroll box's view, between two spacer rows
  const win = windowed && maxHeight !== "none";
  const box = useRef<HTMLDivElement>(null);
  const tbody = useRef<HTMLTableSectionElement>(null);
  const [view, setView] = useState({ top: 0, height: 0 });
  const [rowH, setRowH] = useState(density === "comfortable" ? 33 : 25);
  const [headH, setHeadH] = useState(25);
  const frame = useRef(0);
  const readView = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const b = box.current;
      if (b) setView((v) => (v.top === b.scrollTop && v.height === b.clientHeight ? v : { top: b.scrollTop, height: b.clientHeight }));
    });
  }, []);
  useEffect(() => {
    const b = box.current;
    if (!win || !b) return;
    readView();
    const ro = new ResizeObserver(readView);
    ro.observe(b);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [win, readView]);
  // Row and header heights as drawn, so the spacers are exact
  const drawnCount = win ? Math.min(pageRows.length, 1) : 0;
  useLayoutEffect(() => {
    if (!win) return;
    const tr = tbody.current?.querySelector<HTMLElement>("tr[data-row]");
    const h = tr?.getBoundingClientRect().height;
    if (h && Math.abs(h - rowH) > 0.25) setRowH(h);
    const hh = headRow.current?.getBoundingClientRect().height;
    if (hh && Math.abs(hh - headH) > 0.25) setHeadH(hh);
  }, [win, density, fixed, visibleCols, drawnCount, rowH, headH]);
  const OVERSCAN = 8;
  const first = win ? Math.min(Math.max(0, Math.floor((view.top - headH) / rowH) - OVERSCAN), Math.max(0, pageRows.length - 1)) : 0;
  const last = win ? Math.min(pageRows.length, first + Math.ceil((view.height || 600) / rowH) + 2 * OVERSCAN) : pageRows.length;
  const drawn = win ? pageRows.slice(first, last) : pageRows;

  const toolbar = quickFilter || activeFilters.length > 0 || columnPicker || densityToggle || formats.length > 0 || actions != null;
  const sumWidths = visibleCols.reduce((s, c) => s + (widths[c.key] ?? 0), 0);

  return (
    <div data-slot="data-table" className={cn("ctl-sm flex min-w-0 flex-col gap-1.5 text-[13px]", className)}>
      {toolbar && (
        <div className="flex flex-wrap items-center gap-1.5">
          {quickFilter && (
            <Input
              type="search"
              aria-label="Filter all columns"
              prefix={Search}
              value={quick}
              onChange={(e) => {
                setQuick(e.target.value);
                setPage(0);
              }}
              placeholder="Filter all columns…"
              className="min-w-0 grow sm:w-56 sm:grow-0"
            />
          )}
          {activeFilters.length > 0 && (
            <ul aria-label="Column filters" className="contents">
              {activeFilters.map((c) => (
                <li key={c.key} className="contents">
                  <FilterChip
                    column={c}
                    filter={filters[c.key]!}
                    labelOf={chipLabels.get(c.key)}
                    open={filterOpen?.key === c.key}
                    onPress={() => notePress(c.key)}
                    onEdit={(el) => openFilter(c.key, el)}
                    onRemove={() => setFilter(c.key, undefined)}
                  />
                </li>
              ))}
            </ul>
          )}
          {(activeFilters.length > 0 || quick !== "") && (
            <Button variant="link" onClick={clearFilters}>
              Clear all filters
            </Button>
          )}
          {(columnPicker || densityToggle || formats.length > 0 || actions != null) && (
            <span className="flex flex-wrap gap-1.5 sm:ml-auto">
              {columnPicker && (
                <MenuButton label={`Columns ${visibleCols.length}/${columns.length}`} aria-label={`Columns: ${visibleCols.length} of ${columns.length} shown`}>
                  <ColumnPicker
                    columns={columns}
                    order={fullOrder}
                    hidden={hidden}
                    onOrder={setOrder}
                    onHidden={setHidden}
                    onReset={() => {
                      setOrder(columns.map((c) => c.key));
                      setHidden(new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)));
                    }}
                    onResetWidths={resizableColumns ? resetWidths : undefined}
                    widthsChanged={widthsChanged}
                  />
                </MenuButton>
              )}
              {densityToggle && (
                <label className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Rows</span>
                  <Select
                    value={density}
                    onChange={(e) => setDensity(e.target.value as typeof density)}
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "comfortable", label: "Comfortable" },
                    ]}
                  />
                </label>
              )}
              {formats.length > 0 && (
                <MenuButton icon={Download} label="Export" align="end" panelClassName="w-80 max-w-[calc(100vw-1rem)]">
                  <ExportPanel
                    formats={formats}
                    selectedCount={selectable ? selected.size : 0}
                    hiddenSelected={selected.size - selectedInView}
                    viewCount={sorted.length}
                    totalCount={rows.length}
                    sorted={sort.length > 0}
                    columnCount={visibleCols.length}
                    allColumns={columns.length}
                    scope={scope}
                    onScope={setExportScope}
                    onCopy={() => copyRows(exportRows())}
                    onXlsx={() => downloadBytes(`${name}.xlsx`, toXlsx(exportRows(), visibleCols, { sheetName: label, widths: exportWidths() }), XLSX_MIME)}
                    onCsv={() => downloadText(`${name}.csv`, toDelimited(exportRows(), visibleCols, ","))}
                  />
                </MenuButton>
              )}
              {actions}
            </span>
          )}
        </div>
      )}

      {sortBar && <SortBar columns={columns.filter((c) => c.sortable !== false)} sort={sort} onSort={changeSort} />}
      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <b>{selected.size} selected</b>
          {selected.size > selectedInView && <span className="text-muted-foreground">({selected.size - selectedInView} hidden by filters)</span>}
          {selectionActions?.(selectedRows())}
          {formats.includes("copy") && <CopyButton label="Copy selected" text={() => copyRows(selectedRows())} />}
          <Button onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
      )}

      <div
        ref={box}
        onScroll={win ? readView : undefined}
        className={cn("relative max-w-full overflow-auto border border-border", maxHeight === "fill" && "min-h-0 flex-1")}
        style={maxHeight === "fill" ? undefined : { maxHeight }}
      >
        <table
          ref={table}
          aria-label={label}
          aria-rowcount={win ? pageRows.length + 1 + (summaries && sorted.length > 0 ? 1 : 0) : undefined}
          className={cn("border-separate border-spacing-0 text-[14px] leading-5", fixed ? "table-fixed" : "min-w-full")}
          style={fixed ? { width: selectable ? `calc(${sumWidths}px + ${SELECT_COL_WIDTH})` : sumWidths, minWidth: "100%" } : undefined}
        >
          {fixed && (
            <colgroup>
              {selectable && <col style={{ width: SELECT_COL_WIDTH }} />}
              {visibleCols.map((c) => (
                <col key={c.key} style={{ width: widths[c.key] }} />
              ))}
              {/* Takes up the room the columns leave, so dragging one narrower doesn't widen the others */}
              <col />
            </colgroup>
          )}
          <thead className="sticky top-0 z-10">
            <tr ref={headRow} aria-rowindex={win ? 1 : undefined}>
              {selectable && (
                <th className={cn(TH, "w-0 px-2 align-middle")}>
                  <CheckboxBox
                    checked={allSelected}
                    indeterminate={selectedInView > 0 && !allSelected}
                    onChange={toggleAll}
                    disabled={filteredKeys.length === 0}
                    aria-label={allSelected ? "Deselect all matching rows" : `Select all ${filteredKeys.length} matching rows`}
                    title="Select all rows that match the filters (on every page)"
                    className="grid"
                  />
                </th>
              )}
              {visibleCols.map((c) => {
                const i = sortIndex(c.key);
                const s = i >= 0 ? sort[i] : null;
                const canFilter = columnFilters && c.filterable !== false;
                const f = filters[c.key];
                const on = canFilter && isFilterActive(f);
                const altDown = (e: ReactKeyboardEvent) => {
                  if (canFilter && e.altKey && e.key === "ArrowDown") {
                    e.preventDefault();
                    openFilter(c.key);
                  }
                };
                const w = widths[c.key];
                return (
                  <th
                    key={c.key}
                    scope="col"
                    data-col={c.key}
                    aria-sort={s ? (s.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(TH, "relative", fixed && "overflow-hidden")}
                  >
                    <div className="flex min-w-0 items-center">
                      {c.sortable === false ? (
                        <span className={cn("min-w-0 grow px-2 py-0.5", fixed && "truncate")}>{c.header}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => changeSort((cur) => nextSort(cur, c.key, e.shiftKey))}
                          onKeyDown={altDown}
                          title={`Sort by ${c.header}. Shift-click to add it as another sort level.${canFilter ? " Alt+↓ opens its filter." : ""}`}
                          className={cn(
                            "flex min-w-0 grow cursor-pointer items-baseline gap-1 self-stretch px-2 py-0.5 text-left font-semibold hover:bg-accent focus-visible:-outline-offset-2",
                            FOCUS_RING,
                          )}
                        >
                          <span className={cn("min-w-0", fixed && "truncate")}>{c.header}</span>
                          {s && (
                            <span className="inline-flex shrink-0 items-baseline font-normal">
                              <Icon icon={s.dir === "asc" ? ArrowUp : ArrowDown} size="1em" />
                              {sort.length > 1 && <span className="text-[11px] font-semibold tabular-nums">{i + 1}</span>}
                              <span className="sr-only">
                                {s.dir === "asc" ? "ascending" : "descending"}
                                {sort.length > 1 ? `, sort level ${i + 1} of ${sort.length}` : ""}
                              </span>
                            </span>
                          )}
                        </button>
                      )}
                      {canFilter && (
                        <button
                          type="button"
                          ref={(el) => {
                            if (el) filterButtons.current.set(c.key, el);
                            else filterButtons.current.delete(c.key);
                          }}
                          aria-haspopup="dialog"
                          aria-expanded={filterOpen?.key === c.key}
                          aria-label={on ? `${c.header} filter: ${describeFilter(f!, c, chipLabels.get(c.key))}. Change it` : `Filter ${c.header}`}
                          title={on ? `Filtered: ${describeFilter(f!, c, chipLabels.get(c.key))}` : `Filter ${c.header} (Alt+↓)`}
                          onPointerDown={() => notePress(c.key)}
                          onClick={(e) => openFilter(c.key, e.currentTarget)}
                          onKeyDown={altDown}
                          data-active={on || undefined}
                          className={cn(
                            "mr-2 flex size-5 shrink-0 cursor-pointer items-center justify-center border focus-visible:-outline-offset-2 [&_svg]:size-3.5",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-transparent text-muted-foreground hover:border-input hover:bg-background hover:text-foreground",
                            FOCUS_RING,
                          )}
                        >
                          <Icon icon={Funnel} fill={on ? "currentColor" : "none"} />
                        </button>
                      )}
                    </div>
                    {resizableColumns && (
                      <div
                        role="separator"
                        tabIndex={0}
                        aria-orientation="vertical"
                        aria-label={`Resize ${c.header}`}
                        aria-valuenow={w}
                        aria-valuemin={c.minWidth ?? MIN_COLUMN_WIDTH}
                        aria-valuemax={c.maxWidth ?? MAX_COLUMN_WIDTH}
                        aria-valuetext={w != null ? `${w} pixels` : undefined}
                        title="Drag to resize, double-click to fit. Keys: ← →, Home, End, Enter to fit."
                        data-dragging={dragging === c.key || undefined}
                        onFocus={() => !fixed && setWidths((cur) => ({ ...measured(), ...cur }))}
                        onPointerDown={(e) => onResizeDown(e, c)}
                        onPointerMove={(e) => onResizeMove(e, c)}
                        onPointerUp={onResizeEnd}
                        onPointerCancel={onResizeEnd}
                        onLostPointerCapture={onResizeEnd}
                        onDoubleClick={() => resizeTo(c, fitWidth(c))}
                        onKeyDown={(e) => onResizeKey(e, c)}
                        className={cn(
                          "absolute inset-y-0 right-0 z-10 w-1.5 cursor-col-resize touch-none select-none pointer-coarse:w-3",
                          // The line it moves: shown on hover, while dragging and when focused
                          "after:absolute after:inset-y-0 after:right-0 after:w-0.5 hover:after:bg-ring data-dragging:after:bg-ring",
                          "focus-visible:outline-none focus-visible:after:w-1 focus-visible:after:bg-ring",
                        )}
                      />
                    )}
                  </th>
                );
              })}
              {fixed && <th aria-hidden className={cn(TH, "border-r-0")} />}
            </tr>
          </thead>
          <tbody ref={tbody} className="[&>tr:last-child>td]:border-b-0">
            {first > 0 && (
              <tr aria-hidden style={{ height: first * rowH }}>
                <td colSpan={colCount} className="p-0" />
              </tr>
            )}
            {drawn.map((r, i) => {
              const k = rowKey(r);
              return (
                <DataRow
                  key={k}
                  row={r}
                  rowId={k}
                  index={win ? p * size + first + i + 2 : undefined}
                  cols={visibleCols}
                  selectable={selectable}
                  on={selected.has(k)}
                  current={activeRowKey != null && k === activeRowKey}
                  pad={pad}
                  fit={fixed || win}
                  filler={fixed}
                  rowHref={rowHref}
                  onRowClick={onRowClick}
                  linkAs={linkAs}
                  onToggle={onToggle}
                  onRowMouse={clickable ? onRowMouseStable : undefined}
                />
              );
            })}
            {last < pageRows.length && (
              <tr aria-hidden style={{ height: (pageRows.length - last) * rowH }}>
                <td colSpan={colCount} className="p-0" />
              </tr>
            )}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-2 py-6 text-center text-muted-foreground">
                  {rows.length === 0 ? (
                    (empty ?? "No rows.")
                  ) : (
                    <>
                      No rows match.{" "}
                      <Button size="xs" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
          {summaries && sorted.length > 0 && (
            <tfoot className="sticky bottom-0 z-10">
              <tr>
                {selectable && <td className="border-t border-r border-border bg-muted" />}
                {visibleCols.map((c, i) => (
                  <td
                    key={c.key}
                    data-col={c.key}
                    className={cn("border-t border-r border-border bg-muted px-2 py-0.5 font-semibold last:border-r-0", c.type === "number" && "text-right tabular-nums", cellFit)}
                  >
                    {summaries[i] ?? (i === 0 ? <span title={`Totals of the ${sorted.length.toLocaleString("en-US")} rows the filters leave`}>Totals</span> : null)}
                  </td>
                ))}
                {fixed && <td aria-hidden className="border-t border-border bg-muted p-0" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p role="status" className="tabular-nums">
          {sorted.length === 0 ? (
            "Showing 0"
          ) : (
            <>
              Showing {p * size + 1}–{p * size + pageRows.length} of <b>{sorted.length}</b>
            </>
          )}
          {sorted.length !== rows.length && <span className="text-muted-foreground"> (filtered from {rows.length})</span>}
        </p>
        {(pageSizes.length > 1 || pages > 1) && (
          <nav aria-label="Pages" className="flex flex-wrap items-center gap-1 whitespace-nowrap sm:ml-auto">
            <IconButton icon={ChevronsLeft} label="First page" onClick={() => setPage(0)} disabled={p === 0} />
            <IconButton icon={ChevronLeft} label="Previous page" onClick={() => setPage(p - 1)} disabled={p === 0} />
            <label className="flex items-center gap-1.5 tabular-nums">
              <span className="text-muted-foreground">Page</span>
              <Select
                value={String(p)}
                onChange={(e) => setPage(Number(e.target.value))}
                options={Array.from({ length: pages }, (_, i) => ({ value: String(i), label: String(i + 1) }))}
              />
              <span className="text-muted-foreground">of {pages}</span>
            </label>
            <IconButton icon={ChevronRight} label="Next page" onClick={() => setPage(p + 1)} disabled={p >= pages - 1} />
            <IconButton icon={ChevronsRight} label="Last page" onClick={() => setPage(pages - 1)} disabled={p >= pages - 1} />
            {pageSizes.length > 1 && (
              <label className="flex items-center gap-1.5 sm:ml-2">
                <span className="text-muted-foreground">Per page</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  options={pageSizes.map((n) => ({ value: String(n), label: n === 0 ? "All" : String(n) }))}
                />
              </label>
            )}
          </nav>
        )}
      </div>

      {/* On phones a sheet, always there and opened by state (a dialog that mounts open trips over StrictMode's second effect run) */}
      {narrow && columnFilters && (
        <Drawer side="bottom" open={filterCol != null} onClose={closeFilter} title={filterCol ? `Filter ${filterCol.header}` : ""} className="ctl-md">
          {filterPanel}
        </Drawer>
      )}
      {filterOpen &&
        filterCol &&
        !narrow && (
          <Floating
            ref={filterLayer}
            open
            onOpenChange={(o) => !o && closeFilter()}
            anchor={() => filterOpen.anchor}
            side="bottom"
            align="start"
            offset={2}
            className="ctl-sm max-h-[85vh] overflow-auto p-2"
          >
            {filterPanel}
          </Floating>
        )}
    </div>
  );
}

interface DataRowProps<T> {
  row: T;
  rowId: string;
  /** aria-rowindex, when rows are windowed */
  index?: number;
  cols: DataColumn<T>[];
  selectable: boolean;
  on: boolean;
  current: boolean;
  pad: string;
  /** One line per row, cut off with an ellipsis */
  fit: boolean;
  /** The empty cell under the filler column of a fixed layout */
  filler: boolean;
  rowHref?: (row: T) => string;
  onRowClick?: (row: T) => void;
  linkAs?: LinkComponent;
  onToggle: (key: string, shift: boolean) => void;
  onRowMouse?: (e: ReactMouseEvent<HTMLTableRowElement>, row: T) => void;
}

const TARGET_LOOK = cn(
  "text-left text-foreground underline decoration-border underline-offset-2 visited:text-foreground hover:decoration-current",
  FOCUS_RING,
);

/**
 * One body row. Memoized: sorting reorders rows without drawing them again, and a resize, a
 * selection or a filter popover redraws only what changed.
 */
function DataRowImpl<T>({ row: r, rowId, index, cols, selectable, on, current, pad, fit, filler, rowHref, onRowClick, linkAs, onToggle, onRowMouse }: DataRowProps<T>) {
  const RowLink = linkAs ?? "a";
  const clickable = onRowMouse != null;
  const cell = (c: DataColumn<T>) => (c.render ? c.render(r) : formatCell(c, r));
  const target = (content: ReactNode) =>
    rowHref ? (
      <RowLink href={rowHref(r)} onClick={() => onRowClick?.(r)} className={TARGET_LOOK}>
        {content}
      </RowLink>
    ) : (
      <button type="button" onClick={() => onRowClick?.(r)} className={cn("cursor-pointer", TARGET_LOOK)}>
        {content}
      </button>
    );
  return (
    <tr
      data-row
      aria-rowindex={index}
      aria-current={current || undefined}
      className={cn(on || current ? "bg-accent" : "hover:bg-muted", clickable && "cursor-pointer")}
      onClick={onRowMouse ? (e) => onRowMouse(e, r) : undefined}
    >
      {selectable && (
        <td className={cn(TD, pad, "w-0")}>
          <CheckboxBox
            checked={on}
            onChange={(e) => onToggle(rowId, (e.nativeEvent as MouseEvent).shiftKey)}
            aria-label={`Select ${cols[0] ? formatCell(cols[0], r) : rowId}`}
            className="mt-0.5 grid"
          />
        </td>
      )}
      {cols.map((c, ci) => (
        <td
          key={c.key}
          data-col={c.key}
          className={cn(TD, pad, c.type === "number" && "text-right tabular-nums", c.className, fit && "overflow-hidden text-ellipsis whitespace-nowrap")}
        >
          {ci === 0 && clickable ? target(cell(c)) : cell(c)}
        </td>
      ))}
      {filler && <td aria-hidden className="border-b border-border p-0" />}
    </tr>
  );
}

const DataRow = memo(DataRowImpl) as typeof DataRowImpl;

/** An active filter in the toolbar: click it to edit, × to remove. */
function FilterChip<T>({
  column: c,
  filter,
  labelOf,
  open,
  onPress,
  onEdit,
  onRemove,
}: {
  column: DataColumn<T>;
  filter: ColumnFilter;
  labelOf?: (key: string) => string;
  open: boolean;
  onPress: () => void;
  onEdit: (el: HTMLElement) => void;
  onRemove: () => void;
}) {
  const words = describeFilter(filter, c, labelOf);
  const values = normalizeFilter(filter)?.kind === "values";
  const text = `${c.header}${values ? ":" : ""} ${words}`;
  return (
    <span data-slot="filter-chip" className="inline-flex h-(--ctl-h) max-w-full items-stretch border border-border bg-background text-(length:--ctl-text) leading-none">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`${text}. Click to change.`}
        onPointerDown={onPress}
        onClick={(e) => onEdit(e.currentTarget)}
        className={cn("flex min-w-0 cursor-pointer items-center gap-1 pl-(--ctl-inset) hover:bg-secondary focus-visible:-outline-offset-2 [&_svg]:size-(--ctl-icon)", FOCUS_RING)}
      >
        <Icon icon={Funnel} className="text-muted-foreground" />
        <span className="max-w-[22rem] truncate whitespace-nowrap">
          <b className="font-semibold">
            {c.header}
            {values ? ":" : ""}
          </b>{" "}
          {words}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remove filter: ${text}`}
        title="Remove this filter"
        onClick={onRemove}
        className={cn("flex w-(--ctl-h) shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground focus-visible:-outline-offset-2 [&_svg]:size-(--ctl-icon)", FOCUS_RING)}
      >
        <Icon icon={X} />
      </button>
    </span>
  );
}

/** "Sorted by: Customer ↑ · Total ↓ · then by [column]". The keyboard and touch route to multi-column sort. */
function SortBar<T>({ columns, sort, onSort }: { columns: DataColumn<T>[]; sort: SortKey[]; onSort: (s: SortKey[]) => void }) {
  const unused = columns.filter((c) => !sort.some((s) => s.key === c.key));
  const header = (k: string) => columns.find((c) => c.key === k)?.header ?? k;
  const move = (i: number, d: -1 | 1) => {
    const next = [...sort];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onSort(next);
  };
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-muted-foreground">Sorted by:</span>
      {sort.length === 0 && <span className="text-muted-foreground">nothing (click a header; shift-click to add more)</span>}
      <ol className="contents">
        {sort.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1 whitespace-nowrap">
            {sort.length > 1 && <span className="text-muted-foreground tabular-nums">{i + 1}.</span>}
            <ButtonGroup label={`Sort level ${i + 1}: ${header(s.key)}`}>
              <Button
                iconEnd={s.dir === "asc" ? ArrowUp : ArrowDown}
                onClick={() => onSort(sort.map((x, j) => (j === i ? { ...x, dir: x.dir === "asc" ? "desc" : "asc" } : x)))}
                aria-label={`${header(s.key)}, ${s.dir === "asc" ? "ascending" : "descending"}. Flip direction.`}
              >
                {header(s.key)}
              </Button>
              {sort.length > 1 && (
                <>
                  <IconButton icon={ArrowLeft} label={`Move ${header(s.key)} earlier`} onClick={() => move(i, -1)} disabled={i === 0} />
                  <IconButton icon={ArrowRight} label={`Move ${header(s.key)} later`} onClick={() => move(i, 1)} disabled={i === sort.length - 1} />
                </>
              )}
              <IconButton icon={X} label={`Stop sorting by ${header(s.key)}`} onClick={() => onSort(sort.filter((_, j) => j !== i))} />
            </ButtonGroup>
          </li>
        ))}
      </ol>
      {unused.length > 0 && (
        <label className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{sort.length ? "then by" : "add"}</span>
          <Select
            value=""
            placeholder="Column…"
            onChange={(e) => e.target.value && onSort([...sort, { key: e.target.value, dir: "asc" }])}
            options={unused.map((c) => ({ value: c.key, label: c.header }))}
          />
        </label>
      )}
      {sort.length === 1 && <span className="text-muted-foreground max-sm:hidden">or shift-click another header</span>}
      {sort.length > 0 && (
        <Button variant="link" onClick={() => onSort([])}>
          Clear sort
        </Button>
      )}
    </div>
  );
}

function ColumnPicker<T>({
  columns,
  order,
  hidden,
  onOrder,
  onHidden,
  onReset,
  onResetWidths,
  widthsChanged,
}: {
  columns: DataColumn<T>[];
  order: string[];
  hidden: Set<string>;
  onOrder: (o: string[]) => void;
  onHidden: (h: Set<string>) => void;
  onReset: () => void;
  onResetWidths?: () => void;
  widthsChanged: boolean;
}) {
  const header = (k: string) => columns.find((c) => c.key === k)?.header ?? k;
  const move = (i: number, d: -1 | 1) => {
    const next = [...order];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onOrder(next);
  };
  return (
    <div className="flex flex-col gap-1">
      <ul>
        {order.map((k, i) => (
          <li key={k} className="flex items-center gap-0.5">
            <Checkbox
              label={header(k)}
              className="grow pr-3 whitespace-nowrap"
              checked={!hidden.has(k)}
              onChange={(e) => {
                const next = new Set(hidden);
                if (e.target.checked) next.delete(k);
                else next.add(k);
                onHidden(next);
              }}
            />
            <IconButton variant="ghost" icon={ArrowUp} label={`Move ${header(k)} left`} onClick={() => move(i, -1)} disabled={i === 0} />
            <IconButton variant="ghost" icon={ArrowDown} label={`Move ${header(k)} right`} onClick={() => move(i, 1)} disabled={i === order.length - 1} />
          </li>
        ))}
      </ul>
      <span className="flex flex-wrap gap-1">
        <Button onClick={onReset}>Reset columns</Button>
        {onResetWidths && (
          <Button onClick={onResetWidths} disabled={!widthsChanged} title="Back to the widths the columns started with">
            Reset widths
          </Button>
        )}
      </span>
    </div>
  );
}

/** The Export menu: says what will be exported, then copy, Excel and CSV */
function ExportPanel({
  formats,
  selectedCount,
  hiddenSelected,
  viewCount,
  totalCount,
  sorted,
  columnCount,
  allColumns,
  scope,
  onScope,
  onCopy,
  onXlsx,
  onCsv,
}: {
  formats: ExportFormat[];
  selectedCount: number;
  hiddenSelected: number;
  viewCount: number;
  totalCount: number;
  sorted: boolean;
  columnCount: number;
  allColumns: number;
  scope: "selected" | "view";
  onScope: (s: "selected" | "view") => void;
  onCopy: () => Promise<void>;
  onXlsx: () => void;
  onCsv: () => void;
}) {
  const n = (x: number) => x.toLocaleString("en-US");
  const rowsWord = (x: number) => `${n(x)} ${x === 1 ? "row" : "rows"}`;
  const view = `${viewCount === totalCount ? `All ${rowsWord(viewCount)}` : `The ${rowsWord(viewCount)} the filters leave`}${sorted ? ", in the sorted order" : ""}`;
  return (
    <div className="flex flex-col gap-2 text-[13px]">
      {selectedCount > 0 ? (
        <RadioGroup
          bare
          legend="Export"
          value={scope}
          onChange={onScope}
          options={[
            {
              value: "selected",
              label: `Only the ${rowsWord(selectedCount)} selected`,
              description: hiddenSelected > 0 ? `${n(hiddenSelected)} of them hidden by the filters` : undefined,
            },
            { value: "view", label: view },
          ]}
        />
      ) : (
        <p>
          <b>Exports {view.charAt(0).toLowerCase() + view.slice(1)}</b>
        </p>
      )}
      <p className="text-muted-foreground">
        {columnCount === allColumns ? `All ${columnCount} columns` : `The ${columnCount} visible columns (of ${allColumns})`}, in the table’s order.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {formats.includes("copy") && <CopyButton label="Copy" text={onCopy} title="Tab-separated text and a table, for pasting into a spreadsheet" />}
        {formats.includes("xlsx") && (
          <Button icon={FileSpreadsheet} onClick={onXlsx}>
            Excel (.xlsx)
          </Button>
        )}
        {formats.includes("csv") && (
          <Button icon={FileText} onClick={onCsv}>
            CSV
          </Button>
        )}
      </div>
    </div>
  );
}

/** Puts plain text and HTML on the clipboard: spreadsheets paste the HTML as cells, text editors take the text. */
async function copyTable(text: string, html: string) {
  if (navigator.clipboard && window.isSecureContext) {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "text/plain": new Blob([text], { type: "text/plain" }), "text/html": new Blob([html], { type: "text/html" }) }),
        ]);
        return;
      } catch {
        // Some browsers refuse text/html; the text alone still pastes as cells.
      }
    }
    return navigator.clipboard.writeText(text);
  }
  // Plain-http origins have no Clipboard API: fill in the copy event of an old-style copy instead.
  let done = false;
  const onCopy = (e: ClipboardEvent) => {
    e.clipboardData?.setData("text/plain", text);
    e.clipboardData?.setData("text/html", html);
    e.preventDefault();
    done = true;
  };
  document.addEventListener("copy", onCopy, { once: true });
  const ok = document.execCommand("copy");
  document.removeEventListener("copy", onCopy);
  if (!ok || !done) throw new Error("copy failed");
}

/** Like CopyButton, but the work happens on click: a whole table is too big for a prop. */
function CopyButton({ label, text, title }: { label: string; text: () => Promise<void>; title?: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const word = state === "done" ? "Copied" : state === "fail" ? "Couldn't copy" : label;
  return (
    <>
      <Button
        icon={state === "done" ? Check : state === "fail" ? X : Copy}
        title={title}
        className={cn(state === "done" && "text-success", state === "fail" && "text-destructive")}
        onClick={() =>
          text()
            .then(
              () => setState("done"),
              () => setState("fail"),
            )
            .finally(() => {
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setState("idle"), 1500);
            })
        }
      >
        {/* The widest word holds the width, so nothing shifts while it says "Copied" */}
        <span className="inline-grid">
          <span className="invisible col-start-1 row-start-1">{label}</span>
          <span className="invisible col-start-1 row-start-1">Copied</span>
          <span className="col-start-1 row-start-1">{word}</span>
        </span>
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === "idle" ? "" : word}
      </span>
    </>
  );
}

/** Keep the resize cursor and stop text selection while a column edge is dragged, wherever the pointer goes */
function dragCursor(on: boolean) {
  const s = document.documentElement.style;
  if (on) {
    s.cursor = "col-resize";
    s.userSelect = "none";
  } else {
    s.removeProperty("cursor");
    s.removeProperty("user-select");
  }
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// The byte-order mark makes Excel read a CSV as UTF-8
const downloadText = (name: string, text: string) => downloadBlob(name, new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }));
const downloadBytes = (name: string, bytes: Uint8Array, type: string) => downloadBlob(name, new Blob([bytes as BlobPart], { type }));

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table";
