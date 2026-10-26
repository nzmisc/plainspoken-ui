"use client";

import { useState } from "react";
import { formatDate, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Calendar } from "@/registry/plainspoken/ui/calendar";

const TODAY = "2026-10-19";

export default function CalendarDemo() {
  const [day, setDay] = useState<ISODate | null>("2026-10-23");
  return (
    <div className="flex flex-col gap-2">
      <Calendar today={TODAY} locale="en-GB" value={day} onChange={setDay} />
      <p className="text-[14px] text-muted-foreground">
        {day ? <>Collection on {formatDate(day, { dateStyle: "full" }, "en-GB")}</> : "No day chosen"}
      </p>
    </div>
  );
}
