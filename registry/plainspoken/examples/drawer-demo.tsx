"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Drawer } from "@/registry/plainspoken/ui/drawer";

const ORDER = {
  number: "NW-20418",
  facts: [
    ["Customer", "Hannah Lindqvist"],
    ["Placed", "23 October 2026, 14:02"],
    ["Payment", "Visa ending 4242"],
    ["Ship to", "Sveavägen 44, 111 34 Stockholm"],
    ["Carrier", "PostNord, tracking 00370726201044581"],
  ],
  lines: [
    { item: "Linen shirt, sand, M", qty: 2, price: 59 },
    { item: "Canvas tote", qty: 1, price: 24 },
    { item: "Wool socks, 3 pairs", qty: 1, price: 18 },
  ],
};

const eur = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "EUR" });

/** The details of one row, from the right: the list stays in view behind it. On a phone it comes up from the bottom. */
export default function DrawerDemo() {
  const [open, setOpen] = useState(false);
  const total = ORDER.lines.reduce((s, l) => s + l.qty * l.price, 0);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Order {ORDER.number}</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={`Order ${ORDER.number}`}
        description="Paid · ready to ship"
        footer={
          <>
            <Button variant="destructive" className="mr-auto">
              Refund
            </Button>
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Button variant="primary">Mark as shipped</Button>
          </>
        }
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {ORDER.facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-4 mb-1 font-bold">Items</h3>
        <table className="w-full border-collapse [&_td]:border-b [&_td]:border-border [&_td]:py-1 [&_th]:border-b [&_th]:border-border [&_th]:py-1 [&_th]:text-left [&_th]:font-medium">
          <thead>
            <tr>
              <th>Item</th>
              <th className="w-12">Qty</th>
              <th className="w-20">Price</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.lines.map((l) => (
              <tr key={l.item}>
                <td>{l.item}</td>
                <td className="text-right tabular-nums">{l.qty}</td>
                <td className="text-right tabular-nums">{eur(l.qty * l.price)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} className="font-bold">
                Total
              </td>
              <td className="text-right font-bold tabular-nums">{eur(total)}</td>
            </tr>
          </tbody>
        </table>
      </Drawer>
    </>
  );
}
