"use client";

import { useState } from "react";
import { ORDERS } from "@/registry/plainspoken/blocks/grid/data";
import { GridOrderDrawer } from "@/registry/plainspoken/blocks/grid/order-drawer";
import { Button } from "@/registry/plainspoken/ui/button";

/** Open one of the last orders: a late one, with a coupon; Previous and Next step through the three. */
export default function GridOrderDrawerDemo() {
  const picks = [...ORDERS].reverse().filter((o) => o.late && o.coupon).slice(0, 3);
  const [at, setAt] = useState<number | null>(null);
  return (
    <>
      <Button onClick={() => setAt(0)}>Open order {picks[0]?.id}</Button>
      <GridOrderDrawer
        order={at == null ? null : picks[at]}
        onClose={() => setAt(null)}
        onPrevious={at ? () => setAt(at - 1) : undefined}
        onNext={at != null && at < picks.length - 1 ? () => setAt(at + 1) : undefined}
      />
    </>
  );
}
