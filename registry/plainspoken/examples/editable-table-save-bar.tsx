"use client";

import { useState } from "react";
import { EditableTable, type EditableColumn } from "@/registry/plainspoken/ui/editable-table";

interface Price {
  sku: string;
  name: string;
  price: number | null;
  stock: number | null;
  live: boolean;
}

const SAVED: Price[] = [
  { sku: "TEA-011", name: "Assam, loose, 250 g", price: 9.5, stock: 140, live: true },
  { sku: "TEA-014", name: "Darjeeling first flush, 100 g", price: 14, stock: 36, live: true },
  { sku: "TEA-020", name: "Sencha, 100 g", price: 11.25, stock: 0, live: false },
  { sku: "TEA-027", name: "Rooibos vanilla, 250 g", price: 8.75, stock: 88, live: true },
  { sku: "ACC-003", name: "Cast-iron teapot, 0.8 l", price: 46, stock: 12, live: true },
];

const COLUMNS: EditableColumn<Price>[] = [
  { key: "sku", header: "SKU", readOnly: true, width: 84 },
  { key: "name", header: "Product", required: true, width: 230 },
  { key: "price", header: "Price", type: "money", currency: "EUR", required: true, min: 0, width: 96 },
  { key: "stock", header: "In stock", type: "number", decimals: 0, min: 0, width: 80 },
  { key: "live", header: "On sale", type: "checkbox", width: 72 },
];

/**
 * The page keeps the saved version and passes it as `baseline`: edited cells are marked against
 * it, the bar counts the changes, Discard goes back to it (and can be undone), and Save hands the
 * rows and the list of changes to `onSave`, which here takes half a second. Save while a cell has
 * an error moves to it instead.
 */
export default function EditableTableSaveBar() {
  const [saved, setSaved] = useState(SAVED);
  const [rows, setRows] = useState(SAVED);
  const [log, setLog] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-2">
      <EditableTable
        label="Prices"
        columns={COLUMNS}
        value={rows}
        onChange={setRows}
        baseline={saved}
        rowKey={(p) => p.sku}
        rowHeader="name"
        hint={false}
        onSave={async (next, changes) => {
          await new Promise((done) => setTimeout(done, 500));
          setSaved(next);
          setLog((l) => [...changes.edited.map((c) => `${c.rowKey} ${c.column}: ${c.from ?? "empty"} → ${c.to ?? "empty"}`), ...l].slice(0, 6));
        }}
      />
      {log.length > 0 && (
        <div className="text-[13px]">
          <b>Sent to the server</b>
          <ul className="mt-0.5 list-disc pl-5 font-mono text-[12px] text-muted-foreground">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
