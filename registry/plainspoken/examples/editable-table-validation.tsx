"use client";

import { EditableTable, type EditableColumn } from "@/registry/plainspoken/ui/editable-table";

interface Invoice {
  id: string;
  number: string;
  client: string;
  email: string;
  issued: string | null;
  due: string | null;
  amount: number | null;
  paid: boolean;
}

const ROWS: Invoice[] = [
  { id: "a", number: "INV-0412", client: "Lindqvist Bakery", email: "accounts@lindqvist.example", issued: "2027-03-01", due: "2027-03-31", amount: 1840, paid: true },
  { id: "b", number: "INV-413", client: "Moorfield Cycles", email: "hello@moorfield.example", issued: "2027-03-04", due: "2027-04-03", amount: 2390.5, paid: false },
  { id: "c", number: "INV-0414", client: "", email: "ops@tallow.example", issued: "2027-03-09", due: "2027-04-08", amount: 760, paid: false },
  { id: "d", number: "INV-0415", client: "Harbour Lane Dental", email: "frontdesk.harbourlane.example", issued: "2027-03-12", due: "2027-03-02", amount: 3200, paid: false },
  { id: "e", number: "INV-0416", client: "Okafor & Sons", email: "billing@okafor.example", issued: "2027-03-15", due: "2027-04-14", amount: -45, paid: false },
  { id: "f", number: "INV-0417", client: "Brightwater School", email: "bursar@brightwater.example", issued: "2027-03-18", due: "2027-04-17", amount: 61200, paid: false },
];

const COLUMNS: EditableColumn<Invoice>[] = [
  { key: "number", header: "Invoice", required: true, pattern: /INV-\d{4}/, patternMessage: "Use the form INV-0000", width: 104 },
  { key: "client", header: "Client", required: true, width: 170 },
  { key: "email", header: "Billing email", pattern: /[^@\s]+@[^@\s]+\.[^@\s]+/, patternMessage: "Not an email address", width: 210 },
  { key: "issued", header: "Issued", type: "date", required: true },
  {
    key: "due",
    header: "Due",
    type: "date",
    required: true,
    validate: (due, inv) => (typeof due === "string" && inv.issued && due < inv.issued ? `Due before it was issued (${inv.issued})` : null),
  },
  { key: "amount", header: "Amount", type: "money", currency: "EUR", required: true, min: 0.01, max: 50000, width: 112 },
  { key: "paid", header: "Paid", type: "checkbox", width: 56 },
];

/**
 * Rules per column: required, a pattern (invoice numbers, email), a minimum and maximum, and a
 * check of its own (the due date can't be before the issue date). Broken values stay in the cell,
 * with a red edge and an icon; the message shows on hover and when the cell has focus. Type
 * "twelve" into Amount to see text that isn't a number kept as typed, with its message.
 */
export default function EditableTableValidation() {
  return <EditableTable label="Invoices" columns={COLUMNS} defaultValue={ROWS} rowKey={(i) => i.id} rowHeader="number" stickyColumns={1} hint={false} />;
}
