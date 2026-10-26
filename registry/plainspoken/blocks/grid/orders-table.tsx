"use client";

import { Star } from "@/registry/plainspoken/lib/icons";
import { CARRIERS, CHANNELS, ORDERS, PAYMENTS, STATUSES, trackingUrl, type Order } from "@/registry/plainspoken/blocks/grid/data";
import { isoDateTime, isoDay, money, STATUS_ICON, STATUS_VARIANT } from "@/registry/plainspoken/blocks/grid/format";
import { DataTable, type DataColumn, type DataTableProps } from "@/registry/plainspoken/ui/data-table";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Status } from "@/registry/plainspoken/ui/status";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

const EURO = '"€"#,##0.00';
const moneyCol = (key: keyof Order & string, header: string, width: number, value: (o: Order) => number | null): DataColumn<Order> => ({
  key,
  header,
  type: "number",
  value,
  format: (v) => (v == null ? "" : money(v as number)),
  summary: "sum",
  xlsxFormat: EURO,
  width,
});

/**
 * The order table's columns: text, numbers, money, dates, states and links, twenty in all. Each
 * has a width, so the layout is fixed from the first render and pages don't jump.
 */
export const ORDER_COLUMNS: DataColumn<Order>[] = [
  { key: "id", header: "Order", type: "text", value: (o) => o.id, className: "font-mono text-[13px]", width: 96 },
  { key: "placed", header: "Placed", type: "date", value: (o) => o.placed, format: (v) => isoDateTime(v as number), className: "tabular-nums", width: 148 },
  { key: "customer", header: "Customer", type: "text", value: (o) => o.customer, width: 150 },
  {
    key: "email",
    header: "Email",
    type: "text",
    value: (o) => o.email,
    render: (o) => (
      <a href={`mailto:${o.email}`} className={linkVariants()}>
        {o.email}
      </a>
    ),
    defaultHidden: true,
    width: 210,
  },
  { key: "city", header: "City", type: "text", value: (o) => o.city, defaultHidden: true, width: 112 },
  { key: "country", header: "Country", type: "enum", value: (o) => o.country, width: 120 },
  { key: "channel", header: "Channel", type: "enum", value: (o) => o.channel, options: CHANNELS, width: 112 },
  { key: "items", header: "Items", type: "number", value: (o) => o.items, summary: "sum", width: 88 },
  moneyCol("subtotal", "Subtotal", 112, (o) => o.subtotal),
  moneyCol("discount", "Discount", 112, (o) => o.discount || null),
  {
    key: "coupon",
    header: "Coupon",
    type: "enum",
    value: (o) => o.coupon,
    render: (o) => (o.coupon ? <code className="text-[13px]">{o.coupon}</code> : null),
    defaultHidden: true,
    width: 112,
  },
  { ...moneyCol("shipping", "Shipping", 112, (o) => o.shipping), defaultHidden: true },
  { ...moneyCol("total", "Total", 112, (o) => o.total), className: "font-semibold" },
  { key: "payment", header: "Payment", type: "enum", value: (o) => o.payment, options: PAYMENTS, width: 112 },
  {
    key: "status",
    header: "Status",
    type: "enum",
    value: (o) => o.status,
    options: STATUSES,
    render: (o) => <Status variant={STATUS_VARIANT[o.status]} icon={STATUS_ICON[o.status]}>{o.status.toLowerCase()}</Status>,
    width: 120,
  },
  { key: "carrier", header: "Carrier", type: "enum", value: (o) => o.carrier, options: CARRIERS, width: 120 },
  { key: "promised", header: "Promised", type: "date", value: (o) => o.promised, format: (v) => isoDay(v as number), className: "tabular-nums", width: 112 },
  {
    key: "delivered",
    header: "Delivered",
    type: "date",
    value: (o) => o.delivered,
    format: (v) => (v == null ? "" : isoDay(v as number)),
    className: "tabular-nums",
    defaultHidden: true,
    width: 112,
  },
  {
    key: "late",
    header: "Days late",
    type: "number",
    value: (o) => o.late,
    render: (o) => (o.late ? <b className="text-warning">{o.late}</b> : o.late === 0 ? <span className="text-muted-foreground">0</span> : null),
    summary: "average",
    width: 112,
  },
  {
    key: "tracking",
    header: "Tracking",
    type: "text",
    value: (o) => o.tracking,
    render: (o) => {
      const url = trackingUrl(o);
      return url ? (
        <a href={url} className={linkVariants({ className: "font-mono text-[13px]" })}>
          {o.tracking}
        </a>
      ) : null;
    },
    defaultHidden: true,
    width: 140,
  },
  {
    key: "rating",
    header: "Rating",
    type: "number",
    value: (o) => o.rating,
    render: (o) =>
      o.rating ? (
        <span title={`${o.rating} of 5 stars`}>
          {o.rating} <Icon icon={Star} label="stars" className="text-muted-foreground" />
        </span>
      ) : null,
    summary: "average",
    defaultHidden: true,
    width: 96,
  },
];

const orderKey = (o: Order) => o.id;

export interface GridOrdersTableProps extends Omit<DataTableProps<Order>, "columns" | "rows" | "rowKey" | "label"> {
  /** Default: the demo's three thousand */
  orders?: Order[];
  /** Name of the table and of downloaded files. Default "Orders". */
  label?: string;
}

/**
 * Brindle & Moss's orders in a DataTable with every feature on: Excel-style filters per column,
 * sorting by several columns, columns to show, hide, reorder and resize, selection, totals of what
 * the filters leave, and export to the clipboard, Excel and CSV. Money is in euros (and exports
 * with a euro format), statuses are words with a symbol, emails and tracking numbers are links.
 * Anything DataTable takes can be passed through: initial sort, filters, columns, widths, and
 * onRowClick for a detail drawer.
 */
export function GridOrdersTable({ orders = ORDERS, label = "Orders", ...rest }: GridOrdersTableProps) {
  return (
    <DataTable
      label={label}
      columns={ORDER_COLUMNS}
      rows={orders}
      rowKey={orderKey}
      selectable
      initialSort={[{ key: "placed", dir: "desc" }]}
      pageSizes={[50, 100, 250, 0]}
      {...rest}
    />
  );
}
