import { Check, CreditCard, Download } from "@/registry/plainspoken/lib/icons";
import { BILLING_HISTORY, CURRENT_PLAN, PLANS, type Plan } from "@/registry/plainspoken/blocks/app/data";
import { day } from "@/registry/plainspoken/blocks/app/format";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Meter } from "@/registry/plainspoken/ui/progress";
import { SimpleTable } from "@/registry/plainspoken/ui/table";
import { cn } from "@/lib/utils";

export interface AppBillingProps {
  plans?: Plan[];
  current?: string;
}

/**
 * Billing: the three plans as cards (the current one marked, in words and with a heavier
 * border), what is used of this one, the card on file, and past bills with a download each.
 * Renders on the server.
 */
export function AppBilling({ plans = PLANS, current = CURRENT_PLAN }: AppBillingProps) {
  const at = plans.findIndex((p) => p.id === current);
  return (
    <div data-slot="app-billing" className="flex flex-col gap-4">
      <section aria-labelledby="plans-heading">
        <h3 id="plans-heading" className="mb-2 font-bold">
          Plan
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((p, i) => {
            const isCurrent = p.id === current;
            return (
              <Card key={p.id} className={cn(isCurrent && "border-2 border-foreground")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {p.name}
                    {isCurrent && <Badge variant="success">Current plan</Badge>}
                  </CardTitle>
                  <CardDescription>{p.blurb}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">
                    <span className="text-[24px] font-bold tabular-nums">€{p.price}</span> <span className="text-muted-foreground">a month</span>
                  </p>
                  <ul className="flex flex-col gap-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-baseline gap-1.5">
                        <Icon icon={Check} className="text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button disabled block>
                      Your plan
                    </Button>
                  ) : (
                    <Button variant={i > at ? "primary" : "default"} block>
                      {i > at ? `Upgrade to ${p.name}` : `Move to ${p.name}`}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="This month">
          <div className="flex flex-col gap-2 p-1">
            <div>
              <p className="mb-0.5 text-[13px]">Seats: 5 of 8</p>
              <Meter value={5} max={8} label="Seats used" valueText="5 of 8" />
            </div>
            <div>
              <p className="mb-0.5 text-[13px]">File storage: 7.4 of 10 GB</p>
              <Meter value={74} warn={70} crit={90} label="File storage used" valueText="74%" />
            </div>
            <p className="text-[13px] text-muted-foreground">Invoices: 18 sent, no limit on Studio.</p>
          </div>
        </Panel>
        <Panel title="Paying with" actions={<Button>Change</Button>}>
          <DescriptionList
            className="p-1"
            items={[
              {
                term: "Card",
                description: (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon={CreditCard} /> Visa ending 4417, expires 08/28
                  </span>
                ),
              },
              { term: "Billed to", description: "Brightwater Studio Lda, Rua da Esperança 112, 1200-655 Lisboa" },
              { term: "VAT number", description: "PT 516 204 873" },
              { term: "Next bill", description: "1 Nov 2026, €29" },
            ]}
          />
        </Panel>
      </div>
      <section aria-labelledby="bills-heading">
        <h3 id="bills-heading" className="mb-2 font-bold">
          Past bills
        </h3>
        <SimpleTable
          rows={BILLING_HISTORY}
          rowKey={(b) => b.id}
          columns={[
            { key: "id", header: "Bill", cell: (b) => <span className="font-mono text-[13px]">{b.id}</span> },
            { key: "date", header: "Date", cell: (b) => day(b.date) },
            { key: "amount", header: "Amount", numeric: true, cell: (b) => `€${b.amount}.00` },
            { key: "status", header: "State", cell: (b) => <Badge variant="success">{b.status}</Badge> },
            { key: "pdf", header: <span className="sr-only">Download</span>, cell: (b) => <IconButton size="xs" variant="ghost" icon={Download} label={`Download ${b.id} as PDF`} />, className: "w-0" },
          ]}
        />
      </section>
    </div>
  );
}
