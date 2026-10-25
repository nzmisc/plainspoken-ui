"use client";

import Link from "next/link";
import { ArrowRight } from "@/registry/plainspoken/lib/icons";
import { invoicesFor, type Customer } from "@/registry/plainspoken/blocks/app/data";
import { CUSTOMER_VARIANT, day, money } from "@/registry/plainspoken/blocks/app/format";
import { AppInvoiceTable } from "@/registry/plainspoken/blocks/app/invoice-table";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button, buttonVariants } from "@/registry/plainspoken/ui/button";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

export interface AppCustomerDrawerProps {
  /** The customer to show; null keeps the drawer closed */
  customer: Customer | null;
  onClose: () => void;
}

/**
 * A customer at a glance, in a drawer from the right (a sheet from the bottom on phones): their
 * state, contact details, what they owe and have spent, the latest invoices and the team's note,
 * with the way to their full page.
 */
export function AppCustomerDrawer({ customer: c, onClose }: AppCustomerDrawerProps) {
  return (
    <Drawer
      open={c != null}
      onClose={onClose}
      title={c?.name ?? ""}
      description={c ? `${c.industry} · ${c.city}, ${c.country}` : undefined}
      className="sm:w-[30rem]"
      footer={
        c && (
          <>
            <Button onClick={onClose}>Close</Button>
            <Link href={`/demos/app/customers/${c.id}`} className={buttonVariants({ variant: "primary" })}>
              Open customer page
              <Icon icon={ArrowRight} />
            </Link>
          </>
        )
      }
    >
      {c && (
        <div className="flex flex-col gap-4">
          <p className="flex flex-wrap items-center gap-2">
            <Badge variant={CUSTOMER_VARIANT[c.status]}>{c.status}</Badge>
            <span className="text-[13px] text-muted-foreground">Looked after by {c.owner}</span>
          </p>
          <StatGroup columns={2}>
            <Stat label="Owes" value={money(c.balance)} hint={c.balance ? "across open invoices" : "nothing outstanding"} />
            <Stat label="Invoiced in all" value={money(c.lifetime)} hint={`since ${day(c.since)}`} />
          </StatGroup>
          <DescriptionList
            divided
            items={[
              { term: "Contact", description: c.contact },
              {
                term: "Email",
                description: (
                  <a href={`mailto:${c.email}`} className={linkVariants()}>
                    {c.email}
                  </a>
                ),
              },
              { term: "Phone", description: <span className="tabular-nums">{c.phone}</span> },
              { term: "Website", description: c.website },
              { term: "Last invoice", description: c.lastInvoice ? day(c.lastInvoice) : "None yet" },
            ]}
          />
          <section>
            <h3 className="mb-1 font-bold">Latest invoices</h3>
            <AppInvoiceTable invoices={invoicesFor(c.id).slice(0, 3)} showCustomer={false} short />
          </section>
          <section>
            <h3 className="mb-1 font-bold">Note</h3>
            <p className="text-muted-foreground">{c.notes}</p>
          </section>
        </div>
      )}
    </Drawer>
  );
}
