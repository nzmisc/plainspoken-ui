import type { Metadata } from "next";
import { Download } from "@/registry/plainspoken/lib/icons";
import { AppInvoiceTabs } from "@/registry/plainspoken/blocks/app/invoice-tabs";
import { NewInvoiceButton } from "@/registry/plainspoken/blocks/app/new-invoice";
import { AppPage, AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { Button } from "@/registry/plainspoken/ui/button";

export const metadata: Metadata = {
  title: "Invoices · App skeleton",
  description: "The invoices of Tally, a demo invoicing app built from plainspoken-ui: tabs by state, a table with badges, and paging.",
};

export default function InvoicesPage() {
  return (
    <AppPage>
      <AppPageHeader
        crumbs={[{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Invoices" }]}
        title="Invoices"
        description="Everything sent since July, newest first."
        actions={
          <>
            <Button icon={Download}>Export for the accountant</Button>
            <NewInvoiceButton />
          </>
        }
      />
      <AppInvoiceTabs pageHref={(p) => `/demos/app/invoices?page=${p}`} />
    </AppPage>
  );
}
