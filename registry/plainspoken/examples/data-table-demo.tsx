"use client";

import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";

interface Order {
  id: string;
  customer: string;
  country: string;
  placed: number;
  items: number;
  total: number;
  status: "Pending" | "Paid" | "Shipped" | "Refunded";
}

/** A seeded random number generator, so the example looks the same on the server and in the browser */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUSTOMERS = [
  ["Hanna Lindqvist", "Sweden"],
  ["Tomás Ferreira", "Portugal"],
  ["Aiko Tanaka", "Japan"],
  ["Grace Okafor", "Nigeria"],
  ["Lukas Brandt", "Germany"],
  ["Maya Goldberg", "United States"],
  ["Pierre Martin", "France"],
  ["Sofia Rossi", "Italy"],
  ["Daniel Novák", "Czechia"],
  ["Emily Clarke", "United Kingdom"],
  ["Rahul Mehta", "India"],
  ["Olivia Brown", "Canada"],
];
const STATUSES: Order["status"][] = ["Pending", "Paid", "Paid", "Shipped", "Shipped", "Shipped", "Refunded"];

const ORDERS: Order[] = (() => {
  const r = rng(42);
  const start = Date.UTC(2026, 8, 1, 12);
  return Array.from({ length: 64 }, (_, i) => {
    const [customer, country] = CUSTOMERS[Math.floor(r() * CUSTOMERS.length)];
    const items = 1 + Math.floor(r() * 5);
    return {
      id: `#${1040 + i}`,
      customer,
      country,
      placed: start + Math.floor(i * 0.85 + r() * 2) * 86_400_000,
      items,
      total: Math.round(items * (12 + r() * 60) * 100) / 100,
      status: STATUSES[Math.floor(r() * STATUSES.length)],
    };
  });
})();

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
/** Dates as YYYY-MM-DD in UTC: the same text wherever the page is rendered */
const day = (t: number) => new Date(t).toISOString().slice(0, 10);

const COLUMNS: DataColumn<Order>[] = [
  { key: "id", header: "Order", type: "text", value: (o) => o.id, className: "font-mono text-[13px]" },
  { key: "customer", header: "Customer", type: "text", value: (o) => o.customer, className: "whitespace-nowrap" },
  { key: "country", header: "Country", type: "enum", value: (o) => o.country, defaultHidden: true },
  { key: "placed", header: "Placed", type: "date", value: (o) => o.placed, format: (v) => day(v as number), className: "whitespace-nowrap tabular-nums" },
  { key: "items", header: "Items", type: "number", value: (o) => o.items },
  { key: "total", header: "Total", type: "number", value: (o) => o.total, format: (v) => money.format(v as number) },
  { key: "status", header: "Status", type: "enum", value: (o) => o.status, options: ["Pending", "Paid", "Shipped", "Refunded"] },
];

export default function DataTableDemo() {
  return (
    <DataTable
      label="Orders"
      columns={COLUMNS}
      rows={ORDERS}
      rowKey={(o) => o.id}
      selectable
      initialSort={[{ key: "placed", dir: "desc" }]}
      initialShowFilters={false}
      pageSizes={[10, 25, 0]}
      maxHeight="none"
    />
  );
}
