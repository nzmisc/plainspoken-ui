import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { HoverCard, HoverCardActions, HoverCardFacts, HoverCardHeader } from "@/registry/plainspoken/ui/hover-card";

const ORDERS = [
  { id: "NW-20418", customer: "Hannah Lindqvist", city: "Stockholm", items: 4, total: "€160.00", status: "Paid", placed: "23 Oct, 14:02" },
  { id: "NW-20417", customer: "Tomás Ferreira", city: "Porto", items: 1, total: "€24.00", status: "Shipped", placed: "23 Oct, 11:47" },
  { id: "NW-20416", customer: "Priya Raman", city: "Leeds", items: 2, total: "€83.00", status: "Refunded", placed: "22 Oct, 18:30" },
];

/** Details behind an order number, from a scrolling table: the card is in the top layer, so the table's scroll box doesn't clip it. */
export default function HoverCardInTable() {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="border-collapse text-[14px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-0.5 [&_th]:text-left [&_th]:font-medium">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {ORDERS.map((o) => (
            <tr key={o.id}>
              <td>
                <HoverCard
                  label={`Order ${o.id}`}
                  card={
                    <>
                      <HoverCardHeader title={`Order ${o.id}`} aside={<span className="text-muted-foreground">{o.status}</span>} />
                      <HoverCardFacts
                        rows={[
                          ["Placed", o.placed],
                          ["Ship to", `${o.customer}, ${o.city}`],
                          ["Items", o.items],
                          ["Total", o.total],
                        ]}
                      />
                      <HoverCardActions>
                        <a href={`#${o.id}`} className="text-link underline visited:text-link-visited">
                          Open order
                        </a>
                        <span className="ml-auto">
                          <CopyButton text={o.id} label="Copy number" size="sm" />
                        </span>
                      </HoverCardActions>
                    </>
                  }
                >
                  <a href={`#${o.id}`} className="font-mono text-[13px] text-link underline visited:text-link-visited">
                    {o.id}
                  </a>
                </HoverCard>
              </td>
              <td>{o.customer}</td>
              <td className="text-right tabular-nums">{o.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
