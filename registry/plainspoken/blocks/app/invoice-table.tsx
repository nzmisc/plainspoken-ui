import Link from "next/link";
import { APP_TODAY, customerById, type Invoice } from "@/registry/plainspoken/blocks/app/data";
import { day, dueIn, INVOICE_VARIANT, money } from "@/registry/plainspoken/blocks/app/format";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { SimpleTable, type TableColumn } from "@/registry/plainspoken/ui/table";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

/** An invoice's state as a badge: green Paid, blue Open, red Overdue, gray Draft */
export function InvoiceStatusBadge({ status }: { status: Invoice["status"] }) {
  return <Badge variant={INVOICE_VARIANT[status]}>{status}</Badge>;
}

export interface AppInvoiceTableProps {
  invoices: Invoice[];
  /** A customer column, linking to each customer's page. Leave off on a customer's own page. */
  showCustomer?: boolean;
  today?: string;
  /** No outer border, inside a flush Panel */
  frameless?: boolean;
  /** Only number, due date, amount and state: for a drawer or a narrow column */
  short?: boolean;
  caption?: string;
  className?: string;
}

/**
 * Invoices as a plain table: number, customer, issued, due (with "12 days late" for overdue
 * ones), amount right-aligned in tabular figures, and the state as a badge. Renders on the
 * server; the description and issue date drop away on phones.
 */
export function AppInvoiceTable({ invoices, showCustomer = true, today = APP_TODAY, frameless, short = false, caption, className }: AppInvoiceTableProps) {
  const all: TableColumn<Invoice>[] = [
    { key: "number", header: "Invoice", cell: (i) => <span className="font-mono text-[13px] whitespace-nowrap">{i.number}</span> },
    ...(showCustomer
      ? [
          {
            key: "customer",
            header: "Customer",
            cell: (i: Invoice) => (
              <Link href={`/demos/app/customers/${i.customer}`} className={linkVariants()}>
                {customerById(i.customer)?.name}
              </Link>
            ),
          },
        ]
      : [{ key: "description", header: "For", cell: (i: Invoice) => i.description, className: "max-sm:hidden" }]),
    { key: "issued", header: "Issued", cell: (i) => <span className="whitespace-nowrap">{day(i.issued)}</span>, className: "max-md:hidden" },
    {
      key: "due",
      header: "Due",
      cell: (i) => (
        <span className="whitespace-nowrap">
          {day(i.due)}
          {i.status === "Overdue" && <span className="block text-[12px] text-destructive">{dueIn(i.due, today)}</span>}
        </span>
      ),
    },
    { key: "amount", header: "Amount", numeric: true, cell: (i) => money(i.amount) },
    { key: "status", header: "State", cell: (i) => <InvoiceStatusBadge status={i.status} /> },
  ];
  const columns = short ? all.filter((c) => ["number", "due", "amount", "status"].includes(c.key)) : all;
  return <SimpleTable columns={columns} rows={invoices} rowKey={(i) => i.number} frameless={frameless} caption={caption} empty="No invoices yet." className={className} />;
}
