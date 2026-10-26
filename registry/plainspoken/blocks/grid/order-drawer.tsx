"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "@/registry/plainspoken/lib/icons";
import { trackingUrl, type Order } from "@/registry/plainspoken/blocks/grid/data";
import { longDate, money, STATUS_ICON, STATUS_VARIANT } from "@/registry/plainspoken/blocks/grid/format";
import { Button } from "@/registry/plainspoken/ui/button";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

export interface GridOrderDrawerProps {
  /** The order to show; null keeps the drawer closed */
  order: Order | null;
  onClose: () => void;
  /** The order before and after this one in the table's current order, for the arrows in the footer */
  onPrevious?: () => void;
  onNext?: () => void;
}

/**
 * One order in a drawer from the right (a sheet from the bottom on phones): its state, what was
 * bought with the sums, who it goes to, and how delivery went, with a link to the carrier's
 * tracking page. Previous and Next step through the table's rows in the order they are shown.
 */
export function GridOrderDrawer({ order: o, onClose, onPrevious, onNext }: GridOrderDrawerProps) {
  const url = o ? trackingUrl(o) : null;
  return (
    <Drawer
      open={o != null}
      onClose={onClose}
      title={o ? `Order ${o.id}` : ""}
      description={o ? `${longDate(o.placed)} · ${o.channel}` : undefined}
      className="sm:w-[32rem]"
      footer={
        o && (
          <>
            {(onPrevious || onNext) && (
              <span className="mr-auto flex gap-1.5">
                <Button icon={ChevronLeft} onClick={onPrevious} disabled={!onPrevious}>
                  Previous
                </Button>
                <Button iconEnd={ChevronRight} onClick={onNext} disabled={!onNext}>
                  Next
                </Button>
              </span>
            )}
            <Button onClick={onClose}>Close</Button>
          </>
        )
      }
    >
      {o && (
        <div className="flex flex-col gap-4 text-[14px]">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Status variant={STATUS_VARIANT[o.status]} icon={STATUS_ICON[o.status]} className="font-semibold">
              {o.status}
            </Status>
            {o.late ? (
              <span className="text-warning">
                {o.late} {o.late === 1 ? "day" : "days"} later than promised
              </span>
            ) : o.late === 0 ? (
              <span className="text-muted-foreground">on time</span>
            ) : null}
          </p>

          <section aria-labelledby={`${o.id}-items`}>
            <h3 id={`${o.id}-items`} className="mb-1 font-bold">
              {o.items} {o.items === 1 ? "item" : "items"}
            </h3>
            <Table density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {o.lines.map((l) => (
                  <TableRow key={l.sku}>
                    <TableCell>
                      {l.name} <span className="font-mono text-[12px] text-muted-foreground">{l.sku}</span>
                    </TableCell>
                    <TableCell numeric>{l.qty}</TableCell>
                    <TableCell numeric>{money(l.price)}</TableCell>
                    <TableCell numeric>{money(l.qty * l.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <SumRow label="Subtotal" value={money(o.subtotal)} />
                {o.discount > 0 && <SumRow label={`Coupon ${o.coupon}`} value={`−${money(o.discount)}`} />}
                <SumRow label="Shipping" value={o.shipping ? money(o.shipping) : "free"} />
                <SumRow label="Total, VAT included" value={money(o.total)} strong />
              </TableFooter>
            </Table>
          </section>

          <DescriptionList
            divided
            items={[
              { term: "Customer", description: o.customer },
              {
                term: "Email",
                description: (
                  <a href={`mailto:${o.email}`} className={linkVariants()}>
                    {o.email}
                  </a>
                ),
              },
              {
                term: "Ship to",
                description: (
                  <address className="not-italic">
                    {o.street}
                    <br />
                    {o.postcode} {o.city}
                    <br />
                    {o.country}
                  </address>
                ),
              },
              { term: "Payment", description: o.payment },
              { term: "Promised for", description: longDate(o.promised, false) },
              { term: "Shipped", description: o.shipped ? `${longDate(o.shipped)}${o.carrier ? ` with ${o.carrier}` : ""}` : "Not yet" },
              ...(o.delivered ? [{ term: "Delivered", description: longDate(o.delivered) }] : []),
              ...(url
                ? [
                    {
                      term: "Tracking",
                      description: (
                        <a href={url} className={linkVariants({ className: "font-mono text-[13px]" })}>
                          {o.tracking} <Icon icon={ExternalLink} label="(carrier's site)" />
                        </a>
                      ),
                    },
                  ]
                : []),
              ...(o.rating ? [{ term: "Rating", description: `${o.rating} of 5 stars` }] : []),
            ]}
          />

          {o.note && (
            <section>
              <h3 className="mb-1 font-bold">Note from the customer</h3>
              <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">{o.note}</blockquote>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}

function SumRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <TableRow className={strong ? "font-bold" : undefined}>
      <TableCell colSpan={3} className="text-right">
        {label}
      </TableCell>
      <TableCell numeric>{value}</TableCell>
    </TableRow>
  );
}
