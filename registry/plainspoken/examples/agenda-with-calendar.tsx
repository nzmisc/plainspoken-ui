"use client";

import { useState } from "react";
import { endOfMonth, formatDate, startOfMonth, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Agenda, EventLabels, describeEvents, eventsByDate, type CalendarEvent } from "@/registry/plainspoken/ui/agenda";
import { Button } from "@/registry/plainspoken/ui/button";
import { Calendar } from "@/registry/plainspoken/ui/calendar";
import { Legend } from "@/registry/plainspoken/ui/legend";

const TODAY = "2026-10-19";

const KINDS = [
  { key: "release", label: "Release", color: "var(--chart-1)" },
  { key: "meeting", label: "Meeting", color: "var(--chart-2)" },
  { key: "deadline", label: "Deadline", color: "var(--chart-4)" },
];
const color = (kind: string) => KINDS.find((k) => k.key === kind)!.color;
const ev = (date: ISODate, title: string, kind: string, time?: string): CalendarEvent => ({ date, title, kind, time, color: color(kind) });

const EVENTS: CalendarEvent[] = [
  ev("2026-10-05", "Release 4.1", "release", "10:00"),
  ev("2026-10-05", "Sprint planning", "meeting", "09:30"),
  ev("2026-10-09", "Retro", "meeting", "15:30"),
  ev("2026-10-14", "Hotfix 4.1.1", "release", "17:00"),
  ev("2026-10-19", "Sprint planning", "meeting", "09:30"),
  ev("2026-10-19", "Design review", "meeting", "14:00"),
  ev("2026-10-21", "4.2 to staging", "release", "16:00"),
  ev("2026-10-23", "Release 4.2", "release", "10:00"),
  ev("2026-10-23", "Retro", "meeting", "15:30"),
  ev("2026-10-23", "Changelog", "deadline"),
  ev("2026-10-27", "Q4 roadmap due", "deadline"),
  ev("2026-10-30", "Patch window", "release", "11:00"),
  ev("2026-11-02", "Sprint planning", "meeting", "09:30"),
  ev("2026-11-12", "Release 4.3", "release", "10:00"),
];

/** A release calendar: the month with short labels in each day, and the agenda for the month (or the day you click) beside it. On phones the labels become dots and the agenda carries the detail. */
export default function AgendaWithCalendar() {
  const byDate = eventsByDate(EVENTS);
  const [month, setMonth] = useState<ISODate>("2026-10-01");
  const [day, setDay] = useState<ISODate | null>(null);
  const from = day ?? startOfMonth(month);
  const to = day ?? endOfMonth(month);
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Calendar
          size="large"
          today={TODAY}
          locale="en-GB"
          month={month}
          onMonthChange={(m) => {
            setMonth(m);
            setDay(null);
          }}
          value={day}
          onChange={(d) => setDay(d === day ? null : d)}
          renderDay={(d) => <EventLabels events={byDate.get(d)} />}
          describeDay={(d) => describeEvents(byDate.get(d))}
        />
        <Legend items={KINDS} shape="square" />
      </div>
      <div className="flex min-w-0 flex-col gap-2 lg:w-96">
        <p className="flex min-h-6 items-center gap-2 text-[14px] font-semibold">
          {day ? formatDate(day, { weekday: "long", day: "numeric", month: "long" }, "en-GB") : formatDate(month, { month: "long", year: "numeric" }, "en-GB")}
          {day && (
            <Button size="xs" className="font-normal" onClick={() => setDay(null)}>
              Whole month
            </Button>
          )}
        </p>
        <Agenda events={EVENTS} from={from} to={to} today={TODAY} locale="en-GB" />
      </div>
    </div>
  );
}
