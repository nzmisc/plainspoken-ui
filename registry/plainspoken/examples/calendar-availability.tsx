"use client";

import { useState } from "react";
import { addDays, formatDate, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Calendar } from "@/registry/plainspoken/ui/calendar";

const TODAY = "2026-10-19";
const FULLY_BOOKED = new Set(["2026-10-22", "2026-10-29"]);

/** min, max and isDisabled: deliveries on weekdays in the next three weeks, except fully booked days. Unavailable days are struck through and can still be arrowed over. Week numbers on, for people who plan by them. */
export default function CalendarAvailability() {
  const [day, setDay] = useState<ISODate | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Calendar
        today={TODAY}
        locale="en-GB"
        min={addDays(TODAY, 1)}
        max={addDays(TODAY, 21)}
        isDisabled={(d) => weekday(d) === 0 || weekday(d) === 6 || FULLY_BOOKED.has(d)}
        describeDay={(d) => (FULLY_BOOKED.has(d) ? "fully booked" : undefined)}
        showWeekNumbers
        value={day}
        onChange={setDay}
      />
      <p className="text-[14px] text-muted-foreground">
        {day ? `Delivery on ${formatDate(day, { weekday: "long", day: "numeric", month: "long" }, "en-GB")}, 8:00–12:00.` : "Choose a delivery day."}
      </p>
    </div>
  );
}
