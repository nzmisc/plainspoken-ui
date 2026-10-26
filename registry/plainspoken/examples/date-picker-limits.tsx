"use client";

import { useState } from "react";
import { addDays, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { DatePicker } from "@/registry/plainspoken/ui/date-picker";
import { Field } from "@/registry/plainspoken/ui/field";

const TODAY = "2026-10-19";

/** Required, a weekday, in the next 30 days. Typed dates are checked too: try 2026-10-24 (a Saturday), 2026-02-30 or an empty field, then leave it. */
export default function DatePickerLimits() {
  const [date, setDate] = useState<ISODate | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <Field label="Maintenance window" required hint="A weekday in the next 30 days" error={error}>
      <DatePicker
        value={date}
        onChange={setDate}
        onError={setError}
        today={TODAY}
        locale="en-GB"
        min={TODAY}
        max={addDays(TODAY, 30)}
        isDisabled={(d) => weekday(d) === 0 || weekday(d) === 6}
        showWeekNumbers
      />
    </Field>
  );
}
