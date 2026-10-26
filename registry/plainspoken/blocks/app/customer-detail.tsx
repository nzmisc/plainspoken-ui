import { FolderKanban } from "@/registry/plainspoken/lib/icons";
import { ACTIVITY, APP_TODAY, invoicesFor, PROJECTS, type Customer } from "@/registry/plainspoken/blocks/app/data";
import { day, money, plural } from "@/registry/plainspoken/blocks/app/format";
import { AppActivityFeed } from "@/registry/plainspoken/blocks/app/activity-feed";
import { AppInvoiceTable } from "@/registry/plainspoken/blocks/app/invoice-table";
import { AppProjectCard } from "@/registry/plainspoken/blocks/app/project-card";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

export interface AppCustomerDetailProps {
  customer: Customer;
  today?: string;
  /** The tab shown first: overview, invoices, projects or activity */
  defaultTab?: string;
}

/**
 * The body of a customer's page: four numbers, then tabs for the overview (details, contact and
 * the team's note), their invoices, their projects as cards and what happened lately. Each tab
 * says how many things are in it. Renders on the server; the tabs switch in the browser.
 */
export function AppCustomerDetail({ customer: c, today = APP_TODAY, defaultTab = "overview" }: AppCustomerDetailProps) {
  const invoices = invoicesFor(c.id);
  const projects = PROJECTS.filter((p) => p.customer === c.id);
  const activity = ACTIVITY.filter((a) => a.href?.endsWith(`/${c.id}`) || a.who === c.name);
  const paid = invoices.filter((i) => i.status === "Paid");
  return (
    <div data-slot="app-customer-detail" className="flex flex-col gap-4">
      <StatGroup columns={4}>
        <Stat label="Owes" value={money(c.balance)} hint={c.balance ? plural(invoices.filter((i) => i.status === "Open" || i.status === "Overdue").length, "open invoice") : "all paid"} />
        <Stat label="Invoiced in all" value={money(c.lifetime)} hint={`since ${day(c.since)}`} />
        <Stat label="Paid this year" value={money(paid.reduce((s, i) => s + i.amount, 0))} hint={plural(paid.length, "invoice")} />
        <Stat label="Projects" value={String(projects.length)} hint={`${projects.filter((p) => p.stage !== "Done").length} open`} />
      </StatGroup>
      <Tabs
        label={`${c.name}: sections`}
        variant="plain"
        defaultValue={defaultTab}
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
                <Panel title="Details">
                  <DescriptionList
                    items={[
                      { term: "Company", description: c.name },
                      { term: "Industry", description: c.industry },
                      { term: "Address", description: `${c.city}, ${c.country}` },
                      { term: "Website", description: c.website },
                      { term: "Customer since", description: day(c.since) },
                      { term: "Looked after by", description: c.owner },
                      { term: "Invoices in", description: "Euros, payment in 30 days" },
                    ]}
                  />
                </Panel>
                <div className="flex flex-col gap-4">
                  <Panel title="Contact">
                    <div className="flex items-start gap-2.5">
                      <Avatar name={c.contact} size={36} />
                      <div className="min-w-0">
                        <p className="font-semibold">{c.contact}</p>
                        <p>
                          <a href={`mailto:${c.email}`} className={linkVariants()}>
                            {c.email}
                          </a>
                        </p>
                        <p className="text-muted-foreground tabular-nums">{c.phone}</p>
                      </div>
                    </div>
                  </Panel>
                  <Panel title="Note" meta="seen by your team only">
                    <p>{c.notes}</p>
                  </Panel>
                </div>
              </div>
            ),
          },
          {
            id: "invoices",
            label: "Invoices",
            count: invoices.length,
            content: <AppInvoiceTable invoices={invoices} showCustomer={false} today={today} />,
          },
          {
            id: "projects",
            label: "Projects",
            count: projects.length,
            content: projects.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <AppProjectCard key={p.id} project={p} today={today} />
                ))}
              </div>
            ) : (
              <EmptyState icon={FolderKanban} title="No projects yet" description={`Projects for ${c.name} will show up here.`} bordered />
            ),
          },
          {
            id: "activity",
            label: "Activity",
            count: activity.length,
            content: activity.length ? (
              <AppActivityFeed items={activity} title={`What happened with ${c.name}`} />
            ) : (
              <EmptyState title="Nothing lately" description="Payments, invoices sent and changes to projects show up here." bordered />
            ),
          },
        ]}
      />
    </div>
  );
}
