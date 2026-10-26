"use client";

import { useId, useState, type FormEvent } from "react";
import { BookmarkPlus, RotateCcw, X } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { applyFilters, normalizeFilter, type Filters, type SortKey } from "@/registry/plainspoken/lib/data-table";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import type { DataTableState } from "@/registry/plainspoken/ui/data-table";
import { Input } from "@/registry/plainspoken/ui/input";
import { MenuButton } from "@/registry/plainspoken/ui/menu-button";
import { GRID_NOW, ORDERS, type Order } from "@/registry/plainspoken/blocks/grid/data";
import { count } from "@/registry/plainspoken/blocks/grid/format";
import { ORDER_COLUMNS } from "@/registry/plainspoken/blocks/grid/orders-table";
import { cn } from "@/lib/utils";

/** A saved view: what the table sorts and filters by, and which columns it shows. Plain data. */
export interface GridView {
  id: string;
  name: string;
  sort: SortKey[];
  filters: Filters;
  quick?: string;
  /** Column keys in order; left out, the table's own order */
  columnOrder?: string[];
  /** Left out, the columns hidden by default */
  hiddenColumns?: string[];
  /** Made by the user, so it can be deleted */
  custom?: boolean;
}

/** The shop's three views: everything, what arrived late, and the big orders */
export const GRID_VIEWS: GridView[] = [
  {
    id: "all",
    name: "All orders",
    sort: [{ key: "placed", dir: "desc" }],
    filters: {},
    hiddenColumns: ["email", "city", "subtotal", "discount", "coupon", "shipping", "delivered", "tracking", "rating"],
  },
  {
    id: "late",
    name: "Late",
    sort: [
      { key: "late", dir: "desc" },
      { key: "promised", dir: "asc" },
    ],
    filters: { late: { kind: "conditions", conditions: [{ op: "gte", value: "1" }] } },
    columnOrder: ["id", "placed", "customer", "country", "status", "carrier", "promised", "delivered", "late", "tracking", "total"],
    hiddenColumns: ["email", "city", "channel", "items", "subtotal", "discount", "coupon", "shipping", "payment", "rating"],
  },
  {
    id: "high-value",
    name: "High value",
    sort: [
      { key: "total", dir: "desc" },
      { key: "placed", dir: "desc" },
    ],
    filters: { total: { kind: "conditions", conditions: [{ op: "gte", value: "300" }] } },
    columnOrder: ["id", "placed", "customer", "email", "country", "items", "subtotal", "discount", "coupon", "total", "payment", "status"],
    hiddenColumns: ["city", "channel", "shipping", "carrier", "promised", "delivered", "late", "tracking", "rating"],
  },
];

/** A view's state in a form that compares equal when the table shows the same thing */
export function viewKey(v: { sort: SortKey[]; filters: Filters; quick?: string; columnOrder?: string[]; hiddenColumns?: string[] }, allKeys: string[], defaultHidden: string[]): string {
  const filters = Object.keys(v.filters)
    .sort()
    .map((k) => [k, normalizeFilter(v.filters[k])])
    .filter(([, f]) => f != null);
  const order = v.columnOrder ? [...v.columnOrder, ...allKeys.filter((k) => !v.columnOrder!.includes(k))] : allKeys;
  const hidden = new Set(v.hiddenColumns ?? defaultHidden);
  return JSON.stringify([v.sort, filters, (v.quick ?? "").trim(), order.filter((k) => !hidden.has(k))]);
}

const ALL_KEYS = ORDER_COLUMNS.map((c) => c.key);
const DEFAULT_HIDDEN = ORDER_COLUMNS.filter((c) => c.defaultHidden).map((c) => c.key);

/** How many orders each view shows, by view id */
export function countViews(views: GridView[], orders: Order[] = ORDERS): Record<string, number> {
  return Object.fromEntries(
    views.map((v) => {
      const hidden = new Set(v.hiddenColumns ?? DEFAULT_HIDDEN);
      const visible = new Set(ALL_KEYS.filter((k) => !hidden.has(k)));
      return [v.id, applyFilters(orders, ORDER_COLUMNS, v.filters, v.quick ?? "", visible, GRID_NOW).length];
    }),
  );
}

/** Whether a table state shows what the view does (same sort, filters, quick filter and visible columns in order) */
export function isSameView(state: Parameters<typeof viewKey>[0], view: GridView): boolean {
  return viewKey(state, ALL_KEYS, DEFAULT_HIDDEN) === viewKey(view, ALL_KEYS, DEFAULT_HIDDEN);
}

/** A table state, saved under a name */
export function viewFromState(name: string, s: DataTableState, id: string): GridView {
  return { id, name, sort: s.sort, filters: s.filters, quick: s.quick || undefined, columnOrder: s.columnOrder, hiddenColumns: s.hiddenColumns, custom: true };
}

export interface GridViewsProps {
  views: GridView[];
  activeId: string;
  /** Rows each view shows, by id */
  counts?: Record<string, number>;
  /** The table no longer matches the active view: offers Revert and Save as view */
  edited?: boolean;
  onSelect: (id: string) => void;
  onRevert?: () => void;
  /** Save what the table shows as a new view with this name */
  onSave?: (name: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

/**
 * The saved views over a table, as a row of tabs: each a preset of sort, filters and columns,
 * with how many rows it shows. Once the table is changed it says "edited", with Revert to go back
 * to the view and "Save as view" to keep the change under a new name. Views you saved have a ×.
 * Navigation look (bold and underlined when current, aria-current), not buttons: they switch what
 * the table below shows.
 */
export function GridViews({ views, activeId, counts, edited = false, onSelect, onRevert, onSave, onDelete, className }: GridViewsProps) {
  return (
    <div data-slot="grid-views" className={cn("ctl-sm flex min-w-0 flex-wrap items-end gap-x-3 gap-y-1 border-b border-border", className)}>
      <nav aria-label="Saved views" className="-mb-px min-w-0 overflow-x-auto">
        <ul className="flex">
          {views.map((v) => {
            const on = v.id === activeId;
            return (
              <li key={v.id} className={cn("flex items-center border-b-2", on ? "border-foreground" : "border-transparent")}>
                <button
                  type="button"
                  aria-current={on || undefined}
                  onClick={() => onSelect(v.id)}
                  className={cn(
                    "flex h-8 cursor-pointer items-center gap-1.5 px-2.5 text-[14px] whitespace-nowrap hover:bg-muted focus-visible:-outline-offset-2",
                    on ? "font-bold" : "text-muted-foreground hover:text-foreground",
                    FOCUS_RING,
                  )}
                >
                  {v.name}
                  {counts?.[v.id] != null && <span className="text-[12px] font-normal text-muted-foreground tabular-nums">{count(counts[v.id])}</span>}
                  {on && edited && <span className="text-[12px] font-normal text-warning">edited</span>}
                </button>
                {v.custom && onDelete && <IconButton variant="ghost" size="xs" icon={X} label={`Delete the view “${v.name}”`} onClick={() => onDelete(v.id)} className="mr-1" />}
              </li>
            );
          })}
        </ul>
      </nav>
      {edited && (
        <span className="mb-1 flex items-center gap-1.5">
          {onRevert && (
            <Button variant="ghost" icon={RotateCcw} onClick={onRevert}>
              Revert
            </Button>
          )}
          {onSave && <SaveView onSave={onSave} taken={views.map((v) => v.name.toLowerCase())} />}
        </span>
      )}
    </div>
  );
}

function SaveView({ onSave, taken }: { onSave: (name: string) => void; taken: string[] }) {
  const id = useId();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const clash = taken.includes(name.trim().toLowerCase());
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || clash) return;
    onSave(name.trim());
    setName("");
    setOpen(false);
  };
  return (
    <MenuButton icon={BookmarkPlus} label="Save as view" align="end" panelClassName="w-64" onOpenChange={setOpen}>
      {open && (
        <form onSubmit={submit} className="flex flex-col gap-1.5">
          <label htmlFor={id} className="font-semibold">
            Name of the view
          </label>
          <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Returns this month" invalid={clash} aria-describedby={`${id}-hint`} />
          <p id={`${id}-hint`} className={cn("text-[12px]", clash ? "text-destructive" : "text-muted-foreground")}>
            {clash ? "There is a view with that name already." : "Keeps the sort, filters and columns as they are now."}
          </p>
          <Button type="submit" variant="primary" disabled={!name.trim() || clash} className="self-end">
            Save view
          </Button>
        </form>
      )}
    </MenuButton>
  );
}
