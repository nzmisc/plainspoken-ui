"use client";

import { useState } from "react";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdTableList } from "@/registry/plainspoken/blocks/erd/table-list";

/** The 28 tables of the shop by schema. Search for a column, say "sku" or "email", to find the tables that have it. */
export default function ErdTableListDemo() {
  const [picked, setPicked] = useState("sales.orders");
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ErdTableList model={SHOP_MODEL} selected={[picked]} onPick={setPicked} className="h-96 w-60 border border-border" />
      <p className="text-[13px]">
        Picked: <b>{tableById(SHOP_MODEL, picked)?.name}</b>
      </p>
    </div>
  );
}
