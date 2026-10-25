"use client";

import { useState } from "react";
import { addDays, daysBetween, formatDate, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Calendar, type DateRange } from "@/registry/plainspoken/ui/calendar";
import { Button } from "@/registry/plainspoken/ui/button";

const TODAY = "2026-10-19";

function workingDays(start: ISODate, end: ISODate) {
  let n = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) if (weekday(d) !== 0 && weekday(d) !== 6) n++;
  return n;
}

/** mode="range": the first click sets the start, the second the end, with the range previewed in between. Two months side by side for a range across the turn of a month. */
export default function CalendarRange() {
  const [range, setRange] = useState<DateRange | null>({ start: "2026-12-21", end: "2027-01-01" });
  const short = (d: ISODate) => formatDate(d, { day: "numeric", month: "short" }, "en-GB");
  return (
    <div className="flex flex-col gap-2">
      <Calendar mode="range" numberOfMonths={2} today={TODAY} locale="en-GB" defaultMonth="2026-12-01" value={range} onChange={setRange} />
      <p className="flex flex-wrap items-center gap-2 text-[14px]">
        {!range ? (
          <span className="text-muted-foreground">Click the first day off.</span>
        ) : range.end === null ? (
          <span className="text-muted-foreground">From {short(range.start)}: now click the last day off.</span>
        ) : (
          <span>
            Leave from <b>{short(range.start)}</b> to <b>{short(range.end)}</b>: {daysBetween(range.start, range.end) + 1} days, {workingDays(range.start, range.end)} of
            them working days.
          </span>
        )}
        {range && (
          <Button size="xs" onClick={() => setRange(null)}>
            Clear
          </Button>
        )}
      </p>
    </div>
  );
}
