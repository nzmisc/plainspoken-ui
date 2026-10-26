import { INVOICES } from "@/registry/plainspoken/blocks/app/data";
import { AppInvoiceTable } from "@/registry/plainspoken/blocks/app/invoice-table";

/** Open, paid and overdue invoices; overdue ones say how late they are. */
export default function AppInvoiceTableDemo() {
  return <AppInvoiceTable invoices={INVOICES.filter((i) => ["INV-2026-0164", "INV-2026-0156", "INV-2026-0150", "INV-2026-0128", "INV-2026-0165"].includes(i.number))} />;
}
