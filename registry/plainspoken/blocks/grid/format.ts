// How the grid blocks write money, dates and states. Fixed locales, so the server and the browser
// print the same text.
import { CircleCheck, CircleX, Clock, CreditCard, Package, RotateCcw, Truck, type Glyph } from "@/registry/plainspoken/lib/icons";
import type { StatusVariant } from "@/registry/plainspoken/ui/status";
import type { OrderStatus } from "@/registry/plainspoken/blocks/grid/data";

const EUR = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** €1,234.50 */
export const money = (n: number) => EUR.format(n);

/** 2026-10-24, the local day */
export function isoDay(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 2026-10-24 09:41, local wall-clock time */
export const isoDateTime = (t: number) => {
  const d = new Date(t);
  return `${isoDay(t)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Sat 24 Oct 2026, 09:41 (or without the time) */
export function longDate(t: number, time = true): string {
  const d = new Date(t);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${wd} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}${time ? `, ${pad(d.getHours())}:${pad(d.getMinutes())}` : ""}`;
}

/** 3,000 */
export const count = (n: number) => n.toLocaleString("en-US");

export const STATUS_VARIANT: Record<OrderStatus, StatusVariant> = {
  Pending: "default",
  Paid: "info",
  Packed: "info",
  Shipped: "info",
  Delivered: "success",
  Returned: "warning",
  Cancelled: "destructive",
};

/** A symbol per state, so they differ by more than colour */
export const STATUS_ICON: Record<OrderStatus, Glyph> = {
  Pending: Clock,
  Paid: CreditCard,
  Packed: Package,
  Shipped: Truck,
  Delivered: CircleCheck,
  Returned: RotateCcw,
  Cancelled: CircleX,
};
