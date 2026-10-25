"use client";

import { useState } from "react";
import { FilePlus, Plus, Trash } from "@/registry/plainspoken/lib/icons";
import { APP_TODAY, CUSTOMERS } from "@/registry/plainspoken/blocks/app/data";
import { money } from "@/registry/plainspoken/blocks/app/format";
import { Button, IconButton, type ButtonVariant } from "@/registry/plainspoken/ui/button";
import { Combobox } from "@/registry/plainspoken/ui/combobox";
import { DatePicker } from "@/registry/plainspoken/ui/date-picker";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { NumberField } from "@/registry/plainspoken/ui/number-field";
import { Select } from "@/registry/plainspoken/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

interface Line {
  id: number;
  description: string;
  qty: number;
  rate: number;
}

const START: Line[] = [
  { id: 1, description: "Design, packaging concepts", qty: 3, rate: 850 },
  { id: 2, description: "Illustration, six tea varieties", qty: 6, rate: 220 },
];

export interface AppNewInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  /** The customer chosen at first, e.g. on a customer's page */
  customerId?: string;
}

/**
 * Writing an invoice, in a dialog: the customer (a combobox to type into), issue date and terms,
 * lines with quantity and rate (the amounts and total add up as you type), and a note. Save as
 * draft or Send. Everything resets each time it opens.
 */
export function AppNewInvoiceDialog({ open, onClose, customerId }: AppNewInvoiceDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="New invoice"
      description="INV-2026-0167, from Brightwater Studio"
      dismissOnBackdrop={false}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save as draft</Button>
          <Button variant="primary" onClick={onClose}>
            Send invoice
          </Button>
        </>
      }
    >
      {open && <InvoiceForm customerId={customerId} />}
    </Dialog>
  );
}

function InvoiceForm({ customerId }: { customerId?: string }) {
  const [lines, setLines] = useState(START);
  const update = (id: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const vat = Math.round(subtotal * 0.23);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="Customer" required>
          <Combobox
            defaultValue={customerId ?? "copperleaf-tea"}
            options={CUSTOMERS.filter((c) => c.status !== "Archived").map((c) => ({ value: c.id, label: c.name, hint: c.city }))}
            placeholder="Type a name"
          />
        </Field>
        <Field label="Issue date">
          <DatePicker defaultValue={APP_TODAY} today={APP_TODAY} locale="en-GB" />
        </Field>
        <Field label="Payment terms">
          <Select
            defaultValue="30"
            options={[
              { value: "14", label: "14 days" },
              { value: "30", label: "30 days" },
              { value: "60", label: "60 days" },
              { value: "0", label: "On receipt" },
            ]}
            className="w-full"
          />
        </Field>
      </div>
      <Table density="compact" className="ctl-sm">
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="w-28">Quantity</TableHead>
            <TableHead className="w-32">Rate</TableHead>
            <TableHead className="w-24">Amount</TableHead>
            <TableHead className="w-8">
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((l, i) => (
            <TableRow key={l.id}>
              <TableCell>
                <Input aria-label={`Line ${i + 1} description`} value={l.description} onChange={(e) => update(l.id, { description: e.target.value })} className="w-full min-w-40" />
              </TableCell>
              <TableCell>
                <NumberField aria-label={`Line ${i + 1} quantity`} value={l.qty} min={0} onChange={(v) => update(l.id, { qty: v ?? 0 })} className="w-full" />
              </TableCell>
              <TableCell>
                <Input
                  aria-label={`Line ${i + 1} rate in euros`}
                  type="number"
                  prefix="€"
                  value={l.rate}
                  onChange={(e) => update(l.id, { rate: Number(e.target.value) || 0 })}
                  className="w-full"
                  inputClassName="text-right tabular-nums"
                />
              </TableCell>
              <TableCell numeric className="align-middle">
                {money(l.qty * l.rate)}
              </TableCell>
              <TableCell className="align-middle">
                <IconButton variant="ghost" icon={Trash} label={`Remove line ${i + 1}`} onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-normal text-muted-foreground">
              Subtotal
            </TableCell>
            <TableCell numeric>{money(subtotal)}</TableCell>
            <TableCell />
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-normal text-muted-foreground">
              VAT 23%
            </TableCell>
            <TableCell numeric>{money(vat)}</TableCell>
            <TableCell />
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-bold">
              Total
            </TableCell>
            <TableCell numeric className="font-bold">
              {money(subtotal + vat)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
      <Button size="sm" icon={Plus} className="self-start" onClick={() => setLines((ls) => [...ls, { id: Math.max(0, ...ls.map((x) => x.id)) + 1, description: "", qty: 1, rate: 0 }])}>
        Add a line
      </Button>
      <Field label="Note to the customer" hint="Printed under the lines.">
        <Textarea defaultValue="Thank you! Payment by bank transfer to the account below, quoting the invoice number." rows={2} />
      </Field>
    </div>
  );
}

/** A button that opens the new-invoice dialog: for page headers, which can stay server components. */
export function NewInvoiceButton({ customerId, variant = "primary", label = "New invoice" }: { customerId?: string; variant?: ButtonVariant; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} icon={FilePlus} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <AppNewInvoiceDialog open={open} onClose={() => setOpen(false)} customerId={customerId} />
    </>
  );
}
