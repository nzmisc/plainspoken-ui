"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
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
  Search,
  X,
} from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import {
  applyFilters,
  applySort,
  describeFilter,
  emptyFilter,
  formatCell,
  isFilterActive,
  nextSort,
  regexError,
  toDelimited,
  type ColumnFilter,
  type DataColumn,
  type Filters,
  type SortKey,
} from "@/registry/plainspoken/lib/data-table";
import { Button, ButtonGroup, IconButton } from "@/registry/plainspoken/ui/button";
import { Checkbox, CheckboxBox } from "@/registry/plainspoken/ui/checkbox";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { MenuButton } from "@/registry/plainspoken/ui/menu-button";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

export type { CellValue, ColumnFilter, ColumnType, DataColumn, Filters, SortDir, SortKey } from "@/registry/plainspoken/lib/data-table";

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  /** A stable, unique key per row (an id), for selection and React */
  rowKey: (row: T) => string;
  /** Accessible name of the table, and the name of the downloaded CSV */
  label: string;
  initialSort?: SortKey[];
  initialFilters?: Filters;
  initialQuick?: string;
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
  /** Height of the scroll box; the header row sticks to its top. "none" lets the table grow. */
  maxHeight?: string;
  initialDensity?: "compact" | "comfortable";
  /** Start with the row of per-column filters shown */
  initialShowFilters?: boolean;
  /** The "filter all columns" box. Default on. */
  quickFilter?: boolean;
  /** Per-column filters, and the toggle that shows them. Default on. */
  columnFilters?: boolean;
  /** The menu to show, hide and reorder columns. Default on. */
  columnPicker?: boolean;
  /** The compact / comfortable rows choice. Default on. */
  densityToggle?: boolean;
  /** "Copy TSV" and "Download CSV". Default on. */
  exportable?: boolean;
  /** The "Sorted by" line, which is how keyboard and touch users sort by several columns. Default on. */
  sortBar?: boolean;
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
  /** Draws the rowHref links: with Next.js, `NextLink` from `@/lib/next-link`. Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

const TH = "border-r border-b border-border bg-muted p-0 text-left align-bottom font-semibold whitespace-nowrap last:border-r-0";
const TD = "border-r border-b border-border px-2 align-top last:border-r-0";

/**
 * A table for working with a few hundred rows in the browser: a quick filter over every visible
 * column, a filter per column (text or regular expression, values to tick, number min/max, date
 * range), sorting by several columns, a column picker that also reorders, row selection, paging,
 * two row densities, and CSV/TSV export. Every part of the chrome can be switched off, down to a
 * plain sortable table.
 *
 * Sorting: click a header to sort by it alone (ascending, descending, off). Shift-click adds it as
 * the next sort key. Without a mouse, the "Sorted by" line does the same: add a key, flip it, move
 * it earlier or later, remove it. All state lives in React; nothing is written to the URL.
 *
 * Clickable rows (`rowHref`, `onRowClick`) stay a plain table: the first cell holds a real link or
 * button, which is what the keyboard and screen readers use; the rest of the row is a bigger target
 * for the mouse, and clicks on the row's own controls (checkbox, links, buttons) are left alone.
 *
 * The toolbar and paging controls are sm (24px) and the filter row xs (20px), from the height scale.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  label,
  initialSort = [],
  initialFilters = {},
  initialQuick = "",
  pageSizes = [25, 50, 100, 0],
  initialPageSize = pageSizes[0],
  selectable = false,
  selected: selectedProp,
  onSelectionChange,
  selectionActions,
  maxHeight = "28rem",
  initialDensity = "compact",
  initialShowFilters = true,
  quickFilter = true,
  columnFilters = true,
  columnPicker = true,
  densityToggle = true,
  exportable = true,
  sortBar = true,
  actions,
  empty,
  rowHref,
  onRowClick,
  linkAs,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortKey[]>(initialSort);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [quick, setQuick] = useState(initialQuick);
  const [order, setOrder] = useState(() => columns.map((c) => c.key));
  const [hidden, setHidden] = useState(() => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)));
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(0);
  const [ownSelected, setOwnSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [density, setDensity] = useState(initialDensity);
  const [showFilters, setShowFilters] = useState(initialShowFilters);
  const anchor = useRef<string | null>(null);

  const byKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  // Columns added after the first render go at the end, so a changing column list keeps working.
  const fullOrder = useMemo(() => [...order.filter((k) => byKey.has(k)), ...columns.map((c) => c.key).filter((k) => !order.includes(k))], [order, byKey, columns]);
  const visibleCols = useMemo(() => fullOrder.map((k) => byKey.get(k)!).filter((c) => !hidden.has(c.key)), [fullOrder, byKey, hidden]);
  const visibleSet = useMemo(() => new Set(visibleCols.map((c) => c.key)), [visibleCols]);

  const filtered = useMemo(() => applyFilters(rows, columns, filters, quick, visibleSet), [rows, columns, filters, quick, visibleSet]);
  const sorted = useMemo(() => applySort(filtered, columns, sort), [filtered, columns, sort]);

  const size = pageSize === 0 ? Math.max(1, sorted.length) : pageSize;
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const p = Math.min(page, pages - 1);
  const pageRows = sorted.slice(p * size, p * size + size);

  // Any change to what matches starts again from page 1.
  const changeSort = (next: SortKey[] | ((cur: SortKey[]) => SortKey[])) => {
    setSort(next);
    setPage(0);
  };
  const setFilter = (key: string, f: ColumnFilter) => {
    setFilters((fs) => ({ ...fs, [key]: f }));
    setPage(0);
  };
  const clearFilters = () => {
    setFilters({});
    setQuick("");
    setPage(0);
  };
  const activeFilters = columnFilters ? columns.filter((c) => isFilterActive(filters[c.key])) : [];

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
  const selectedRows = () => rows.filter((r) => selected.has(rowKey(r)));
  const exportRows = (which: T[], sep: "," | "\t") => toDelimited(which, visibleCols, sep);

  const sortIndex = (key: string) => sort.findIndex((s) => s.key === key);
  const pad = density === "comfortable" ? "py-1.5" : "py-0.5";
  const filtersShown = columnFilters && showFilters;
  const colCount = visibleCols.length + (selectable ? 1 : 0);

  // Clickable rows: the first cell's link or button is the real target; the row passes clicks on.
  const clickable = rowHref != null || onRowClick != null;
  const RowLink = linkAs ?? "a";
  const targetLook = cn(
    "text-left text-foreground underline decoration-border underline-offset-2 visited:text-foreground hover:decoration-current",
    FOCUS_RING,
  );
  const rowTarget = (r: T, content: ReactNode) =>
    rowHref ? (
      <RowLink href={rowHref(r)} onClick={() => onRowClick?.(r)} className={targetLook}>
        {content}
      </RowLink>
    ) : (
      <button type="button" onClick={() => onRowClick?.(r)} className={cn("cursor-pointer", targetLook)}>
        {content}
      </button>
    );
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
  const toolbar = quickFilter || columnFilters || columnPicker || densityToggle || exportable || actions != null;

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
          {columnFilters && (
            <Chip pressed={showFilters} onPressedChange={setShowFilters}>
              Column filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
            </Chip>
          )}
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
          {(exportable || actions != null) && (
            <span className="flex flex-wrap gap-1.5 sm:ml-auto">
              {exportable && (
                <>
                  <ExportButton label="Copy TSV" text={() => exportRows(sorted, "\t")} />
                  <Button icon={Download} onClick={() => download(`${slug(label)}.csv`, exportRows(sorted, ","))}>
                    Download CSV
                  </Button>
                </>
              )}
              {actions}
            </span>
          )}
        </div>
      )}

      {sortBar && <SortBar columns={columns.filter((c) => c.sortable !== false)} sort={sort} onSort={changeSort} />}
      {(activeFilters.length > 0 || quick) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground">Filtered by:</span>
          {quick && (
            <span>
              any column contains <q>{quick}</q>
            </span>
          )}
          {activeFilters.map((c) => (
            <Chip key={c.key} name={`${c.header} filter`} onRemove={() => setFilter(c.key, emptyFilter(c.type))}>
              <b className="mr-1">{c.header}</b>
              {describeFilter(filters[c.key]!)}
            </Chip>
          ))}
          <Button variant="link" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <b>{selected.size} selected</b>
          {selected.size > selectedInView && <span className="text-muted-foreground">({selected.size - selectedInView} hidden by filters)</span>}
          {selectionActions?.(selectedRows())}
          {exportable && <ExportButton label="Copy selected as TSV" text={() => exportRows(selectedRows(), "\t")} />}
          <Button onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
      )}

      <div className="max-w-full overflow-auto border border-border" style={{ maxHeight }}>
        <table aria-label={label} className="min-w-full border-separate border-spacing-0 text-[14px] leading-5">
          <thead className="sticky top-0 z-10">
            <tr>
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
                if (c.sortable === false)
                  return (
                    <th key={c.key} scope="col" className={cn(TH, "px-2 py-0.5")}>
                      {c.header}
                    </th>
                  );
                return (
                  <th key={c.key} scope="col" aria-sort={s ? (s.dir === "asc" ? "ascending" : "descending") : undefined} className={TH}>
                    <button
                      type="button"
                      onClick={(e) => changeSort((cur) => nextSort(cur, c.key, e.shiftKey))}
                      title="Sort by this column. Shift-click to add it as another sort key."
                      className={cn(
                        "flex w-full cursor-pointer items-baseline gap-1 px-2 py-0.5 text-left font-semibold hover:bg-accent focus-visible:-outline-offset-2",
                        FOCUS_RING,
                      )}
                    >
                      {c.header}
                      {s && (
                        <span className="inline-flex items-baseline font-normal">
                          <Icon icon={s.dir === "asc" ? ArrowUp : ArrowDown} size="1em" />
                          {sort.length > 1 && <sup className="text-[10px] tabular-nums">{i + 1}</sup>}
                          <span className="sr-only">
                            {s.dir === "asc" ? "ascending" : "descending"}
                            {sort.length > 1 ? `, sort key ${i + 1} of ${sort.length}` : ""}
                          </span>
                        </span>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
            {filtersShown && (
              <tr className="ctl-xs">
                {selectable && <td className="border-r border-b border-border bg-background" />}
                {visibleCols.map((c) => (
                  <td key={c.key} className="border-r border-b border-border bg-background px-1 py-0.5 align-top font-normal last:border-r-0">
                    {c.filterable === false ? null : (
                      <FilterControl column={c} rows={rows} filter={filters[c.key] ?? emptyFilter(c.type)} onChange={(f) => setFilter(c.key, f)} />
                    )}
                  </td>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {pageRows.map((r) => {
              const k = rowKey(r);
              const on = selected.has(k);
              return (
                <tr key={k} className={cn(on ? "bg-accent" : "hover:bg-muted", clickable && "cursor-pointer")} onClick={clickable ? (e) => onRowMouse(e, r) : undefined}>
                  {selectable && (
                    <td className={cn(TD, pad, "w-0")}>
                      <CheckboxBox
                        checked={on}
                        onChange={(e) => toggleRow(k, (e.nativeEvent as MouseEvent).shiftKey)}
                        aria-label={`Select ${formatCell(visibleCols[0] ?? columns[0], r)}`}
                        className="mt-0.5 grid"
                      />
                    </td>
                  )}
                  {visibleCols.map((c, ci) => (
                    <td key={c.key} className={cn(TD, pad, c.type === "number" && "text-right tabular-nums", c.className)}>
                      {ci === 0 && clickable ? rowTarget(r, c.render ? c.render(r) : formatCell(c, r)) : c.render ? c.render(r) : formatCell(c, r)}
                    </td>
                  ))}
                </tr>
              );
            })}
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
    </div>
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
            <ButtonGroup label={`Sort key ${header(s.key)}`}>
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
}: {
  columns: DataColumn<T>[];
  order: string[];
  hidden: Set<string>;
  onOrder: (o: string[]) => void;
  onHidden: (h: Set<string>) => void;
  onReset: () => void;
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
      <Button onClick={onReset} className="self-start">
        Reset columns
      </Button>
    </div>
  );
}

function FilterControl<T>({ column: c, rows, filter: f, onChange }: { column: DataColumn<T>; rows: T[]; filter: ColumnFilter; onChange: (f: ColumnFilter) => void }) {
  const name = c.header;
  switch (f.kind) {
    case "text": {
      const err = regexError(f);
      return (
        <span className="flex items-center [&>*+*]:-ml-px">
          <Input
            type="search"
            value={f.q}
            onChange={(e) => onChange({ ...f, q: e.target.value })}
            placeholder={f.regex ? "regex" : "contains"}
            aria-label={`Filter ${name}${f.regex ? " by regular expression" : ""}`}
            invalid={!!err}
            title={err ?? undefined}
            className={cn("w-full min-w-20", err && "text-destructive")}
            inputClassName={cn(f.regex && "font-mono")}
          />
          <Button
            variant={f.regex ? "primary" : "default"}
            aria-pressed={f.regex}
            onClick={() => onChange({ ...f, regex: !f.regex })}
            title="Regular expression (case-insensitive)"
            aria-label={`${name}: regular expression`}
            className="font-mono"
          >
            .*
          </Button>
        </span>
      );
    }
    case "enum": {
      const opts = c.options ?? [...new Set(rows.map((r) => String(c.value(r) ?? "")))].sort((a, b) => a.localeCompare(b));
      const n = f.values.length;
      return (
        <MenuButton
          label={
            <>
              <span className="sr-only">{name} filter: </span>
              {n === 0 ? "all" : n === 1 ? f.values[0] : `${n} of ${opts.length}`}
            </>
          }
          active={n > 0}
          className="w-full justify-between"
          panelClassName="ctl-sm"
        >
          <fieldset className="flex flex-col">
            <legend className="sr-only">Show only these {name} values</legend>
            {opts.map((o) => (
              <Checkbox
                key={o}
                className="pr-3 whitespace-nowrap"
                label={o === "" ? <span className="text-muted-foreground">(empty)</span> : o}
                checked={f.values.includes(o)}
                onChange={(e) => onChange({ ...f, values: e.target.checked ? [...f.values, o] : f.values.filter((v) => v !== o) })}
              />
            ))}
          </fieldset>
          <span className="mt-1.5 flex gap-1">
            <Button onClick={() => onChange({ ...f, values: opts })}>All</Button>
            <Button onClick={() => onChange({ ...f, values: [] })}>Clear</Button>
          </span>
        </MenuButton>
      );
    }
    case "number":
      return (
        <span className="flex items-center gap-0.5">
          <Input type="number" value={f.min} onChange={(e) => onChange({ ...f, min: e.target.value })} placeholder="min" aria-label={`${name} at least`} className="w-16" />
          <span className="text-muted-foreground" aria-hidden>
            –
          </span>
          <Input type="number" value={f.max} onChange={(e) => onChange({ ...f, max: e.target.value })} placeholder="max" aria-label={`${name} at most`} className="w-16" />
        </span>
      );
    case "date":
      return (
        <span className="flex flex-col gap-0.5">
          <Input type="date" value={f.from} onChange={(e) => onChange({ ...f, from: e.target.value })} aria-label={`${name} from`} />
          <Input type="date" value={f.to} onChange={(e) => onChange({ ...f, to: e.target.value })} aria-label={`${name} to`} />
        </span>
      );
  }
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  // Fallback for plain-http origins, where the Clipboard API is missing
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("copy failed");
}

/** Like CopyButton, but the text is only worked out when clicked: a whole table as TSV is too big for a prop. */
function ExportButton({ label, text }: { label: string; text: () => string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const word = state === "done" ? "Copied" : state === "fail" ? "Couldn't copy" : label;
  return (
    <>
      <Button
        icon={state === "done" ? Check : state === "fail" ? X : Copy}
        className={cn(state === "done" && "text-success", state === "fail" && "text-destructive")}
        onClick={() =>
          copyText(text())
            .then(
              () => setState("done"),
              () => setState("fail"),
            )
            .finally(() => {
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setState("idle"), 1200);
            })
        }
      >
        {/* The widest word holds the width, so the toolbar doesn't shift while it says "Copied" */}
        <span className="inline-grid">
          <span className="invisible col-start-1 row-start-1">{label}</span>
          <span className="col-start-1 row-start-1">{word}</span>
        </span>
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === "idle" ? "" : word}
      </span>
    </>
  );
}

function download(name: string, text: string) {
  // The byte-order mark makes Excel read the file as UTF-8
  const url = URL.createObjectURL(new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table";
