"use client";

import { useState } from "react";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

export default function FieldDemo() {
  const [email, setEmail] = useState("ana@");
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <Field label="Name" required>
        <Input autoComplete="name" />
      </Field>
      <Field label="Email" required hint="We only write about your account." error={valid ? undefined : "Enter an address like name@example.com."}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Plan">
        <Select options={["Free", "Team", "Enterprise"]} />
      </Field>
      <Field label="Notes" hint="Optional.">
        <Textarea />
      </Field>
    </form>
  );
}
