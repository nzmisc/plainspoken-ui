import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CUSTOMERS, INVOICES } from "@/registry/plainspoken/blocks/app/data";
import { AppActivityFeed } from "@/registry/plainspoken/blocks/app/activity-feed";
import { AppCustomerTable } from "@/registry/plainspoken/blocks/app/customer-table";
import { AppDueProjects } from "@/registry/plainspoken/blocks/app/due-projects";
import { AppFrame } from "@/registry/plainspoken/blocks/app/frame";
import { AppHoursChart } from "@/registry/plainspoken/blocks/app/hours-chart";
import { AppInvoiceStatusChart } from "@/registry/plainspoken/blocks/app/invoice-status-chart";
import { AppInvoiceTable } from "@/registry/plainspoken/blocks/app/invoice-table";
import { AppPage, AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { AppProjectBoard } from "@/registry/plainspoken/blocks/app/project-board";
import { AppRevenueChart } from "@/registry/plainspoken/blocks/app/revenue-chart";
import { AppStats } from "@/registry/plainspoken/blocks/app/stats";
import { Button } from "@/registry/plainspoken/ui/button";
import { Panel } from "@/registry/plainspoken/ui/panel";

const meta: Meta<typeof AppFrame> = {
  title: "Demos/App skeleton",
  component: AppFrame,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/demos/app" } } },
  args: { className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof AppFrame>;

const crumbs = (label: string) => [{ label: "Brightwater Studio", href: "/demos/app" }, { label }];

/** The dashboard of Tally, the demo's invoicing app, as at /demos/app. */
export const Dashboard: Story = {
  render: (args) => (
    <AppFrame {...args}>
      <AppPage>
        <AppPageHeader crumbs={crumbs("Dashboard")} title="Dashboard" description="Saturday 24 October 2026. Figures up to the end of yesterday." actions={<Button variant="primary">New invoice</Button>} />
        <AppStats className="mb-4" />
        <div className="grid gap-4 lg:grid-cols-3">
          <AppRevenueChart className="lg:col-span-2" />
          <AppInvoiceStatusChart />
          <Panel title="Latest invoices" flush className="lg:col-span-2">
            <AppInvoiceTable invoices={INVOICES.slice(0, 7)} frameless />
          </Panel>
          <AppActivityFeed />
          <AppHoursChart className="lg:col-span-2" />
          <AppDueProjects />
        </div>
      </AppPage>
    </AppFrame>
  ),
};

/** The customers page: a data table, with a drawer per customer. */
export const Customers: Story = {
  parameters: { nextjs: { navigation: { pathname: "/demos/app/customers" } } },
  render: (args) => (
    <AppFrame {...args}>
      <AppPage>
        <AppPageHeader crumbs={crumbs("Customers")} title="Customers" description={`${CUSTOMERS.length} customers.`} />
        <AppCustomerTable />
      </AppPage>
    </AppFrame>
  ),
};

/** The projects board. */
export const Projects: Story = {
  parameters: { nextjs: { navigation: { pathname: "/demos/app/projects" } } },
  render: (args) => (
    <AppFrame {...args}>
      <AppPage className="max-w-7xl">
        <AppPageHeader crumbs={crumbs("Projects")} title="Projects" />
        <AppProjectBoard />
      </AppPage>
    </AppFrame>
  ),
};

/** The dashboard on a phone: the sidebar is a drawer. */
export const Phone: Story = { ...Dashboard, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
