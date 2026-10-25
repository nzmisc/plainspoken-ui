"use client";

import { useState } from "react";
import { UserPlus } from "@/registry/plainspoken/lib/icons";
import { Button, type ButtonVariant } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { Select } from "@/registry/plainspoken/ui/select";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

const COUNTRIES = ["Austria", "Czechia", "Finland", "France", "Germany", "Ireland", "Italy", "Netherlands", "Norway", "Portugal", "Spain", "Sweden", "United Kingdom"];

export interface AppNewCustomerDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Adding a customer, in a dialog: company or person, names, contact details, where they are and
 * the currency to invoice in, and a note for the team. Labels sit beside the fields on wide
 * screens and above them on phones.
 */
export function AppNewCustomerDialog({ open, onClose }: AppNewCustomerDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New customer"
      description="They'll be added as a lead until their first invoice."
      dismissOnBackdrop={false}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onClose}>
            Add customer
          </Button>
        </>
      }
    >
      {open && <CustomerForm />}
    </Dialog>
  );
}

function CustomerForm() {
  const [kind, setKind] = useState<"company" | "person">("company");
  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        legend="Invoice"
        horizontal
        bare
        value={kind}
        onChange={setKind}
        options={[
          { value: "company", label: "A company" },
          { value: "person", label: "A person" },
        ]}
      />
      {kind === "company" && (
        <Field label="Company" required inline>
          <Input placeholder="Marigold Florists" autoComplete="organization" />
        </Field>
      )}
      <Field label={kind === "company" ? "Contact" : "Name"} required inline>
        <Input placeholder="Isabel Costa" autoComplete="name" />
      </Field>
      <Field label="Email" required inline hint="Invoices and reminders go here.">
        <Input type="email" placeholder="isabel@marigold.example" autoComplete="email" />
      </Field>
      <Field label="Phone" inline>
        <Input type="tel" placeholder="+351 213 470 615" autoComplete="tel" />
      </Field>
      <Field label="Country" inline>
        <Select options={COUNTRIES} defaultValue="Portugal" />
      </Field>
      <Field label="Currency" inline>
        <Select
          defaultValue="EUR"
          options={[
            { value: "EUR", label: "Euro (€)" },
            { value: "GBP", label: "Pound sterling (£)" },
            { value: "SEK", label: "Swedish krona (kr)" },
            { value: "NOK", label: "Norwegian krone (kr)" },
          ]}
        />
      </Field>
      <Field label="Note" inline hint="Only your team sees this.">
        <Textarea rows={3} placeholder="How you met, what they need, who to talk to." />
      </Field>
    </div>
  );
}

/** A button that opens the new-customer dialog, for page headers. */
export function NewCustomerButton({ variant = "primary" }: { variant?: ButtonVariant }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} icon={UserPlus} onClick={() => setOpen(true)}>
        New customer
      </Button>
      <AppNewCustomerDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
