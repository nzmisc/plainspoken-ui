"use client";

import { useState } from "react";
import { type ISODate } from "@/registry/plainspoken/lib/dates";
import { Button } from "@/registry/plainspoken/ui/button";
import { DatePicker } from "@/registry/plainspoken/ui/date-picker";
import { Label } from "@/registry/plainspoken/ui/field";

const TODAY = "2026-10-19";

/** Two pickers as a from–to filter in a small toolbar: each limits the other. Outside a Field, give each a label of its own. */
export default function DatePickerFromTo() {
  const [from, setFrom] = useState<ISODate | null>("2026-10-01");
  const [to, setTo] = useState<ISODate | null>(TODAY);
  return (
    <div className="ctl-sm flex flex-wrap items-center gap-2 text-[13px]">
      <Label htmlFor="orders-from" className="text-[13px]">
        Orders from
      </Label>
      <DatePicker id="orders-from" value={from} onChange={setFrom} max={to ?? undefined} today={TODAY} locale="en-GB" />
      <Label htmlFor="orders-to" className="text-[13px]">
        to
      </Label>
      <DatePicker id="orders-to" label="Orders to" value={to} onChange={setTo} min={from ?? undefined} today={TODAY} locale="en-GB" />
      <Button variant="primary">Show orders</Button>
    </div>
  );
}
