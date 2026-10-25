import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "@/registry/plainspoken/lib/icons";
import { INVOICES } from "@/registry/plainspoken/blocks/app/data";
import { AppActivityFeed } from "@/registry/plainspoken/blocks/app/activity-feed";
import { AppDueProjects } from "@/registry/plainspoken/blocks/app/due-projects";
import { AppHoursChart } from "@/registry/plainspoken/blocks/app/hours-chart";
import { AppInvoiceStatusChart } from "@/registry/plainspoken/blocks/app/invoice-status-chart";
import { AppInvoiceTable } from "@/registry/plainspoken/blocks/app/invoice-table";
import { NewInvoiceButton } from "@/registry/plainspoken/blocks/app/new-invoice";
import { AppPage, AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { AppRevenueChart } from "@/registry/plainspoken/blocks/app/revenue-chart";
import { AppStats } from "@/registry/plainspoken/blocks/app/stats";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

export const metadata: Metadata = {
  title: "Dashboard · App skeleton",
  description: "The dashboard of Tally, a demo invoicing app built from plainspoken-ui: stats with sparklines, revenue and hours charts, recent activity and the latest invoices.",
};

export default function DashboardPage() {
  return (
    <AppPage>
      <AppPageHeader
        crumbs={[{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Dashboard" }]}
        title="Dashboard"
        description="Saturday 24 October 2026. Figures up to the end of yesterday."
        actions={
          <>
            <Link href="/demos/app/invoices" className={buttonVariants()}>
              <Icon icon={Receipt} />
              All invoices
            </Link>
            <NewInvoiceButton />
          </>
        }
      />
      <AppStats className="mb-4" />
      <div className="grid gap-4 lg:grid-cols-3">
        <AppRevenueChart className="lg:col-span-2" />
        <AppInvoiceStatusChart />
        <Panel
          title="Latest invoices"
          flush
          actions={
            <Link href="/demos/app/invoices" className={linkVariants({ className: "text-[13px]" })}>
              View all
            </Link>
          }
          className="lg:col-span-2"
        >
          <AppInvoiceTable invoices={INVOICES.slice(0, 7)} frameless />
        </Panel>
        <AppActivityFeed />
        <AppHoursChart className="lg:col-span-2" />
        <AppDueProjects />
      </div>
    </AppPage>
  );
}
