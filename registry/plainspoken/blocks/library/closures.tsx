"use client";

import { useState } from "react";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { Agenda, EventLabels, describeEvents, eventsByDate, type CalendarEvent } from "@/registry/plainspoken/ui/agenda";
import { Calendar } from "@/registry/plainspoken/ui/calendar";
import { Legend } from "@/registry/plainspoken/ui/legend";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { cn } from "@/lib/utils";

export interface LibraryClosure {
  date: ISODate;
  /** Last day, for a closure of several days */
  to?: ISODate;
  /** Branch name, or null when every branch is closed */
  branch: string | null;
  reason: string;
}

export interface LibraryClosuresProps {
  closures: LibraryClosure[];
  /** Today, outlined in the calendar; pass it from the server */
  today: ISODate;
  /** The month to open on (any day in it). Default: today's. */
  month?: ISODate;
  /** How far ahead the list goes */
  until: ISODate;
  className?: string;
}

const ALL = "var(--chart-2)";
const ONE = "var(--chart-1)";

function expand(closures: LibraryClosure[]): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const c of closures) {
    let d = c.date;
    const end = c.to ?? c.date;
    while (d <= end) {
      out.push({ date: d, title: c.branch ? `${c.branch}: ${c.reason}` : c.reason, kind: c.branch ? "One branch" : "All branches", color: c.branch ? ONE : ALL });
      const [y, m, day] = d.split("-").map(Number);
      d = new Date(Date.UTC(y, m - 1, day + 1)).toISOString().slice(0, 10);
    }
  }
  return out;
}

/**
 * Days the library is closed, beyond its weekly hours: holidays for every branch, and repairs or
 * training at one. A month calendar with the closures written in the days (dots on phones), or
 * the same as a list, with a legend for the two kinds. Both views come from the same data.
 */
export function LibraryClosures({ closures, today, month, until, className }: LibraryClosuresProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const events = expand(closures);
  const byDate = eventsByDate(events);
  return (
    <div data-slot="library-closures" className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="View"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "calendar", label: "Calendar" },
            { value: "list", label: "List" },
          ]}
        />
        <Legend
          shape="square"
          items={[
            { key: "all", label: "All branches closed", color: ALL },
            { key: "one", label: "One branch closed", color: ONE },
          ]}
          className="text-[13px]"
        />
      </div>
      {view === "calendar" ? (
        <Calendar
          size="large"
          today={today}
          defaultMonth={month ?? today}
          locale="en-US"
          weekStartsOn={0}
          renderDay={(d) => <EventLabels events={byDate.get(d)} />}
          describeDay={(d) => describeEvents(byDate.get(d))}
        />
      ) : (
        <Agenda events={events} from={today} to={until} today={today} locale="en-US" label="Closures" empty="No closures planned." />
      )}
    </div>
  );
}
