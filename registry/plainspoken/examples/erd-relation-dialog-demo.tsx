"use client";

import { useState } from "react";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { addRelation, endText, type ErdRelation } from "@/registry/plainspoken/blocks/erd/model";
import { ErdRelationDialog } from "@/registry/plainspoken/blocks/erd/relation-dialog";
import { Button } from "@/registry/plainspoken/ui/button";

/** Add a foreign key to refunds from a form: only keys are offered on the other side, and it says when a type would have to change. */
export default function ErdRelationDialogDemo() {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<ErdRelation | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setOpen(true)}>Add a relationship from refunds</Button>
      {added && (
        <p className="font-mono text-[13px]">
          refunds.{added.from.columns[0]} → {endText(addRelation(SHOP_MODEL, added), added.to)}, on delete {added.onDelete.toLowerCase()}
        </p>
      )}
      <ErdRelationDialog open={open} onClose={() => setOpen(false)} model={SHOP_MODEL} tableId="sales.refunds" defaultColumn="reason" onSave={setAdded} />
    </div>
  );
}
