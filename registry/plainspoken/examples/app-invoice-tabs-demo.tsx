import { AppInvoiceTabs } from "@/registry/plainspoken/blocks/app/invoice-tabs";

/** Tabs by state with counts; ←/→ move between them. */
export default function AppInvoiceTabsDemo() {
  return <AppInvoiceTabs pageHref={(p) => `/demos/app/invoices?page=${p}`} />;
}
