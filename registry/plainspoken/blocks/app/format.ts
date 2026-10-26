// How the app blocks say money, dates and states. No React and no clock: "now" is passed in or
// is the demo's fixed APP_NOW, so the server and the browser print the same.
import { daysBetween } from "@/registry/plainspoken/lib/dates";
import type { BadgeVariant } from "@/registry/plainspoken/ui/badge";
import type { CustomerStatus, InvoiceStatus, ProjectStage } from "@/registry/plainspoken/blocks/app/data";

const EUR = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** €12,400 */
export const money = (n: number) => EUR.format(n);

/** €12.4k, for chart axes */
export const moneyShort = (n: number) => (Math.abs(n) >= 1000 ? `€${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `€${n}`);

/** "24 Oct 2026" */
export function day(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

/** "24 Oct" */
export function dayShort(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
}

/** "Oct 2026" for "2026-10" */
export const monthName = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

/** "in 12 days", "today", "3 days late", for a due date */
export function dueIn(due: string, today: string): string {
  const d = daysBetween(today, due);
  if (d === 0) return "due today";
  if (d > 0) return `due in ${d} ${d === 1 ? "day" : "days"}`;
  return `${-d} ${d === -1 ? "day" : "days"} late`;
}

/** Epoch milliseconds for a wall-clock time, read as UTC so it is the same everywhere */
export const ms = (when: string) => Date.parse(`${when.length === 10 ? `${when}T00:00` : when}:00Z`);

export const INVOICE_VARIANT: Record<InvoiceStatus, BadgeVariant> = { Paid: "success", Open: "info", Overdue: "destructive", Draft: "default" };
export const CUSTOMER_VARIANT: Record<CustomerStatus, BadgeVariant> = { Active: "success", Overdue: "destructive", Lead: "info", Archived: "default" };
export const STAGE_VARIANT: Record<ProjectStage, BadgeVariant> = { Planned: "default", "In progress": "info", Review: "warning", Done: "success" };

/** "1 invoice", "3 invoices" */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
