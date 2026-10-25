"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Store } from "@/registry/plainspoken/lib/icons";
import { GRID_NOW, ORDERS, SHOP, type Order } from "@/registry/plainspoken/blocks/grid/data";
import { count } from "@/registry/plainspoken/blocks/grid/format";
import { GridOrderDrawer } from "@/registry/plainspoken/blocks/grid/order-drawer";
import { GridOrdersTable } from "@/registry/plainspoken/blocks/grid/orders-table";
import { countViews, GRID_VIEWS, GridViews, isSameView, viewFromState, type GridView } from "@/registry/plainspoken/blocks/grid/views";
import type { DataTableState } from "@/registry/plainspoken/ui/data-table";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface GridAppProps {
  /** Default: the demo's three thousand orders */
  orders?: Order[];
  /** The saved view shown first: "all", "late" or "high-value" */
  defaultViewId?: string;
  /** The order whose drawer is open at first */
  defaultOpenId?: string | null;
  /** Controls at the right end of the header, e.g. a theme switch */
  actions?: ReactNode;
  className?: string;
}

/**
 * The whole data grid: an online shop's orders with saved views over them (All orders, Late, High
 * value, and any you save), a table of thousands of rows that fills the page (rows are drawn as
 * they scroll into view), totals under it, and a drawer with the order's details when a row is
 * clicked. Column widths carry over from one view to the next. Everything stays in the page:
 * nothing is saved anywhere.
 */
export function GridApp({ orders = ORDERS, defaultViewId = "all", defaultOpenId = null, actions, className }: GridAppProps) {
  const [views, setViews] = useState<GridView[]>(GRID_VIEWS);
  const [viewId, setViewId] = useState(defaultViewId);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<DataTableState | null>(null);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const [viewRows, setViewRows] = useState<Order[]>(orders);

  const view = views.find((v) => v.id === viewId) ?? views[0];
  const edited = state != null && !isSameView(state, view);
  const counts = useMemo(() => countViews(views, orders), [views, orders]);

  const show = (id: string) => {
    setViewId(id);
    setState(null);
    setRevision((r) => r + 1);
  };
  const openOrder = useCallback((o: Order) => setOpenId(o.id), []);
  const open = openId ? (orders.find((o) => o.id === openId) ?? null) : null;
  const at = open ? viewRows.indexOf(open) : -1;

  const first = orders.reduce((m, o) => Math.min(m, o.placed), Infinity);
  const from = Number.isFinite(first) ? new Date(first) : null;

  return (
    <div data-slot="grid-app" className={cn("flex min-h-0 flex-col bg-background text-[14px]", className)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2 sm:px-4">
        <span className="flex items-center gap-1.5 font-bold">
          <Icon icon={Store} />
          {SHOP.name}
        </span>
        <span aria-hidden className="text-muted-foreground">
          /
        </span>
        <h1 className="text-[16px] font-bold">Orders</h1>
        <p className="text-[13px] text-muted-foreground max-sm:hidden">
          {count(orders.length)} orders{from ? ` since ${from.getDate()} ${from.toLocaleString("en-GB", { month: "long" })} ${from.getFullYear()}` : ""}
        </p>
        {actions && <span className="ml-auto flex items-center gap-2">{actions}</span>}
      </header>

      <GridViews
        views={views}
        activeId={view.id}
        counts={counts}
        edited={edited}
        onSelect={show}
        onRevert={() => show(view.id)}
        onSave={(name) => {
          if (!state) return;
          const id = `custom-${views.length}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          setViews((vs) => [...vs, viewFromState(name, state, id)]);
          setViewId(id);
          setState(null);
        }}
        onDelete={(id) => {
          setViews((vs) => vs.filter((v) => v.id !== id));
          if (id === view.id) show("all");
        }}
        className="px-3 pt-1 sm:px-4"
      />

      <div className="flex min-h-0 flex-1 flex-col px-3 py-2 sm:px-4">
        <GridOrdersTable
          key={`${view.id}:${revision}`}
          orders={orders}
          initialSort={view.sort}
          initialFilters={view.filters}
          initialQuick={view.quick}
          initialColumnOrder={view.columnOrder}
          initialHiddenColumns={view.hiddenColumns}
          initialWidths={widths}
          onWidthsChange={setWidths}
          onStateChange={setState}
          onViewRowsChange={setViewRows}
          onRowClick={openOrder}
          activeRowKey={openId}
          now={GRID_NOW}
          windowed
          maxHeight="fill"
          pageSizes={[0, 50, 100]}
          className="min-h-0 flex-1"
        />
      </div>

      <GridOrderDrawer
        order={open}
        onClose={() => setOpenId(null)}
        onPrevious={at > 0 ? () => setOpenId(viewRows[at - 1].id) : undefined}
        onNext={at >= 0 && at < viewRows.length - 1 ? () => setOpenId(viewRows[at + 1].id) : undefined}
      />
    </div>
  );
}
