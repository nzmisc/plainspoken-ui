"use client";

import { useState } from "react";
import { formatDate, type ISODate } from "@/registry/plainspoken/lib/dates";
import { DatePicker } from "@/registry/plainspoken/ui/date-picker";
import { Field } from "@/registry/plainspoken/ui/field";

const TODAY = "2026-10-19";

export default function DatePickerDemo() {
  const [date, setDate] = useState<ISODate | null>("2026-11-02");
  const [error, setError] = useState<string | null>(null);
  return (
    <Field label="Start date" hint={date ? formatDate(date, { dateStyle: "full" }, "en-GB") : "YYYY-MM-DD"} error={error}>
      <DatePicker value={date} onChange={setDate} onError={setError} today={TODAY} locale="en-GB" />
    </Field>
  );
}
