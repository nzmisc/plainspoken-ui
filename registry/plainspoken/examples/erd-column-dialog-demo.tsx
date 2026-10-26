"use client";

import { useState } from "react";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { tableById, updateColumn } from "@/registry/plainspoken/blocks/erd/model";
import { ErdColumnDialog } from "@/registry/plainspoken/blocks/erd/column-dialog";
import { Button } from "@/registry/plainspoken/ui/button";

/** Edit the status column of orders: its type from the common Postgres types, constraints, default and comment. */
export default function ErdColumnDialogDemo() {
  const [model, setModel] = useState(SHOP_MODEL);
  const [open, setOpen] = useState(false);
  const column = tableById(model, "sales.orders")!.columns.find((c) => c.name === "status")!;
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setOpen(true)}>Edit orders.status</Button>
      <p className="font-mono text-[13px]">
        {column.name} {column.type}
        {column.notNull ? " NOT NULL" : ""}
        {column.default ? ` DEFAULT ${column.default}` : ""}
      </p>
      <ErdColumnDialog
        open={open}
        onClose={() => setOpen(false)}
        model={model}
        tableId="sales.orders"
        column={column}
        onSave={(c, old) => setModel((m) => updateColumn(m, "sales.orders", old ?? c.name, c))}
      />
    </div>
  );
}
