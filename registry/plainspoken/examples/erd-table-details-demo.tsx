"use client";

import { useState } from "react";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdTableDetails } from "@/registry/plainspoken/blocks/erd/table-details";

/**
 * The orders table in full, and editable: rename it, change its comment, add a column, or use a
 * column's ⋯ menu to edit, move or delete it. What happened is shown under it.
 */
export default function ErdTableDetailsDemo() {
  const [model, setModel] = useState(SHOP_MODEL);
  const [table, setTable] = useState("sales.orders");
  const [last, setLast] = useState("Nothing changed yet.");
  return (
    <div className="flex flex-col gap-2">
      <ErdTableDetails
        model={model}
        tableId={table}
        onModelChange={(m, message) => {
          setModel(m);
          setLast(message);
        }}
        onSelectTable={setTable}
        className="h-[32rem] w-[25rem] max-w-full border border-border"
      />
      <p className="text-[13px] text-muted-foreground" aria-live="polite">
        {last}
      </p>
    </div>
  );
}
