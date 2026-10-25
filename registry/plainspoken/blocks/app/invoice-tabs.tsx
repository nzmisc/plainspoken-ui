import { INVOICES, type Invoice, type InvoiceStatus } from "@/registry/plainspoken/blocks/app/data";
import { money } from "@/registry/plainspoken/blocks/app/format";
import { AppInvoiceTable } from "@/registry/plainspoken/blocks/app/invoice-table";
import { Pagination } from "@/registry/plainspoken/ui/pagination";
import { Tabs } from "@/registry/plainspoken/ui/tabs";

const VIEWS: { id: string; label: string; status?: InvoiceStatus }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open", status: "Open" },
  { id: "overdue", label: "Overdue", status: "Overdue" },
  { id: "paid", label: "Paid", status: "Paid" },
  { id: "draft", label: "Drafts", status: "Draft" },
];

export interface AppInvoiceTabsProps {
  invoices?: Invoice[];
  /** The tab shown first */
  defaultTab?: string;
  /** Where page links go: `(page) => "?page=" + page` */
  pageHref?: (page: number) => string;
  /** Rows per page. Default 10. */
  pageSize?: number;
}

/**
 * Invoices in tabs by state (All, Open, Overdue, Paid, Drafts), each tab with its count and a
 * line of totals over the table, and page links under it when there's more than a page (this
 * demo always shows the first page). Renders on the server; the tabs switch
 * in the browser.
 */
export function AppInvoiceTabs({ invoices = INVOICES, defaultTab = "all", pageHref = (p) => `?page=${p}`, pageSize = 10 }: AppInvoiceTabsProps) {
  return (
    <Tabs
      label="Invoices by state"
      defaultValue={defaultTab}
      tabs={VIEWS.map((v) => {
        const rows = v.status ? invoices.filter((i) => i.status === v.status) : invoices;
        const total = rows.reduce((s, i) => s + i.amount, 0);
        return {
          id: v.id,
          label: v.label,
          count: rows.length,
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] text-muted-foreground">
                {rows.length} {rows.length === 1 ? "invoice" : "invoices"}, {money(total)} in all
              </p>
              <AppInvoiceTable invoices={rows.slice(0, pageSize)} />
              {rows.length > pageSize && (
                <Pagination page={1} pageCount={Math.ceil(rows.length / pageSize)} total={rows.length} pageSize={pageSize} href={pageHref} label={`${v.label} invoices: pages`} />
              )}
            </div>
          ),
        };
      })}
    />
  );
}
