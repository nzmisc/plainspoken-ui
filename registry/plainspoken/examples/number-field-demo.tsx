"use client";

import { useState } from "react";
import { Field } from "@/registry/plainspoken/ui/field";
import { NumberField } from "@/registry/plainspoken/ui/number-field";

/** − and + either side, ↑/↓ to step, clamped to min and max when the field loses focus. */
export default function NumberFieldDemo() {
  const [guests, setGuests] = useState<number | null>(2);
  const [tip, setTip] = useState<number | null>(12.5);
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Field label="Guests" hint="Up to 8 at one table.">
        <NumberField value={guests} onChange={setGuests} min={1} max={8} />
      </Field>
      <Field label="Tip">
        <NumberField value={tip} onChange={setTip} min={0} max={30} step={2.5} unit="%" />
      </Field>
      <Field label="Disk size" error="The plan allows 64 GiB at most.">
        <NumberField defaultValue={80} max={64} step={8} unit="GiB" />
      </Field>
      <Field label="Seats">
        <NumberField defaultValue={5} disabled />
      </Field>
    </div>
  );
}
