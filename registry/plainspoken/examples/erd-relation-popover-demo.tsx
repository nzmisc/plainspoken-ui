"use client";

import { useState } from "react";
import { ORDERS_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { updateRelation } from "@/registry/plainspoken/blocks/erd/model";
import { ErdRelationPopover } from "@/registry/plainspoken/blocks/erd/relation-popover";
import { Button } from "@/registry/plainspoken/ui/button";

/** What a click on a line shows, here opened from a button: the columns, the cardinality in marks and words, and ON DELETE and ON UPDATE to change. */
export default function ErdRelationPopoverDemo() {
  const [model, setModel] = useState(ORDERS_MODEL);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button onClick={(e) => setAnchor(anchor ? null : e.currentTarget)} aria-expanded={!!anchor}>
        orders.customer_id → customers.id
      </Button>
      <ErdRelationPopover
        model={model}
        relationId={anchor ? "orders_customer_id_fkey" : null}
        anchor={anchor}
        onClose={() => setAnchor(null)}
        onChange={(id, patch) => setModel((m) => updateRelation(m, id, patch))}
      />
    </>
  );
}
