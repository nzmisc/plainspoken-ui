"use client";

import { useState } from "react";
import { Combobox, type ComboboxOption } from "@/registry/plainspoken/ui/combobox";
import { Field } from "@/registry/plainspoken/ui/field";

const ZONES: ComboboxOption[] = [
  "Africa/Cairo",
  "Africa/Lagos",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Pacific/Auckland",
  "UTC",
].map((z) => ({ value: z, label: z.replace("_", " ") }));

/** Type to filter, ↑/↓ to move, Enter to pick, Escape to close. Inside a Field it takes the label, hint and error. */
export default function ComboboxDemo() {
  const [zone, setZone] = useState<string | null>("Europe/Berlin");
  return (
    <div className="max-w-sm pb-48">
      <Field label="Time zone" hint="Dates in emails and exports use it.">
        <Combobox options={ZONES} value={zone} onChange={setZone} placeholder="Search time zones" />
      </Field>
    </div>
  );
}
