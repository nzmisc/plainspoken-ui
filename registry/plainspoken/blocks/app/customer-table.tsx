"use client";

import { useState } from "react";
import { Mail } from "@/registry/plainspoken/lib/icons";
import { CUSTOMERS, TEAM, type Customer } from "@/registry/plainspoken/blocks/app/data";
import { CUSTOMER_VARIANT, day, money, ms } from "@/registry/plainspoken/blocks/app/format";
import { AppCustomerDrawer } from "@/registry/plainspoken/blocks/app/customer-drawer";
import { NewCustomerButton } from "@/registry/plainspoken/blocks/app/new-customer";
import { Button } from "@/registry/plainspoken/ui/button";
import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";
import { Status, type StatusVariant } from "@/registry/plainspoken/ui/status";

export interface AppCustomerTableProps {
  customers?: Customer[];
  /** Ticked at first, to show the selection bar */
  defaultSelected?: string[];
  /** The customer whose drawer is open at first */
  defaultOpen?: string | null;
  className?: string;
}

/**
 * Every customer in a DataTable: filter any column, sort by several, pick columns, tick rows for
 * the bulk actions, export. A click on a row (or Enter on the customer's name) opens their details
 * in a drawer; their state is shown in words with a symbol (Status), money right-aligned.
 */
export function AppCustomerTable({ customers = CUSTOMERS, defaultSelected = [], defaultOpen = null, className }: AppCustomerTableProps) {
  const [open, setOpen] = useState<Customer | null>(customers.find((c) => c.id === defaultOpen) ?? null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));

  const columns: DataColumn<Customer>[] = [
    { key: "name", header: "Customer", type: "text", value: (c) => c.name, className: "font-semibold whitespace-nowrap" },
    { key: "contact", header: "Contact", type: "text", value: (c) => c.contact, className: "whitespace-nowrap" },
    { key: "email", header: "Email", type: "text", value: (c) => c.email, defaultHidden: true, className: "font-mono text-[13px]" },
    { key: "city", header: "City", type: "text", value: (c) => c.city, className: "whitespace-nowrap" },
    { key: "country", header: "Country", type: "enum", value: (c) => c.country, defaultHidden: true },
    {
      key: "status",
      header: "State",
      type: "enum",
      value: (c) => c.status,
      options: ["Active", "Overdue", "Lead", "Archived"],
      render: (c) => <Status variant={CUSTOMER_VARIANT[c.status] as StatusVariant}>{c.status.toLowerCase()}</Status>,
    },
    { key: "owner", header: "Owner", type: "enum", value: (c) => c.owner, options: TEAM.filter((t) => t.status === "Active" && t.role !== "Billing").map((t) => t.name), className: "whitespace-nowrap" },
    { key: "balance", header: "Owes", type: "number", value: (c) => c.balance, format: (v) => money(Number(v)) },
    { key: "lifetime", header: "Invoiced", type: "number", value: (c) => c.lifetime, format: (v) => money(Number(v)) },
    {
      key: "last",
      header: "Last invoice",
      type: "date",
      value: (c) => (c.lastInvoice ? ms(c.lastInvoice) : null),
      format: (_, c) => (c.lastInvoice ? day(c.lastInvoice) : ""),
      className: "whitespace-nowrap",
    },
  ];

  return (
    <>
      <DataTable
        label="Customers"
        columns={columns}
        rows={customers}
        rowKey={(c) => c.id}
        onRowClick={setOpen}
        selectable
        selected={selected}
        onSelectionChange={setSelected}
        selectionActions={(rows) => (
          <Button icon={Mail}>
            Send {rows.length === 1 ? "a statement" : `${rows.length} statements`}
          </Button>
        )}
        actions={<NewCustomerButton />}
        initialSort={[{ key: "name", dir: "asc" }]}
        pageSizes={[25, 50, 0]}
        maxHeight="none"
        className={className}
      />
      <AppCustomerDrawer customer={open} onClose={() => setOpen(null)} />
    </>
  );
}
