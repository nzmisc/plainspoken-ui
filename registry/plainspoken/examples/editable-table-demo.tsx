"use client";

import { useState } from "react";
import { EditableTable, type EditableColumn } from "@/registry/plainspoken/ui/editable-table";

interface Purchase {
  id: string;
  item: string;
  category: string | null;
  bought: string | null;
  qty: number | null;
  price: number | null;
  approved: boolean;
  notes: string;
}

const START: Purchase[] = [
  { id: "p1", item: "14-inch laptop", category: "Computers", bought: "2027-01-12", qty: 2, price: 1849, approved: true, notes: "For the two new designers" },
  { id: "p2", item: "27-inch monitor", category: "Screens", bought: "2027-01-12", qty: 4, price: 389.5, approved: true, notes: "" },
  { id: "p3", item: "Standing desk", category: "Furniture", bought: "2027-02-03", qty: 1, price: 640, approved: false, notes: "Waiting for a second quote" },
  { id: "p4", item: "Desk chair", category: "Furniture", bought: "2027-02-03", qty: 3, price: 412, approved: true, notes: "" },
  { id: "p5", item: "Font licence, Halden Sans", category: "Software", bought: "2027-02-20", qty: 1, price: 780, approved: true, notes: "Desktop and web, up to 10 users" },
  { id: "p6", item: "USB-C dock", category: "Accessories", bought: null, qty: 5, price: 129, approved: false, notes: "" },
  { id: "p7", item: "Colour calibrator", category: "Accessories", bought: "2027-03-08", qty: 1, price: 245, approved: false, notes: "Shared, kept in the print room" },
];

const COLUMNS: EditableColumn<Purchase>[] = [
  { key: "item", header: "Item", required: true, width: 190 },
  { key: "category", header: "Category", type: "select", options: ["Computers", "Screens", "Furniture", "Software", "Accessories"] },
  { key: "bought", header: "Bought", type: "date", min: "2027-01-01", max: "2027-12-31" },
  { key: "qty", header: "Qty", type: "number", decimals: 0, min: 1, width: 64, total: "sum" },
  { key: "price", header: "Unit price", type: "money", currency: "EUR", min: 0, width: 110 },
  { key: "total", header: "Total", type: "money", currency: "EUR", width: 116, compute: (p) => (p.qty ?? 0) * (p.price ?? 0), total: "sum" },
  { key: "approved", header: "Approved", type: "checkbox", width: 84, total: "count" },
  { key: "notes", header: "Notes", type: "longtext", width: 240, placeholder: "Add a note" },
];

let next = 100;
const blank = (copyOf?: Purchase): Purchase => ({
  ...(copyOf ?? { item: "", category: null, bought: null, qty: 1, price: null, approved: false, notes: "" }),
  id: `p${next++}`,
});

/**
 * A studio's equipment purchases, with every kind of column: text, a choice, a date, a whole
 * number, money, a computed total, yes/no and notes. Click a cell and type, or press Enter to edit
 * it; Tab along a row and Enter to come back to the next row's first column. Copy a range with
 * Ctrl+C and paste it into a spreadsheet, or the other way round. Ctrl+Z undoes.
 */
export default function EditableTableDemo() {
  const [rows, setRows] = useState(START);
  return (
    <EditableTable
      label="Equipment purchases"
      columns={COLUMNS}
      value={rows}
      onChange={setRows}
      rowKey={(p) => p.id}
      newRow={blank}
      rowHeader="item"
      totals
      maxHeight="22rem"
      onSave={() => new Promise((done) => setTimeout(done, 500))}
    />
  );
}
