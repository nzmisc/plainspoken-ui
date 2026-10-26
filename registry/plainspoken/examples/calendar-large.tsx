"use client";

import { useState } from "react";
import { daysBetween, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Calendar } from "@/registry/plainspoken/ui/calendar";

const TODAY = "2026-10-19";
const ROTA = ["Amira", "Jonas", "Priya", "Tomás"];
/** Each person is on call for a week, Monday to Sunday, in turn */
function onCall(d: ISODate) {
  const week = Math.floor(daysBetween("2026-09-28", d) / 7);
  return ROTA[((week % ROTA.length) + ROTA.length) % ROTA.length];
}

/** size="large" fills the width and gives each day room for content through renderDay; describeDay puts the same in the day's accessible name. */
export default function CalendarLarge() {
  const [day, setDay] = useState<ISODate | null>(null);
  return (
    <Calendar
      size="large"
      today={TODAY}
      locale="en-GB"
      value={day}
      onChange={setDay}
      renderDay={(d) => <span className="truncate text-[12px] font-normal text-muted-foreground">{onCall(d)}</span>}
      describeDay={(d) => `${onCall(d)} on call`}
    />
  );
}
