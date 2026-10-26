"use client";

import { useState } from "react";
import { CUSTOMERS, type Customer } from "@/registry/plainspoken/blocks/app/data";
import { AppCustomerDrawer } from "@/registry/plainspoken/blocks/app/customer-drawer";
import { Button } from "@/registry/plainspoken/ui/button";

/** One customer in the drawer: from the right on wide screens, from the bottom on phones. */
export default function AppCustomerDrawerDemo() {
  const [open, setOpen] = useState<Customer | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      {["harbor-coffee", "northwind-cycles", "copperleaf-tea"].map((id) => {
        const c = CUSTOMERS.find((x) => x.id === id)!;
        return (
          <Button key={id} onClick={() => setOpen(c)}>
            {c.name}
          </Button>
        );
      })}
      <AppCustomerDrawer customer={open} onClose={() => setOpen(null)} />
    </div>
  );
}
