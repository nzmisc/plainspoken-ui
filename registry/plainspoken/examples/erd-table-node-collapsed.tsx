"use client";

import { useState } from "react";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdTableCard } from "@/registry/plainspoken/blocks/erd/table-node";

/** Folded to its keys with the button in the header, and without types or NULL marks for a quieter diagram. */
export default function ErdTableNodeCollapsed() {
  const [folded, setFolded] = useState(true);
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ErdTableCard model={SHOP_MODEL} table={tableById(SHOP_MODEL, "sales.payments")!} collapsed={folded} onCollapsedChange={setFolded} />
      <ErdTableCard model={SHOP_MODEL} table={tableById(SHOP_MODEL, "sales.customers")!} showTypes={false} showNullability={false} />
    </div>
  );
}
