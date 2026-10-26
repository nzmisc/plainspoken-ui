"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";

interface Draft {
  email: string;
  role: string;
}
const EMPTY: Draft = { email: "", role: "Member" };

function validate(v: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!v.email.trim()) e.email = "Enter an email address.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) e.email = "Enter an address like name@example.com.";
  else if (v.email.endsWith("@northwind.example") && v.role === "Guest") e.role = "People at Northwind join as members, not guests.";
  return e;
}

/**
 * A form in a dialog. Errors show after the first try, and the first wrong field gets focus. Once
 * something is typed, a click on the backdrop no longer closes it, so nothing is lost by accident;
 * while it sends, it can't be closed at all.
 */
export default function DialogForm() {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(EMPTY);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const errors = validate(v);
  const shown = tried ? errors : {};
  const dirty = v.email !== EMPTY.email || v.role !== EMPTY.role;

  const show = () => {
    setV(EMPTY);
    setTried(false);
    setOpen(true);
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTried(true);
    const bad = Object.keys(errors)[0];
    if (bad) return e.currentTarget.querySelector<HTMLElement>(`[name="${bad}"]`)?.focus();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent((s) => [...s, v.email]);
      setOpen(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="primary" onClick={show}>
        Invite people
      </Button>
      {sent.length > 0 && <p className="text-muted-foreground">Invited: {sent.join(", ")}</p>}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        busy={busy}
        dismissOnBackdrop={!dirty}
        size="sm"
        title="Invite to Northwind"
        description="They get an email with a link that works for 7 days."
        footer={
          <>
            <Button disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invite" variant="primary" loading={busy}>
              Send invite
            </Button>
          </>
        }
      >
        <form id="invite" noValidate onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Email" required error={shown.email}>
            <Input name="email" type="email" autoComplete="off" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Field>
          <Field label="Role" error={shown.role} hint="Guests see only the projects they are added to.">
            <Select name="role" options={["Member", "Admin", "Guest"]} value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
