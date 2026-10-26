import type { Metadata } from "next";
import { CUSTOMERS } from "@/registry/plainspoken/blocks/app/data";
import { money } from "@/registry/plainspoken/blocks/app/format";
import { AppCustomerTable } from "@/registry/plainspoken/blocks/app/customer-table";
import { AppPage, AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";

export const metadata: Metadata = {
  title: "Customers · App skeleton",
  description: "The customer list of Tally, a demo invoicing app built from plainspoken-ui: a data table with filters, sorting, selection and a details drawer.",
};

export default function CustomersPage() {
  const owed = CUSTOMERS.reduce((s, c) => s + c.balance, 0);
  return (
    <AppPage>
      <AppPageHeader
        crumbs={[{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Customers" }]}
        title="Customers"
        description={`${CUSTOMERS.length} customers, ${CUSTOMERS.filter((c) => c.status === "Lead").length} of them leads. ${money(owed)} owed in all.`}
      />
      <AppCustomerTable />
    </AppPage>
  );
}
