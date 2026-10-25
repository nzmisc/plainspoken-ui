"use client";

import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowDownToLine,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  CircleAlert,
  ClipboardPaste,
  Copy,
  CopyPlus,
  EllipsisVertical,
  Eraser,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Trash,
  Undo2,
} from "@/registry/plainspoken/lib/icons";
import { CONTROL_HEIGHT, controlSize } from "@/registry/plainspoken/lib/controls";
import { useElementWidth } from "@/registry/plainspoken/hooks/use-element-width";
import {
  cellChanged,
  cellError,
  cellValue,
  collectErrors,
  columnOptions,
  columnTotal,
  columnType,
  columnWidth,
  describeChanges,
  diffRows,
  editText,
  emptyValue,
  formatCell,
  formatTotal,
  isEditableColumn,
  isNumeric,
  keptText,
  parseCell,
  parseTSV,
  rawFor,
  toTSV,
  withValue,
  type EditableColumn,
  type Parsed,
  type RawInput,
  type TableChanges,
} from "@/registry/plainspoken/lib/editable-table";
import { Button, ButtonGroup, IconButton } from "@/registry/plainspoken/ui/button";
import { CheckboxBox } from "@/registry/plainspoken/ui/checkbox";
import { ContextMenu, type MenuItem } from "@/registry/plainspoken/ui/context-menu";
import { DatePicker } from "@/registry/plainspoken/ui/date-picker";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Select } from "@/registry/plainspoken/ui/select";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";
import { cn } from "@/lib/utils";

export type { CellChange, CellValue, ColumnOption, ColumnType, EditableColumn, TableChanges } from "@/registry/plainspoken/lib/editable-table";

/** Why the rows changed, as passed to onChange */
export type TableChangeKind = "edit" | "paste" | "cut" | "clear" | "fill" | "insert" | "duplicate" | "delete" | "undo" | "redo" | "discard";

export interface TableChange {
  kind: TableChangeKind;
  /** What happened, in words: "Paste 12 cells", "Delete row 3" (also what Undo says) */
  label: string;
}

export type EditableTableSize = "sm" | "md" | "lg";

export interface EditableTableProps<T> {
  columns: EditableColumn<T>[];
  /** The rows, controlled: pair with onChange. Leave out (and use defaultValue) to let the table keep them. */
  value?: T[];
  defaultValue?: T[];
  /**
   * Called with the whole new array after every change: an edit, a paste, a cleared range, fill
   * down, a row added, duplicated or deleted, undo, redo and discard. Rows that didn't change are
   * the same objects as before, so memoised rows elsewhere stay put.
   */
  onChange?: (rows: T[], change: TableChange) => void;
  /** A stable, unique key per row (an id) */
  rowKey: (row: T) => string;
  /**
   * Makes a new row, with a new key. With it, rows can be added, inserted and duplicated (given a
   * row, return a copy of it), and a paste that runs past the last row adds rows.
   */
  newRow?: (copyOf?: T) => T;
  /**
   * The saved version, which edited cells are marked against and changes counted from. Leave it
   * out and the table keeps its own: the rows it started with, then whatever was last saved.
   */
  baseline?: T[];
  /**
   * Shows the save bar: the number of changes, Discard and Save. Called with the rows and what
   * changed; return a promise to show Save as busy until it settles (a rejection keeps the changes).
   * Save with errors in the table moves to the first one instead.
   */
  onSave?: (rows: T[], changes: TableChanges<T>) => void | Promise<unknown>;
  /** Mark edited cells and count changes. Default: on when there is onSave or a baseline. */
  trackChanges?: boolean;
  /** Accessible name of the grid: "Budget 2027" */
  label: string;
  /** Row height from the control scale: sm 24px (default), md 28px, lg 36px for touch screens */
  size?: EditableTableSize;
  /** Nothing can be edited; cells can still be selected and copied */
  readOnly?: boolean;
  /**
   * How many columns (after the row numbers) stay in view when the table scrolls sideways. Default
   * 1. In a box so narrow that they would take half of it (a phone), only the row numbers stay.
   */
  stickyColumns?: number;
  /** A totals row under the body, from each column's `total`. Its label goes in the first column without a total. */
  totals?: boolean;
  totalsLabel?: string;
  /** Key of the column that names a row ("Line item"): screen readers say it when moving up and down */
  rowHeader?: string;
  /** Enter in the last row adds a row (needs newRow) */
  addRowOnEnter?: boolean;
  /** Height of the scroll box; the header and totals rows stick to its edges. Default 32rem. */
  maxHeight?: string;
  /** For numbers and the order of day and month in typed dates. Default en-US, so the server and browser agree. */
  locale?: string;
  /** The bar above the table: Add row, Undo, Redo, your `actions`, and what just happened. Default on. */
  toolbar?: boolean;
  /** More controls in the toolbar */
  actions?: ReactNode;
  /** The line of keyboard hints under the table. Default on. */
  hint?: boolean;
  /** What the body says when there are no rows */
  empty?: ReactNode;
  className?: string;
}

interface Pos {
  r: number;
  c: number;
}
interface Rect {
  r0: number;
  r1: number;
  c0: number;
  c1: number;
}
/** The focused cell, the corner a range was started from, and a range set outright (a whole row or column) */
interface Selection {
  active: Pos;
  anchor: Pos;
  rect?: Rect;
}
interface Snapshot<T> {
  rows: T[];
  raw: RawInput;
}
interface HistoryEntry<T> {
  before: Snapshot<T>;
  after: Snapshot<T>;
  selBefore: Selection;
  selAfter: Selection;
  label: string;
}
interface Editing {
  r: number;
  c: number;
  /** The editor's starting text */
  text: string;
  /** replace: started by typing, so the arrow keys commit and move. edit: Enter, F2 or a double click; arrows move the caret. */
  mode: "replace" | "edit";
  /** Open the select's list or the date's calendar at once */
  openList: boolean;
  id: number;
}

interface ColLayout {
  width: number;
  /** Sticky offset from the left, for the columns that stay in view */
  left?: number;
}

/** What the rows call back into; read through a ref so memoised rows don't re-render for it */
interface TableApi {
  /** A click on a yes/no box (Space was already handled on keydown) */
  clickToggle: (r: number, c: number, fromKeyboard: boolean) => void;
  /** Commit the open editor, keeping focus on its cell */
  commitEdit: () => void;
  openRowMenu: (button: HTMLElement) => void;
}

const ROW_HEAD_W = 48;
const HISTORY_LIMIT = 200;

/** Every cell: its own right and bottom line (border-separate, so lines travel with sticky cells) */
const TD = "relative border-r border-b border-border p-0 align-middle";
/** The cell's content box: one line, exactly a control tall minus the bottom line */
const INNER = "flex h-[calc(var(--ctl-h)-1px)] min-w-0 items-center gap-1 overflow-hidden px-(--ctl-inset) whitespace-nowrap [&_svg]:size-(--ctl-icon)";
/**
 * Editors and the focus ring sit on the cell's four grid lines (one px up and left, one px wider
 * and taller than the cell's own box), so starting to edit moves nothing.
 */
const OVER = "absolute -top-px -left-px h-[calc(100%+1px)] w-[calc(100%+1px)]";
const RING = cn(OVER, "pointer-events-none z-[3] border-2 border-ring");
/**
 * A range is tinted and edged in the link colour, the blue of a spreadsheet's selection in the
 * default theme, mixed opaque so sticky cells still hide what scrolls under them
 */
const RANGE_BG = "bg-[color-mix(in_oklab,var(--color-link)_14%,var(--color-background))]";
const CHANGED_MARK = "pointer-events-none absolute top-0 left-0 z-[1] size-[7px] bg-primary [clip-path:polygon(0_0,100%_0,0_100%)]";

const samePos = (a: Pos, b: Pos) => a.r === b.r && a.c === b.c;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

function rangeOf(s: Selection): Rect {
  if (s.rect) return s.rect;
  return {
    r0: Math.min(s.active.r, s.anchor.r),
    r1: Math.max(s.active.r, s.anchor.r),
    c0: Math.min(s.active.c, s.anchor.c),
    c1: Math.max(s.active.c, s.anchor.c),
  };
}

function putRaw(raw: RawInput, rk: string, key: string, text: string | undefined): RawInput {
  if (raw[rk]?.[key] === text) return raw;
  const forRow: Record<string, string> = { ...raw[rk] };
  if (text === undefined) delete forRow[key];
  else forRow[key] = text;
  const out: Record<string, Readonly<Record<string, string>>> = { ...raw };
  if (Object.keys(forRow).length) out[rk] = forRow;
  else delete out[rk];
  return out;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * A spreadsheet-like table whose cells are edited in place, following the ARIA grid pattern: one
 * cell has focus at a time (it is the grid's only Tab stop) and the keyboard moves it.
 *
 * Moving: arrow keys; Home and End to the ends of the row; Ctrl+Home and Ctrl+End to the first
 * and last cell; Ctrl+arrow to the edge; PageUp and PageDown by a screenful. Tab and Shift+Tab
 * move along the row and leave the grid at its ends; after tabbing along a row, Enter goes to the
 * next row under where you started.
 *
 * Editing: typing replaces the cell's content; Enter, F2 or a double click edits it with the
 * content kept. Enter commits and moves down (Shift+Enter up), Tab commits and moves along,
 * Escape cancels, and leaving the cell (a click elsewhere) commits. When editing was started by
 * typing, the arrow keys commit and move too. Ctrl+Enter writes the entry into every cell of the
 * selected range. Delete or Backspace clears the cell or range. Yes/no cells toggle with Space,
 * Enter or a click. Long text opens a larger box over the cell, where Shift+Enter starts a new line.
 *
 * Ranges: Shift+arrows, Shift+click or a drag select a range; Shift+Space the row, Ctrl+Space the
 * column, Ctrl+A everything. Ctrl+C copies it as tab-separated text, Ctrl+X cuts, and Ctrl+V
 * pastes text from Excel, Numbers or Google Sheets from the range's top-left cell, parsing each
 * cell for its column (one copied cell fills the whole range). Ctrl+D fills the range down from
 * its top row. Ctrl+Z undoes, Ctrl+Shift+Z or Ctrl+Y redoes, across edits, pastes and row
 * changes. (⌘ instead of Ctrl on a Mac.)
 *
 * Rows: the toolbar's Add row; the row menu (right-click, Shift+F10, the Menu key, or the ⋯ by the
 * row number) inserts above or below, duplicates and deletes.
 *
 * A value that breaks a column's rules (required, min, max, pattern, validate), or text that
 * isn't of the column's type, stays in the cell, marked with a red edge and an icon, and its
 * message shows on hover and when the cell has focus; screen readers get it as the cell's
 * description. Edited cells get a small corner mark and "Changed, was …" against the baseline.
 * What happened ("Pasted 12 cells, 2 invalid", "Undone: Delete row 3") is said in the toolbar,
 * which is a live region.
 *
 * Columns have fixed widths and the editors exactly cover their cell. The table isn't
 * virtualised: it is meant for up to a few thousand cells. Keep `columns` stable (outside the
 * component or in useMemo), or every row redraws on every change.
 */
export function EditableTable<T>({
  columns,
  value,
  defaultValue,
  onChange,
  rowKey,
  newRow,
  baseline: baselineProp,
  onSave,
  trackChanges,
  label,
  size = "sm",
  readOnly = false,
  stickyColumns = 1,
  totals = false,
  totalsLabel = "Total",
  rowHeader,
  addRowOnEnter = false,
  maxHeight = "32rem",
  locale = "en-US",
  toolbar = true,
  actions,
  hint = true,
  empty = "No rows yet.",
  className,
}: EditableTableProps<T>) {
  const uid = useId();
  const [own, setOwn] = useState<T[]>(() => value ?? defaultValue ?? []);
  const rows = value ?? own;
  const [raw, setRaw] = useState<RawInput>({});
  const [ownBaseline, setOwnBaseline] = useState<T[]>(() => value ?? defaultValue ?? []);
  const baseline = baselineProp ?? ownBaseline;
  const tracking = trackChanges ?? (onSave != null || baselineProp != null);
  const [selState, setSel] = useState<Selection>({ active: { r: 0, c: 0 }, anchor: { r: 0, c: 0 } });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const [status, setStatus] = useState({ text: "", n: 0 });
  const [saving, setSaving] = useState(false);
  const [canHistory, setCanHistory] = useState({ undo: false, redo: false });

  const [rootRef, rootWidth] = useElementWidth<HTMLDivElement>();
  const boxRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  // Handlers read and write these, so several steps in one event see each other's results.
  const rowsRef = useRef(rows);
  const rawRef = useRef(raw);
  const selRef = useRef(selState);
  const editingRef = useRef<Editing | null>(null);
  const history = useRef<{ past: HistoryEntry<T>[]; future: HistoryEntry<T>[] }>({ past: [], future: [] });
  const pendingFocus = useRef(false);
  const tabStart = useRef<number | null>(null);
  const drag = useRef(false);
  const afterMenu = useRef(0);
  const copyPending = useRef<string | null>(null);
  const editId = useRef(0);
  const pointerType = useRef("mouse");
  const spaceAt = useRef(0);
  const api = useRef<TableApi | null>(null);

  const nCols = columns.length;
  const nRows = rows.length + (totals && rows.length ? 1 : 0);
  const cellH = CONTROL_HEIGHT[size];
  const rowHeaderIndex = rowHeader ? columns.findIndex((c) => c.key === rowHeader) : -1;

  // What is drawn: the selection kept inside the table when rows go away
  const lastR = Math.max(0, nRows - 1);
  const lastC = Math.max(0, nCols - 1);
  const keepIn = (p: Pos) => ({ r: clamp(p.r, 0, lastR), c: clamp(p.c, 0, lastC) });
  const sel: Selection = {
    active: keepIn(selState.active),
    anchor: keepIn(selState.anchor),
    rect: selState.rect && { r0: clamp(selState.rect.r0, 0, lastR), r1: clamp(selState.rect.r1, 0, lastR), c0: clamp(selState.rect.c0, 0, lastC), c1: clamp(selState.rect.c1, 0, lastC) },
  };
  const range = rangeOf(sel);
  const multi = range.r1 > range.r0 || range.c1 > range.c0;
  const shownEditing = editing && editing.r < rows.length ? editing : null;

  // Sticky columns that would take half of a narrow box (a phone) leave nothing to scroll: only the row numbers stick then.
  const wantSticky = ROW_HEAD_W + columns.slice(0, stickyColumns).reduce((a, c) => a + columnWidth(c), 0);
  const sticky = rootWidth > 0 && rootWidth < wantSticky * 2 ? 0 : stickyColumns;
  const layout = useMemo<ColLayout[]>(() => {
    let left = ROW_HEAD_W;
    return columns.map((c, i) => {
      const width = columnWidth(c);
      const out = { width, left: i < sticky ? left : undefined };
      left += width;
      return out;
    });
  }, [columns, sticky]);
  const tableWidth = ROW_HEAD_W + layout.reduce((a, l) => a + l.width, 0);
  const stickyWidth = ROW_HEAD_W + layout.filter((l) => l.left != null).reduce((a, l) => a + l.width, 0);

  const savedByKey = useMemo(() => new Map(baseline.map((r) => [rowKey(r), r])), [baseline, rowKey]);
  const changes = useMemo(() => diffRows(baseline, rows, columns, rowKey, raw), [baseline, rows, columns, rowKey, raw]);
  const errors = useMemo(() => collectErrors(rows, columns, raw, rowKey, locale), [rows, columns, raw, rowKey, locale]);

  useLayoutEffect(() => {
    rowsRef.current = rows;
    rawRef.current = raw;
    selRef.current = sel;
  });

  // ------------------------------------------------------------------------------------------
  // Focus and scrolling

  function cellEl(p: Pos) {
    return tableRef.current?.querySelector<HTMLElement>(`[data-cell="${p.r}:${p.c}"]`) ?? null;
  }

  /** Scroll the box so the cell isn't under the sticky header, columns or totals row */
  function ensureVisible(td: HTMLElement) {
    const box = boxRef.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    const c = td.getBoundingClientRect();
    const head = tableRef.current?.tHead?.offsetHeight ?? 0;
    const foot = tableRef.current?.tFoot?.offsetHeight ?? 0;
    const inFoot = !!td.closest("tfoot");
    const sticky = td.style.left !== "";
    const top = b.top + box.clientTop + head;
    const bottom = b.top + box.clientTop + box.clientHeight - (inFoot ? 0 : foot);
    const left = b.left + box.clientLeft + (sticky ? 0 : stickyWidth);
    const right = b.left + box.clientLeft + box.clientWidth;
    if (!inFoot) {
      if (c.top < top) box.scrollTop -= top - c.top;
      else if (c.bottom > bottom) box.scrollTop += c.bottom - bottom;
    }
    if (!sticky) {
      if (c.left < left) box.scrollLeft -= left - c.left;
      else if (c.right > right) box.scrollLeft += Math.min(c.right - right, c.left - left);
    }
    td.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function focusCell(p: Pos) {
    const td = cellEl(p);
    if (!td) return;
    const target = td.querySelector<HTMLElement>("[data-cell-focus]") ?? td;
    target.focus({ preventScroll: true });
    ensureVisible(td);
  }

  useLayoutEffect(() => {
    if (!pendingFocus.current || editingRef.current) return;
    pendingFocus.current = false;
    focusCell(selRef.current.active);
  });

  useEffect(() => {
    const up = () => {
      drag.current = false;
    };
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, []);

  function announce(text: string) {
    setStatus((s) => ({ text, n: s.n + 1 }));
  }

  const rowName = (r: number) => {
    const row = rowsRef.current[r];
    if (row && rowHeaderIndex >= 0) {
      const name = formatCell(columns[rowHeaderIndex], cellValue(columns[rowHeaderIndex], row), row, locale);
      if (name) return `row ${r + 1} (${name})`;
    }
    return `row ${r + 1}`;
  };

  // ------------------------------------------------------------------------------------------
  // Selection

  function select(active: Pos, anchor: Pos = active, focus = true, rect?: Rect) {
    const s = { active, anchor, rect };
    selRef.current = s;
    setSel(s);
    if (focus) pendingFocus.current = true;
  }

  /** Whole rows (r0 to r1) or a whole column, keeping focus where it is */
  function selectRows(r0: number, r1: number, active: Pos, anchor: Pos = active) {
    select(active, anchor, true, { r0: Math.min(r0, r1), r1: Math.max(r0, r1), c0: 0, c1: Math.max(0, nCols - 1) });
  }

  function moveTo(p: Pos, extend: boolean) {
    const last = { r: Math.max(0, nRows - 1), c: Math.max(0, nCols - 1) };
    const to = { r: clamp(p.r, 0, last.r), c: clamp(p.c, 0, last.c) };
    select(to, extend ? selRef.current.anchor : to);
  }

  const canEdit = (p: Pos) => !readOnly && p.r < rowsRef.current.length && p.c < nCols && isEditableColumn(columns[p.c]);

  function editableInRange() {
    const { r0, r1, c0, c1 } = rangeOf(selRef.current);
    const out: Pos[] = [];
    for (let r = r0; r <= Math.min(r1, rowsRef.current.length - 1); r++) for (let c = c0; c <= c1; c++) if (canEdit({ r, c })) out.push({ r, c });
    return out;
  }

  // ------------------------------------------------------------------------------------------
  // Changes and history

  function setSnapshot(next: T[], nextRaw: RawInput, change: TableChange) {
    rowsRef.current = next;
    rawRef.current = nextRaw;
    if (value === undefined) setOwn(next);
    setRaw(nextRaw);
    setCanHistory({ undo: history.current.past.length > 0, redo: history.current.future.length > 0 });
    onChange?.(next, change);
  }

  function applyChange(next: T[], nextRaw: RawInput, change: TableChange, selAfter?: Selection) {
    const before = { rows: rowsRef.current, raw: rawRef.current };
    if (next === before.rows && nextRaw === before.raw) return false;
    const selBefore = selRef.current;
    const h = history.current;
    h.past.push({ before, after: { rows: next, raw: nextRaw }, selBefore, selAfter: selAfter ?? selBefore, label: change.label });
    if (h.past.length > HISTORY_LIMIT) h.past.shift();
    h.future = [];
    setSnapshot(next, nextRaw, change);
    if (selAfter) select(selAfter.active, selAfter.anchor, true, selAfter.rect);
    return true;
  }

  /** Put one parsed value (or the raw text that didn't parse) into a working copy of the rows */
  function setCell(work: { rows: T[]; raw: RawInput }, p: Pos, parsed: Parsed, text: string) {
    const col = columns[p.c];
    const row = work.rows[p.r];
    const rk = rowKey(row);
    const v = parsed.ok ? parsed.value : emptyValue(col);
    const keep = parsed.ok ? undefined : text;
    if (cellValue(col, row) !== v) work.rows[p.r] = withValue(row, col.key, v);
    work.raw = putRaw(work.raw, rk, col.key, keep);
  }

  function finish(work: { rows: T[]; raw: RawInput }) {
    const before = rowsRef.current;
    const changed = work.rows.length !== before.length || work.rows.some((r, i) => r !== before[i]);
    return { rows: changed ? work.rows : before, raw: work.raw };
  }

  function errorAt(p: Pos, snapshot: Snapshot<T>) {
    const row = snapshot.rows[p.r];
    if (!row) return null;
    const col = columns[p.c];
    return cellError(col, row, rawFor(snapshot.raw, rowKey(row), col, row), locale);
  }

  function writeText(targets: Pos[], text: string, change: TableChange) {
    if (!targets.length) return;
    const work = { rows: rowsRef.current.slice(), raw: rawRef.current };
    for (const p of targets) setCell(work, p, parseCell(columns[p.c], text, locale), text);
    const next = finish(work);
    if (!applyChange(next.rows, next.raw, change)) return;
    if (targets.length === 1) {
      const message = errorAt(targets[0], next);
      if (message) announce(`${columns[targets[0].c].header}, ${rowName(targets[0].r)}: ${message}`);
    } else {
      const bad = targets.filter((p) => errorAt(p, next)).length;
      announce(`Filled ${plural(targets.length, "cell")}${bad ? `, ${bad} invalid` : ""}`);
    }
  }

  function toggle(r: number, c: number) {
    if (!canEdit({ r, c })) return;
    const col = columns[c];
    const on = cellValue(col, rowsRef.current[r]) !== true;
    writeText([{ r, c }], on ? "yes" : "no", { kind: "edit", label: `${on ? "Tick" : "Untick"} ${col.header}` });
  }

  /** Space on yes/no cells: tick them all, or untick them all when all are ticked */
  function toggleRange() {
    const targets = editableInRange().filter((p) => columnType(columns[p.c]) === "checkbox");
    if (!targets.length) return;
    const allOn = targets.every((p) => cellValue(columns[p.c], rowsRef.current[p.r]) === true);
    const work = { rows: rowsRef.current.slice(), raw: rawRef.current };
    for (const p of targets) setCell(work, p, { ok: true, value: !allOn }, "");
    const next = finish(work);
    applyChange(next.rows, next.raw, { kind: "edit", label: `${allOn ? "Untick" : "Tick"} ${plural(targets.length, "cell")}` });
    if (targets.length > 1) announce(`${allOn ? "Unticked" : "Ticked"} ${plural(targets.length, "cell")}`);
  }

  function clearRange() {
    const targets = editableInRange();
    if (!targets.length) {
      if (rowsRef.current.length) announce("Nothing here can be cleared");
      return;
    }
    const work = { rows: rowsRef.current.slice(), raw: rawRef.current };
    for (const p of targets) setCell(work, p, { ok: true, value: emptyValue(columns[p.c]) }, "");
    const next = finish(work);
    if (applyChange(next.rows, next.raw, { kind: "clear", label: `Clear ${plural(targets.length, "cell")}` })) announce(`Cleared ${plural(targets.length, "cell")}`);
  }

  function fillDown() {
    const { r0, r1, c0, c1 } = rangeOf(selRef.current);
    const src = r1 > r0 ? r0 : r0 - 1;
    const rowsNow = rowsRef.current;
    if (src < 0 || src >= rowsNow.length) return announce("Nothing above to fill down from");
    const work = { rows: rowsNow.slice(), raw: rawRef.current };
    let n = 0;
    for (let c = c0; c <= c1; c++) {
      const col = columns[c];
      const from = rowsNow[src];
      const v = cellValue(col, from);
      const text = rawFor(rawRef.current, rowKey(from), col, from);
      for (let r = Math.max(r0, src + 1); r <= Math.min(r1, rowsNow.length - 1); r++) {
        if (!canEdit({ r, c })) continue;
        setCell(work, { r, c }, text === undefined ? { ok: true, value: v } : { ok: false, error: "" }, text ?? "");
        n++;
      }
    }
    const next = finish(work);
    if (applyChange(next.rows, next.raw, { kind: "fill", label: `Fill down ${plural(n, "cell")}` })) announce(`Filled ${plural(n, "cell")} down`);
  }

  function rangeText(): { text: string; count: number } {
    const { r0, r1, c0, c1 } = rangeOf(selRef.current);
    const rowsNow = rowsRef.current;
    const cells: string[][] = [];
    for (let r = r0; r <= r1; r++) {
      const line: string[] = [];
      for (let c = c0; c <= c1; c++) {
        const col = columns[c];
        const row = rowsNow[r];
        if (!row) {
          const t = columnTotal(col, rowsNow);
          line.push(t == null ? (c === totalsLabelIndex ? totalsLabel : "") : formatTotal(col, t, locale));
          continue;
        }
        const v = cellValue(col, row);
        const kept = rawFor(rawRef.current, rowKey(row), col, row);
        line.push(kept ?? (columnType(col) === "checkbox" ? (v ? "TRUE" : "FALSE") : formatCell(col, v, row, locale)));
      }
      cells.push(line);
    }
    return { text: toTSV(cells), count: (r1 - r0 + 1) * (c1 - c0 + 1) };
  }

  function paste(text: string) {
    const grid = parseTSV(text);
    if (!grid.length || !nCols) return;
    if (readOnly) return announce("This table is read-only");
    const { r0, r1, c0, c1 } = rangeOf(selRef.current);
    const rowsNow = rowsRef.current;
    if (r0 >= rowsNow.length) return announce("The totals row can't be pasted into");
    const one = grid.length === 1 && grid[0].length === 1;
    const fillRange = one && (r1 > r0 || c1 > c0);
    const h = fillRange ? Math.min(r1, rowsNow.length - 1) - r0 + 1 : grid.length;
    const w = fillRange ? c1 - c0 + 1 : Math.max(...grid.map((g) => g.length));
    const work = { rows: rowsNow.slice(), raw: rawRef.current };
    let added = 0;
    while (newRow && r0 + h > work.rows.length) {
      work.rows.push(newRow());
      added++;
    }
    const written: Pos[] = [];
    let skipped = 0;
    let clipped = 0;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const p = { r: r0 + i, c: c0 + j };
        const cellText = fillRange ? grid[0][0] : (grid[i]?.[j] ?? "");
        if (p.r >= work.rows.length || p.c >= nCols) {
          clipped++;
          continue;
        }
        if (!isEditableColumn(columns[p.c])) {
          skipped++;
          continue;
        }
        setCell(work, p, parseCell(columns[p.c], cellText, locale), cellText);
        written.push(p);
      }
    }
    const next = finish(work);
    const end = { r: Math.min(r0 + h - 1, next.rows.length - 1), c: Math.min(c0 + w - 1, nCols - 1) };
    const bad = written.filter((p) => errorAt(p, next)).length;
    const changed = applyChange(next.rows, next.raw, { kind: "paste", label: `Paste ${plural(written.length, "cell")}` }, { active: { r: r0, c: c0 }, anchor: end });
    const parts = [`Pasted ${plural(written.length, "cell")}`];
    if (bad) parts.push(`${bad} invalid`);
    if (added) parts.push(`added ${plural(added, "row")}`);
    if (skipped) parts.push(`${skipped} read-only skipped`);
    if (clipped) parts.push(`${clipped} didn't fit`);
    announce(changed || written.length ? parts.join(", ") : "Nothing changed");
  }

  function undo() {
    const e = history.current.past.pop();
    if (!e) return announce("Nothing to undo");
    history.current.future.push(e);
    setSnapshot(e.before.rows, e.before.raw, { kind: "undo", label: e.label });
    select(e.selBefore.active, e.selBefore.anchor, true, e.selBefore.rect);
    announce(`Undone: ${e.label}`);
  }

  function redo() {
    const e = history.current.future.pop();
    if (!e) return announce("Nothing to redo");
    history.current.past.push(e);
    setSnapshot(e.after.rows, e.after.raw, { kind: "redo", label: e.label });
    select(e.selAfter.active, e.selAfter.anchor, true, e.selAfter.rect);
    announce(`Redone: ${e.label}`);
  }

  const firstEditable = Math.max(0, columns.findIndex((c) => isEditableColumn(c)));

  function insertRow(at: number, copyOf?: T) {
    if (!newRow || readOnly) return;
    const rowsNow = rowsRef.current;
    const row = newRow(copyOf);
    const next = [...rowsNow.slice(0, at), row, ...rowsNow.slice(at)];
    let nextRaw = rawRef.current;
    if (copyOf) {
      const kept = nextRaw[rowKey(copyOf)];
      if (kept) nextRaw = { ...nextRaw, [rowKey(row)]: kept };
    }
    const c = copyOf ? selRef.current.active.c : firstEditable;
    const what = copyOf ? `Duplicate ${rowName(at - 1)}` : at >= rowsNow.length ? "Add a row" : `Insert a row at ${at + 1}`;
    applyChange(next, nextRaw, { kind: copyOf ? "duplicate" : "insert", label: what }, { active: { r: at, c }, anchor: { r: at, c } });
    announce(copyOf ? `Duplicated as row ${at + 1}` : `Row ${at + 1} added`);
  }

  function deleteRows(r0: number, r1: number) {
    if (readOnly) return;
    const rowsNow = rowsRef.current;
    r1 = Math.min(r1, rowsNow.length - 1);
    if (r0 > r1) return;
    const gone = rowsNow.slice(r0, r1 + 1);
    const next = [...rowsNow.slice(0, r0), ...rowsNow.slice(r1 + 1)];
    let nextRaw = rawRef.current;
    for (const g of gone) if (nextRaw[rowKey(g)]) nextRaw = Object.fromEntries(Object.entries(nextRaw).filter(([k]) => k !== rowKey(g)));
    const what = gone.length === 1 ? `Delete ${rowName(r0)}` : `Delete rows ${r0 + 1}–${r1 + 1}`;
    const r = clamp(r0, 0, Math.max(0, next.length - 1));
    const c = selRef.current.active.c;
    applyChange(next, nextRaw, { kind: "delete", label: what }, { active: { r, c }, anchor: { r, c } });
    announce(`${gone.length === 1 ? "Row" : plural(gone.length, "row")} deleted. Ctrl+Z brings ${gone.length === 1 ? "it" : "them"} back.`);
  }

  function discard() {
    if (!changes.count) return;
    const n = changes.count;
    applyChange(baseline, {}, { kind: "discard", label: `Discard ${plural(n, "change")}` });
    announce(`Discarded ${plural(n, "change")}. Ctrl+Z brings them back.`);
  }

  function nextError() {
    if (!errors.length) return;
    const { r, c } = selRef.current.active;
    const e = errors.find((x) => x.row > r || (x.row === r && x.column > c)) ?? errors[0];
    select({ r: e.row, c: e.column });
    announce(`${columns[e.column].header}, ${rowName(e.row)}: ${e.message}`);
  }

  async function save() {
    if (!onSave) return;
    if (errors.length) {
      nextError();
      return;
    }
    const snapshot = rowsRef.current;
    const ch = changes;
    const result = onSave(snapshot, ch);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setSaving(true);
      try {
        await result;
      } catch {
        setSaving(false);
        announce("Couldn't save. Your changes are still here.");
        return;
      }
      setSaving(false);
    }
    if (baselineProp === undefined) setOwnBaseline(snapshot);
    announce(`Saved ${plural(ch.count, "change")}`);
  }

  // ------------------------------------------------------------------------------------------
  // Editing

  function startEdit(p: Pos, mode: Editing["mode"], typed?: string) {
    if (!canEdit(p)) {
      if (p.r < rowsRef.current.length && nCols) announce(`${columns[p.c].header} can't be edited here`);
      else if (p.r >= rowsRef.current.length && rowsRef.current.length) announce("The totals are worked out from the rows");
      return;
    }
    const col = columns[p.c];
    if (columnType(col) === "checkbox") {
      toggle(p.r, p.c);
      return;
    }
    const row = rowsRef.current[p.r];
    const text = typed ?? rawFor(rawRef.current, rowKey(row), col, row) ?? editText(col, cellValue(col, row));
    const ed: Editing = { r: p.r, c: p.c, text, mode, openList: mode === "edit" && typed === undefined, id: ++editId.current };
    editingRef.current = ed;
    setEditing(ed);
  }

  function finishEdit(commit: boolean, { focus = true, fill = false }: { focus?: boolean; fill?: boolean } = {}) {
    const ed = editingRef.current;
    if (!ed) return;
    const el = tableRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-editor-input]");
    const text = el?.value;
    editingRef.current = null;
    setEditing(null);
    if (focus) pendingFocus.current = true;
    if (!commit || text === undefined || ed.r >= rowsRef.current.length) return;
    const targets = fill ? editableInRange() : [{ r: ed.r, c: ed.c }];
    writeText(targets, text, { kind: "edit", label: fill ? `Fill ${plural(targets.length, "cell")}` : `Edit ${columns[ed.c].header}` });
  }

  /** After Enter: down a row, or back to where a run of Tabs started */
  function enterDown(from: Pos, up: boolean) {
    const c = tabStart.current ?? from.c;
    tabStart.current = null;
    if (up) return moveTo({ r: from.r - 1, c }, false);
    const lastData = rowsRef.current.length - 1;
    if (from.r >= lastData && addRowOnEnter && newRow && !readOnly) return insertRow(rowsRef.current.length);
    moveTo({ r: Math.min(from.r + 1, Math.max(lastData, 0)), c }, false);
  }

  function onEditorKey(e: ReactKeyboardEvent, ed: Editing) {
    const t = columnType(columns[ed.c]);
    const mod = e.ctrlKey || e.metaKey;
    const from = { r: ed.r, c: ed.c };
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        finishEdit(false);
        return;
      case "Enter":
        if (t === "longtext" && (e.shiftKey || e.altKey)) {
          if (e.altKey) {
            e.preventDefault();
            document.execCommand("insertText", false, "\n");
          }
          return;
        }
        if (e.altKey || e.nativeEvent.isComposing) return;
        e.preventDefault();
        if (mod) return finishEdit(true, { fill: true });
        finishEdit(true);
        enterDown(from, e.shiftKey);
        return;
      case "Tab": {
        e.preventDefault();
        finishEdit(true);
        const c = from.c + (e.shiftKey ? -1 : 1);
        if (c >= 0 && c < nCols) {
          if (tabStart.current == null) tabStart.current = from.c;
          moveTo({ r: from.r, c }, false);
        }
        return;
      }
      case "F2":
        e.preventDefault();
        if (ed.mode === "replace") {
          const next = { ...ed, mode: "edit" as const };
          editingRef.current = next;
          setEditing(next);
        }
        return;
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight": {
        if (ed.mode !== "replace" || t === "longtext" || e.shiftKey || mod || e.altKey) return;
        e.preventDefault();
        finishEdit(true);
        tabStart.current = null;
        const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
        moveTo({ r: from.r + d[0], c: from.c + d[1] }, false);
        return;
      }
    }
  }

  // ------------------------------------------------------------------------------------------
  // Keyboard on the grid

  function pageRows() {
    const box = boxRef.current;
    const head = tableRef.current?.tHead?.offsetHeight ?? cellH;
    return box ? Math.max(1, Math.floor((box.clientHeight - head * 2) / cellH)) : 10;
  }

  function onGridKey(e: ReactKeyboardEvent) {
    if (!nCols || !nRows) return;
    const { active } = selRef.current;
    const mod = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const last = { r: nRows - 1, c: nCols - 1 };
    const go = (p: Pos, extend = shift) => {
      e.preventDefault();
      tabStart.current = null;
      moveTo(p, extend);
    };
    const col = columns[active.c];
    switch (e.key) {
      case "ArrowUp":
        return go({ r: mod ? 0 : active.r - 1, c: active.c });
      case "ArrowDown":
        if (e.altKey && canEdit(active)) {
          e.preventDefault();
          return startEdit(active, "edit");
        }
        return go({ r: mod ? last.r : active.r + 1, c: active.c });
      case "ArrowLeft":
        return go({ r: active.r, c: mod ? 0 : active.c - 1 });
      case "ArrowRight":
        return go({ r: active.r, c: mod ? last.c : active.c + 1 });
      case "Home":
        return go(mod ? { r: 0, c: 0 } : { r: active.r, c: 0 });
      case "End":
        return go(mod ? last : { r: active.r, c: last.c });
      case "PageUp":
        return go({ r: active.r - pageRows(), c: active.c });
      case "PageDown":
        return go({ r: active.r + pageRows(), c: active.c });
      case "Tab": {
        const c = active.c + (shift ? -1 : 1);
        // At either end of the row, Tab leaves the grid as usual
        if (c < 0 || c > last.c || mod || e.altKey) return;
        e.preventDefault();
        if (tabStart.current == null) tabStart.current = active.c;
        moveTo({ r: active.r, c }, false);
        return;
      }
      case "Enter":
        e.preventDefault();
        if (shift || !canEdit(active)) return enterDown(active, shift);
        return startEdit(active, "edit");
      case "F2":
        e.preventDefault();
        return startEdit(active, "edit");
      case "Escape":
        if (!samePos(selRef.current.anchor, active) || selRef.current.rect) {
          e.preventDefault();
          select(active);
        }
        return;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        return clearRange();
      case " ":
        if (shift && !mod) {
          e.preventDefault();
          return selectRows(active.r, active.r, active, { r: active.r, c: 0 });
        }
        if (mod && !shift) {
          e.preventDefault();
          return select(active, { r: 0, c: active.c }, true, { r0: 0, r1: Math.max(0, rowsRef.current.length - 1), c0: active.c, c1: active.c });
        }
        if (col && columnType(col) === "checkbox") {
          e.preventDefault();
          spaceAt.current = performance.now();
          return toggleRange();
        }
        break;
    }
    if (mod && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          return select(active, { r: 0, c: 0 }, true, { r0: 0, r1: last.r, c0: 0, c1: last.c });
        case "z":
          e.preventDefault();
          return shift ? redo() : undo();
        case "y":
          e.preventDefault();
          return redo();
        case "d":
          e.preventDefault();
          return fillDown();
        case "c":
        case "x": {
          // The browser fires copy or cut next, which fills the clipboard; if it doesn't, write it ourselves.
          const { text, count } = rangeText();
          const cut = e.key.toLowerCase() === "x";
          copyPending.current = text;
          window.setTimeout(() => {
            if (copyPending.current !== text) return;
            copyPending.current = null;
            void navigator.clipboard?.writeText(text).then(
              () => afterCopy(count, cut),
              () => announce("The browser didn't allow copying"),
            );
          }, 0);
          return;
        }
      }
      return;
    }
    // Typing starts editing, replacing the content. (AltGr comes as Ctrl+Alt on Windows.)
    if (e.key.length === 1 && !e.metaKey && !(e.ctrlKey && !e.altKey)) {
      if (!canEdit(active)) return startEdit(active, "replace", e.key);
      e.preventDefault();
      startEdit(active, "replace", e.key);
    }
  }

  function afterCopy(count: number, cut: boolean) {
    if (cut) {
      clearRange();
      announce(`Cut ${plural(count, "cell")}`);
    } else announce(`Copied ${plural(count, "cell")}`);
  }

  function onCopyOrCut(e: ReactClipboardEvent, cut: boolean) {
    if (editingRef.current || !tableRef.current?.contains(e.target as Node)) return;
    const { text, count } = rangeText();
    copyPending.current = null;
    e.preventDefault();
    e.clipboardData.setData("text/plain", text);
    afterCopy(count, cut);
  }

  function onPaste(e: ReactClipboardEvent) {
    if (editingRef.current) return; // into the editor, as text
    e.preventDefault();
    paste(e.clipboardData.getData("text/plain"));
  }

  function onKeyDown(e: ReactKeyboardEvent) {
    const target = e.target as Element;
    // Layers that aren't ours (the date picker's calendar) handle their own keys
    const layer = target.closest("[popover]");
    if (layer && !layer.hasAttribute("data-cell-editor")) return;
    const ed = editingRef.current;
    if (ed && target.closest("[data-cell-editor]")) return onEditorKey(e, ed);
    if (!ed) onGridKey(e);
  }

  // ------------------------------------------------------------------------------------------
  // Pointer

  const posOf = (el: Element): Pos => {
    const [r, c] = (el.getAttribute("data-cell") ?? "0:0").split(":").map(Number);
    return { r, c };
  };

  function onMouseDown(e: ReactMouseEvent) {
    const t = e.target as Element;
    if (t.closest("[data-cell-editor]")) return;
    const head = t.closest("[data-row-head]");
    const cell = t.closest("[data-cell]");
    if (!head && !cell) return;
    const s = selRef.current;
    if (e.button === 2) {
      // A right-click outside the range selects the cell; inside, the menu acts on the range
      const { r0, r1, c0, c1 } = rangeOf(s);
      if (cell) {
        const p = posOf(cell);
        if (p.r < r0 || p.r > r1 || p.c < c0 || p.c > c1) {
          finishEdit(true);
          moveTo(p, false);
        }
      } else if (head) {
        const r = Number(head.getAttribute("data-row-head"));
        if (r < r0 || r > r1) select({ r, c: s.active.c });
      }
      return;
    }
    if (e.button !== 0) return;
    finishEdit(true);
    e.preventDefault(); // no text selection, and focus is ours to move (a checkbox still toggles)
    tabStart.current = null;
    if (head) {
      // The row number selects the row (Shift: the rows from the last one); the ⋯ button keeps the selection when it covers the row
      const r = Number(head.getAttribute("data-row-head"));
      const { r0, r1 } = rangeOf(s);
      if (t.closest("button") && r >= r0 && r <= r1) return select({ r, c: s.active.c }, s.anchor, true, s.rect ?? (r1 > r0 ? rangeOf(s) : undefined));
      if (e.shiftKey) return selectRows(s.anchor.r, r, { r, c: s.active.c }, s.anchor);
      return selectRows(r, r, { r, c: s.active.c }, { r, c: 0 });
    }
    const p = posOf(cell!);
    if (e.shiftKey) return moveTo(p, true);
    // On a touch screen, a tap on the cell that already has focus edits it
    if (pointerType.current !== "mouse" && samePos(p, s.active) && !t.closest("[data-cell-focus]") && !e.shiftKey) return startEdit(p, "edit");
    moveTo(p, false);
    drag.current = pointerType.current === "mouse";
  }

  function onMouseOver(e: ReactMouseEvent) {
    if (!drag.current || e.buttons !== 1) return;
    const cell = (e.target as Element).closest("[data-cell]");
    if (!cell) return;
    const p = posOf(cell);
    if (!samePos(p, selRef.current.active)) moveTo(p, true);
  }

  function onDoubleClick(e: ReactMouseEvent) {
    const t = e.target as Element;
    const cell = t.closest("[data-cell]");
    if (!cell || t.closest("[data-cell-editor]") || t.closest("[data-cell-focus]")) return;
    startEdit(posOf(cell), "edit");
  }

  function onCellFocus(e: ReactFocusEvent) {
    const t = e.target as Element;
    const cell = t.closest("[data-cell]");
    if (!cell || t.closest("[data-cell-editor]")) return;
    const p = posOf(cell);
    if (samePos(p, selRef.current.active)) return;
    // A closing menu gives focus back to where it was opened (the browser does, then the menu
    // does), and that cell may have moved since: put it back on the active cell.
    if (afterMenu.current && performance.now() - afterMenu.current < 1000) {
      focusCell(selRef.current.active);
      return;
    }
    select(p, p, false);
  }

  function onTableBlur(e: ReactFocusEvent) {
    const ed = editingRef.current;
    if (!ed || !(e.target as Element).closest("[data-cell-editor]")) return;
    const next = e.relatedTarget as Element | null;
    if (next && cellEl(ed)?.contains(next)) return; // still in the cell: the calendar, its button
    finishEdit(true, { focus: !!next && !!tableRef.current?.contains(next) });
  }

  // ------------------------------------------------------------------------------------------
  // Row menu

  function openRowMenu(button: HTMLElement) {
    const b = button.getBoundingClientRect();
    button.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2, clientX: b.left, clientY: b.bottom }));
  }

  useLayoutEffect(() => {
    api.current = {
      clickToggle: (r, c, fromKeyboard) => {
        // Chrome still clicks a checkbox on Space's keyup after keydown was handled; that one is ours already
        if (fromKeyboard && performance.now() - spaceAt.current < 800) return;
        toggle(r, c);
      },
      commitEdit: () => finishEdit(true),
      openRowMenu,
    };
  });

  const menuItems = (target: Element): MenuItem[] => {
    const s = selRef.current;
    const tr = target.closest("[data-row]");
    const r = tr ? Number(tr.getAttribute("data-row")) : s.active.r;
    const { r0, r1 } = rangeOf(s);
    const [d0, d1] = r >= r0 && r <= r1 ? [r0, Math.min(r1, rowsRef.current.length - 1)] : [r, r];
    const isRow = r < rowsRef.current.length;
    const mac = /Mac|iP(hone|ad|od)/.test(navigator.platform);
    const key = (k: string) => (mac ? `⌘${k}` : `Ctrl+${k}`);
    const later = (fn: () => void) => () => {
      afterMenu.current = performance.now();
      fn();
    };
    const canRows = !readOnly && !!newRow && isRow;
    return [
      { label: "Insert row above", icon: BetweenHorizontalStart, disabled: !canRows, onSelect: later(() => insertRow(r)) },
      { label: "Insert row below", icon: BetweenHorizontalEnd, disabled: !canRows, onSelect: later(() => insertRow(r + 1)) },
      { label: "Duplicate row", icon: CopyPlus, disabled: !canRows, onSelect: later(() => insertRow(r + 1, rowsRef.current[r])) },
      {
        label: d1 > d0 ? `Delete ${d1 - d0 + 1} rows` : "Delete row",
        icon: Trash,
        destructive: true,
        disabled: readOnly || !isRow,
        onSelect: later(() => deleteRows(d0, d1)),
      },
      { type: "separator" },
      {
        label: "Copy",
        icon: Copy,
        shortcut: key("C"),
        onSelect: later(() => {
          const { text, count } = rangeText();
          void navigator.clipboard?.writeText(text).then(
            () => afterCopy(count, false),
            () => announce(`Copy with ${key("C")}: the browser didn't allow it from the menu`),
          );
        }),
      },
      {
        label: "Paste",
        icon: ClipboardPaste,
        shortcut: key("V"),
        disabled: readOnly,
        onSelect: later(() => {
          void navigator.clipboard?.readText().then(paste, () => announce(`Paste with ${key("V")}: the browser didn't allow reading the clipboard`));
        }),
      },
      { label: "Clear", icon: Eraser, shortcut: "Del", disabled: readOnly, onSelect: later(clearRange) },
      { label: "Fill down", icon: ArrowDownToLine, shortcut: key("D"), disabled: readOnly, onSelect: later(fillDown) },
    ];
  };

  // ------------------------------------------------------------------------------------------
  // Drawing

  const totalsLabelIndex = columns.findIndex((c) => !c.total && !isNumeric(c));
  const canUndo = canHistory.undo;
  const canRedo = canHistory.redo;
  const hintId = `${uid}-hint`;
  const showSaveBar = onSave != null && tracking && !readOnly;

  return (
    <div
      ref={rootRef}
      data-slot="editable-table"
      className={cn("flex w-fit max-w-full min-w-0 flex-col gap-1.5 text-(length:--ctl-text)", controlSize(size), className)}
      onFocus={() => setHasFocus(true)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setHasFocus(false);
      }}
    >
      {toolbar && (
        <div className="flex flex-wrap items-center gap-1.5">
          {newRow && !readOnly && (
            <Button icon={Plus} onClick={() => insertRow(rowsRef.current.length)}>
              Add row
            </Button>
          )}
          {!readOnly && (
            <ButtonGroup label="History">
              <IconButton icon={Undo2} label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
              <IconButton icon={Redo2} label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo} />
            </ButtonGroup>
          )}
          {actions}
          <span role="status" className="ml-auto min-w-0 text-right text-[12px] text-muted-foreground sm:max-w-[60ch]">
            {status.text}
            {status.n % 2 ? "​" : ""}
          </span>
        </div>
      )}
      {!toolbar && (
        <span role="status" className="sr-only">
          {status.text}
          {status.n % 2 ? "​" : ""}
        </span>
      )}

      <ContextMenu items={menuItems} label="Row and cell actions" className="min-w-0">
        <div
          ref={boxRef}
          className="w-fit max-w-full overflow-auto border border-border bg-background"
          // So the browser's own scrolling (to a cell, to a found word) keeps clear of the sticky rows and columns too
          style={{ maxHeight, scrollPaddingLeft: stickyWidth, scrollPaddingTop: cellH, scrollPaddingBottom: totals ? cellH : undefined }}
        >
          <table
            ref={tableRef}
            role="grid"
            aria-label={label}
            aria-multiselectable
            aria-readonly={readOnly || undefined}
            aria-describedby={hint ? hintId : undefined}
            className="table-fixed border-separate border-spacing-0 leading-tight"
            style={{ width: tableWidth }}
            onKeyDown={onKeyDown}
            onMouseDown={onMouseDown}
            onPointerDown={(e) => {
              pointerType.current = e.pointerType;
            }}
            onMouseOver={onMouseOver}
            onDoubleClick={onDoubleClick}
            onFocus={onCellFocus}
            onBlur={onTableBlur}
            onCopy={(e) => onCopyOrCut(e, false)}
            onCut={(e) => onCopyOrCut(e, true)}
            onPaste={onPaste}
          >
            <colgroup>
              <col style={{ width: ROW_HEAD_W }} />
              {layout.map((l, i) => (
                <col key={columns[i].key} style={{ width: l.width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th aria-hidden className="sticky top-0 left-0 z-[7] border-r border-b border-border bg-muted p-0" />
                {columns.map((col, c) => {
                  const L = layout[c];
                  const lit = multi && c >= range.c0 && c <= range.c1;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      title={col.header}
                      className={cn(
                        "sticky top-0 border-r border-b border-border bg-muted p-0 text-left font-semibold",
                        L.left != null ? "z-[7]" : "z-[6]",
                        lit && "bg-accent",
                      )}
                      style={{ left: L.left }}
                    >
                      <div className={INNER}>
                        <span className="truncate">{col.header}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={nCols + 1} className="border-b border-border px-3 py-6 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <span>{empty}</span>
                      {newRow && !readOnly && (
                        <Button icon={Plus} onClick={() => insertRow(0)}>
                          Add a row
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, r) => {
                  const rk = rowKey(row);
                  const inRange = multi && r >= range.r0 && r <= range.r1;
                  return (
                    <RowView
                      key={rk}
                      row={row}
                      r={r}
                      rk={rk}
                      columns={columns}
                      layout={layout}
                      tracking={tracking}
                      saved={tracking ? savedByKey.get(rk) : undefined}
                      raw={raw[rk]}
                      activeC={sel.active.r === r ? sel.active.c : -1}
                      showRing={hasFocus}
                      editing={shownEditing?.r === r ? shownEditing : null}
                      rangeC0={inRange ? range.c0 : -1}
                      rangeC1={inRange ? range.c1 : -1}
                      rangeTop={inRange && r === range.r0}
                      rangeBottom={inRange && r === range.r1}
                      readOnly={readOnly}
                      locale={locale}
                      rowHeader={rowHeaderIndex}
                      uid={uid}
                      cellH={cellH}
                      api={api}
                    />
                  );
                })
              )}
            </tbody>
            {totals && rows.length > 0 && (
              <tfoot>
                <tr data-row={rows.length}>
                  <td aria-hidden className="sticky bottom-0 left-0 z-[7] border-r border-b border-border bg-muted p-0 shadow-[inset_0_1px_0_var(--color-border)]" />
                  {columns.map((col, c) => {
                    const p = { r: rows.length, c };
                    const active = samePos(p, sel.active);
                    const inRange = multi && p.r >= range.r0 && p.r <= range.r1 && c >= range.c0 && c <= range.c1;
                    const t = columnTotal(col, rows);
                    const text = t == null ? (c === totalsLabelIndex ? totalsLabel : "") : formatTotal(col, t, locale);
                    const L = layout[c];
                    return (
                      <td
                        key={col.key}
                        role="gridcell"
                        data-cell={`${p.r}:${c}`}
                        tabIndex={active ? 0 : -1}
                        aria-readonly
                        aria-selected={inRange || undefined}
                        className={cn(
                          TD,
                          "sticky bottom-0 bg-muted font-semibold shadow-[inset_0_1px_0_var(--color-border)] outline-none",
                          L.left != null ? "z-[7]" : "z-[6]",
                          inRange && RANGE_BG,
                        )}
                        style={{ left: L.left }}
                      >
                        <div className={cn(INNER, isNumeric(col) && "justify-end tabular-nums")}>
                          <span className="truncate">{text}</span>
                        </div>
                        {active && hasFocus && <span aria-hidden className={RING} />}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </ContextMenu>

      {showSaveBar && (
        <div data-slot="editable-table-save-bar" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border border-border bg-muted px-2 py-1">
          <span className="min-w-0">
            {changes.count ? <b>{plural(changes.count, "unsaved change")}</b> : <span className="text-muted-foreground">No unsaved changes</span>}
            {changes.count > 0 && <span className="text-muted-foreground">: {describeChanges(changes)}</span>}
          </span>
          {errors.length > 0 && (
            <Button variant="link" icon={CircleAlert} className="text-destructive visited:text-destructive" onClick={nextError}>
              {plural(errors.length, "error")}: show {errors.length > 1 ? "next" : "it"}
            </Button>
          )}
          <span className="ml-auto flex gap-1.5">
            <Button icon={RotateCcw} disabled={!changes.count || saving} onClick={discard}>
              Discard
            </Button>
            <Button variant="primary" icon={Save} loading={saving} disabled={!changes.count} onClick={() => void save()}>
              Save
            </Button>
          </span>
        </div>
      )}

      {hint && (
        <p id={hintId} className="max-w-[80ch] text-[12px] leading-relaxed text-muted-foreground">
          {readOnly ? (
            <>
              Arrow keys move, <Kbd keys={["Shift", "↓"]} /> selects, <Kbd keys={["Ctrl", "C"]} /> copies.
            </>
          ) : (
            <>
              Type to replace a cell, <Kbd>Enter</Kbd> or <Kbd>F2</Kbd> to edit it, <Kbd>Esc</Kbd> to cancel. <Kbd keys={["Shift", "↓"]} /> or a drag
              selects; <Kbd keys={["Ctrl", "C"]} />, <Kbd keys={["Ctrl", "V"]} /> and <Kbd keys={["Ctrl", "D"]} /> copy, paste (also from a spreadsheet)
              and fill down; <Kbd keys={["Ctrl", "Z"]} /> undoes. Right-click or <Kbd keys={["Shift", "F10"]} /> for the row menu.
            </>
          )}
        </p>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// One row

interface RowViewProps<T> {
  row: T;
  r: number;
  rk: string;
  columns: EditableColumn<T>[];
  layout: ColLayout[];
  tracking: boolean;
  /** The saved version of the row; undefined for a new row (or when not tracking) */
  saved: T | undefined;
  raw: Readonly<Record<string, string>> | undefined;
  /** The focused column when this is the active row, else -1 */
  activeC: number;
  showRing: boolean;
  editing: Editing | null;
  /** Columns of a multi-cell range on this row, else -1 */
  rangeC0: number;
  rangeC1: number;
  rangeTop: boolean;
  rangeBottom: boolean;
  readOnly: boolean;
  locale?: string;
  rowHeader: number;
  uid: string;
  cellH: number;
  api: RefObject<TableApi | null>;
}

function RowViewInner<T>({
  row,
  r,
  rk,
  columns,
  layout,
  tracking,
  saved,
  raw,
  activeC,
  showRing,
  editing,
  rangeC0,
  rangeC1,
  rangeTop,
  rangeBottom,
  readOnly,
  locale,
  rowHeader,
  uid,
  cellH,
  api,
}: RowViewProps<T>) {
  const isNew = tracking && !saved;
  const name = rowHeader >= 0 ? formatCell(columns[rowHeader], cellValue(columns[rowHeader], row), row, locale) : "";
  const rowLabel = name || `row ${r + 1}`;
  const rowInRange = rangeC0 >= 0;
  return (
    <tr data-row={r} data-active={activeC >= 0 || undefined} className="group/row">
      <td
        aria-hidden
        data-row-head={r}
        title={isNew ? "New row" : undefined}
        className={cn("sticky left-0 z-[5] border-r border-b border-border bg-muted p-0", rowInRange && "bg-accent")}
        style={isNew ? { boxShadow: "inset 3px 0 0 var(--color-primary)" } : undefined}
      >
        <div className="flex h-[calc(var(--ctl-h)-1px)] items-center justify-between pr-0.5 pl-2 text-[12px] text-muted-foreground tabular-nums select-none">
          <span>{r + 1}</span>
          <IconButton
            icon={EllipsisVertical}
            label="Row actions"
            size="xs"
            variant="ghost"
            tabIndex={-1}
            onClick={(e) => api.current?.openRowMenu(e.currentTarget)}
            className="opacity-0 group-hover/row:opacity-100 group-data-[active]/row:opacity-100 [@media(hover:none)]:opacity-100"
          />
        </div>
      </td>
      {columns.map((col, c) => {
        const t = columnType(col);
        const v = cellValue(col, row);
        const kept = keptText(raw, col, row);
        const error = cellError(col, row, kept, locale);
        const changed = tracking && cellChanged(col, row, saved, kept);
        const editable = !readOnly && isEditableColumn(col);
        const active = c === activeC;
        const isEditing = editing?.c === c;
        const inRange = c >= rangeC0 && c <= rangeC1 && rangeC0 >= 0;
        const L = layout[c];
        const numeric = isNumeric(col);
        const text = kept ?? formatCell(col, v, row, locale);
        const was = changed && saved ? formatCell(col, cellValue(col, saved), saved, locale) : "";
        const descId = `${uid}-d-${rk}-${col.key}`;
        const desc = [error, changed && `Changed, was ${was || "empty"}`, isNew && c === 0 && "New row"].filter(Boolean).join(". ");
        const shadows = [
          error && "inset 0 0 0 1px var(--color-destructive)",
          inRange && rangeTop && "inset 0 1px 0 var(--color-link)",
          inRange && rangeBottom && "inset 0 -1px 0 var(--color-link)",
          inRange && c === rangeC0 && "inset 1px 0 0 var(--color-link)",
          inRange && c === rangeC1 && "inset -1px 0 0 var(--color-link)",
        ].filter(Boolean);
        const cellName = `${col.header}, ${rowLabel}`;

        const content =
          t === "checkbox" ? (
            <div className={cn(INNER, "justify-center")}>
              <CheckboxBox
                data-cell-focus
                checked={v === true}
                tabIndex={active ? 0 : -1}
                aria-label={cellName}
                aria-readonly={!editable || undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={desc ? descId : undefined}
                onChange={(e) => api.current?.clickToggle(r, c, (e.nativeEvent as MouseEvent).detail === 0)}
                className={cn(!editable && "[&_input]:cursor-default")}
              />
            </div>
          ) : (
            <div className={cn(INNER, numeric && "justify-end tabular-nums")}>
              {error && <Icon icon={CircleAlert} className={cn("shrink-0 text-destructive", numeric && "mr-auto")} />}
              {text ? <span className="truncate">{text}</span> : editable && col.placeholder ? <span className="truncate text-muted-foreground">{col.placeholder}</span> : null}
            </div>
          );

        return (
          <td
            key={col.key}
            role={c === rowHeader ? "rowheader" : "gridcell"}
            data-cell={`${r}:${c}`}
            tabIndex={t === "checkbox" ? undefined : active ? 0 : -1}
            aria-readonly={!editable || undefined}
            aria-invalid={error ? true : undefined}
            aria-selected={inRange || undefined}
            aria-describedby={desc && t !== "checkbox" ? descId : undefined}
            className={cn(
              TD,
              "outline-none select-none",
              L.left != null && "sticky z-[5]",
              inRange ? RANGE_BG : editable ? "bg-background" : "bg-muted",
              col.compute && "font-medium",
            )}
            style={{ left: L.left, boxShadow: shadows.length ? shadows.join(", ") : undefined }}
            title={t === "checkbox" && (error || changed) ? (error ?? `Was ${was || "empty"}`) : undefined}
          >
            {/* Not on yes/no cells: there the box itself has focus, and wrapping it would remount it */}
            {(error || changed) && t !== "checkbox" ? (
              <Tooltip key={String(active && showRing && !isEditing && !!error)} content={error ?? `Was ${was || "empty"}`} defaultOpen={active && showRing && !isEditing && !!error}>
                {content}
              </Tooltip>
            ) : (
              content
            )}
            {changed && <span aria-hidden className={CHANGED_MARK} />}
            {desc && (
              <span id={descId} hidden>
                {desc}
              </span>
            )}
            {isEditing && editing && <CellEditor column={col} editing={editing} label={cellName} width={L.width} cellH={cellH} invalid={!!error} api={api} />}
            {active && (showRing || isEditing) && <span aria-hidden className={RING} />}
          </td>
        );
      })}
    </tr>
  );
}

const RowView = memo(RowViewInner) as typeof RowViewInner;

// -------------------------------------------------------------------------------------------------
// The editors: library controls laid exactly over the cell

/** Undo the control's own box: no border colour, no outline (the cell's ring shows focus), the cell's background */
const EDITOR = cn(OVER, "z-[2] max-w-none border-transparent bg-background has-[:focus-visible]:outline-0");

interface CellEditorProps<T> {
  column: EditableColumn<T>;
  editing: Editing;
  label: string;
  width: number;
  cellH: number;
  invalid: boolean;
  api: RefObject<TableApi | null>;
}

/** Put the caret at the end, and focus: the editor appears under the keyboard */
function useEditorFocus<E extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(after?: (el: E) => void) {
  const ref = useRef<E>(null);
  const done = useRef(after);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (!(el instanceof HTMLSelectElement)) {
      const n = el.value.length;
      el.setSelectionRange(n, n);
    }
    done.current?.(el);
  }, []);
  return ref;
}

function CellEditor<T>({ column, editing, label, width, cellH, invalid, api }: CellEditorProps<T>) {
  switch (columnType(column)) {
    case "longtext":
      return <LongTextEditor editing={editing} label={label} width={width} cellH={cellH} />;
    case "select":
      return <SelectEditor column={column} editing={editing} label={label} api={api} />;
    case "date":
      return <DateEditor column={column} editing={editing} label={label} api={api} />;
    default:
      return <TextEditor column={column} editing={editing} label={label} invalid={invalid} />;
  }
}

function TextEditor<T>({ column, editing, label, invalid }: { column: EditableColumn<T>; editing: Editing; label: string; invalid: boolean }) {
  const ref = useEditorFocus<HTMLInputElement>();
  const numeric = isNumeric(column);
  return (
    <span data-cell-editor className="contents">
      <Input
        ref={ref}
        data-editor-input
        defaultValue={editing.text}
        aria-label={label}
        aria-invalid={invalid || undefined}
        inputMode={numeric ? "decimal" : undefined}
        autoComplete="off"
        spellCheck={columnType(column) === "text" ? undefined : false}
        className={EDITOR}
        inputClassName={cn(numeric && "text-right tabular-nums")}
      />
    </span>
  );
}

function LongTextEditor({ editing, label, width, cellH }: { editing: Editing; label: string; width: number; cellH: number }) {
  // The layer's own element finds the cell: it sits inside it in the DOM (a parent's ref isn't set yet when the layer places itself)
  const layer = useRef<HTMLDivElement>(null);
  const ref = useEditorFocus<HTMLTextAreaElement>();
  // Over the cell's grid lines, growing down (or up, near the bottom of the window)
  const cellRect = () => {
    const td = layer.current?.closest("td");
    if (!td) return null;
    const b = td.getBoundingClientRect();
    return { getBoundingClientRect: () => new DOMRect(b.left - 1, b.top - 1, b.width + 1, b.height + 1) };
  };
  return (
    <span className="contents">
      <Floating
        ref={layer}
        open
        mode="manual"
        data-cell-editor
        anchor={cellRect}
        side="bottom"
        align="start"
        offset={-(cellH + 1)}
        className="border-2 border-ring"
        style={{ width: Math.max(width + 1, 320) }}
      >
        <Textarea
          ref={ref}
          data-editor-input
          defaultValue={editing.text}
          aria-label={label}
          rows={4}
          className="resize-none border-0 bg-background px-[calc(var(--ctl-inset)-1px)] py-[calc((var(--ctl-h)-1lh)/2-2px)] text-(length:--ctl-text) leading-tight focus-visible:outline-0"
        />
        <span className="block border-t border-border bg-muted px-[calc(var(--ctl-inset)-1px)] py-0.5 text-[11px] text-muted-foreground">
          <Kbd>Enter</Kbd> saves, <Kbd keys={["Shift", "Enter"]} /> new line, <Kbd>Esc</Kbd> cancels
        </span>
      </Floating>
    </span>
  );
}

interface EditorWithApi<T> {
  column: EditableColumn<T>;
  editing: Editing;
  label: string;
  api: RefObject<TableApi | null>;
}

function SelectEditor<T>({ column, editing, label, api }: EditorWithApi<T>) {
  const options = columnOptions(column);
  const current = options.find((o) => o.value === editing.text || o.label === editing.text)?.value ?? "";
  // Typing a letter picks the first choice that starts with it
  const typed = editing.mode === "replace" ? editing.text.toLowerCase() : "";
  const start = typed ? (options.find((o) => o.label.toLowerCase().startsWith(typed))?.value ?? current) : current;
  const picking = useRef(false);
  const ref = useEditorFocus<HTMLSelectElement>((el) => {
    if (!editing.openList) return;
    try {
      el.showPicker();
      picking.current = true;
    } catch {
      // Not every browser can open a select's list from script; the arrow keys and Alt+Down still work
    }
  });
  return (
    <span data-cell-editor className="contents">
      <Select
        ref={ref}
        data-editor-input
        aria-label={label}
        options={options}
        placeholder="—"
        defaultValue={start}
        onPointerDown={() => {
          picking.current = true;
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "F4" || (e.altKey && e.key === "ArrowDown")) picking.current = true;
        }}
        onChange={() => {
          // Chosen from the open list: done. (With the arrow keys on a closed select, wait for Enter.)
          if (picking.current) {
            picking.current = false;
            api.current?.commitEdit();
          }
        }}
        className={cn(EDITOR, "pl-(--ctl-inset) hover:bg-background")}
      />
    </span>
  );
}

function DateEditor<T>({ column, editing, label, api }: EditorWithApi<T>) {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(editing.text) ? editing.text : null;
  const ref = useEditorFocus<HTMLInputElement>((el) => {
    // The picker keeps its own text, starting from the date; set what was typed through a real input event.
    if (el.value === editing.text) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, editing.text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.setSelectionRange(editing.text.length, editing.text.length);
  });
  return (
    <span data-cell-editor className="contents">
      <DatePicker
        ref={ref}
        data-editor-input
        defaultValue={iso}
        aria-label={label}
        label={column.header}
        min={typeof column.min === "string" ? column.min : undefined}
        max={typeof column.max === "string" ? column.max : undefined}
        onChange={(d) => {
          // A day chosen in the calendar commits at once; typed text waits for Enter, Tab or leaving
          if (d && document.activeElement?.closest("[popover]")) {
            const el = ref.current;
            if (!el) return;
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, d);
            api.current?.commitEdit();
          }
        }}
        className={cn(
          OVER,
          "z-[2] flex [&>[data-slot=input]]:h-full [&>[data-slot=input]]:w-auto [&>[data-slot=input]]:flex-1 [&>[data-slot=input]]:border-transparent [&>[data-slot=input]]:has-[:focus-visible]:outline-0",
          "[&>button]:h-full [&>button]:border-y-transparent [&>button]:border-r-transparent [&>button]:bg-background",
        )}
      />
    </span>
  );
}
