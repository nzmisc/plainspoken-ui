"use client";

import type { ReactNode } from "react";
import { formatDate, type ISODate } from "@/registry/plainspoken/lib/dates";
import { useDateLocale, useToday } from "@/registry/plainspoken/hooks/use-today";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  date: ISODate;
  title: string;
  /** Category, written out in the agenda and in a day's accessible name, so colour is never the only clue */
  kind: string;
  /** CSS colour for the swatch, usually a chart token: "var(--chart-1)". One per kind. */
  color: string;
  /** "09:30", or left out for all day */
  time?: string;
}

/** Groups events by date, each day's in time order (all-day events first). */
export function eventsByDate(events: CalendarEvent[]): Map<ISODate, CalendarEvent[]> {
  const out = new Map<ISODate, CalendarEvent[]>();
  for (const e of [...events].sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))) {
    out.set(e.date, [...(out.get(e.date) ?? []), e]);
  }
  return out;
}

/**
 * Up to `max` small squares for a compact calendar cell; with more events than that, one fewer
 * square and "+n", so the row is never wider than `max` squares and a little text. Decorative:
 * pair with describeEvents for the day's accessible name.
 */
export function EventDots({ events, max = 3 }: { events?: CalendarEvent[]; max?: number }) {
  if (!events?.length) return null;
  const shown = events.length > max ? events.slice(0, max - 1) : events;
  return (
    <span aria-hidden className="flex items-center gap-px text-[10px] leading-none font-normal">
      {shown.map((e, i) => (
        <span key={i} className="inline-block size-1.5 shrink-0" style={{ background: e.color }} />
      ))}
      {shown.length < events.length && <span className="pl-px text-muted-foreground">+{events.length - shown.length}</span>}
    </span>
  );
}

/**
 * Short labels for a large calendar cell (Calendar size="large"); the cell clips what doesn't fit
 * and says how many are hidden. Below the sm breakpoint a cell is too narrow for words, so it falls
 * back to dots. Decorative: pair with describeEvents for the day's accessible name.
 */
export function EventLabels({ events, max = 2 }: { events?: CalendarEvent[]; max?: number }) {
  if (!events?.length) return null;
  return (
    <>
      <span className="sm:hidden">
        <EventDots events={events} />
      </span>
      <span aria-hidden className="hidden min-w-0 flex-col text-[11px] leading-tight font-normal sm:flex">
        {events.slice(0, max).map((e, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1">
            <span className="inline-block size-1.5 shrink-0" style={{ background: e.color }} />
            <span className="truncate">{e.title}</span>
          </span>
        ))}
        {events.length > max && <span className="text-muted-foreground">+{events.length - max} more</span>}
      </span>
    </>
  );
}

/** A day's events in words, for Calendar's describeDay: "2 events: Release 4.2 (release), Retro (meeting)". */
export const describeEvents = (events?: CalendarEvent[]) =>
  events?.length ? `${events.length} event${events.length > 1 ? "s" : ""}: ${events.map((e) => `${e.title} (${e.kind})`).join(", ")}` : undefined;

export interface AgendaProps {
  events: CalendarEvent[];
  /** First and last day to list, inclusive */
  from: ISODate;
  to: ISODate;
  /** Marks this day "today"; the viewer's today when left out (filled in once the page runs in the browser) */
  today?: ISODate;
  /** Locale for the day names; pass one when the agenda is server-rendered so both sides agree */
  locale?: string;
  /** Shown when nothing falls between from and to */
  empty?: ReactNode;
  /** Accessible name of the table, e.g. "Releases in October" */
  label?: string;
  className?: string;
}

const TH = "border border-border bg-muted px-2 py-1 text-left font-semibold whitespace-nowrap";
const TD = "border border-border px-2 py-1 align-top";

/**
 * A plain table of events grouped by day: the list view to go with a month calendar, and the
 * way to read it without a pointer or good eyesight. Days without events are left out; each day is
 * its own row group, headed by the date.
 */
export function Agenda({ events, from, to, today: todayProp, locale: localeProp, empty, label, className }: AgendaProps) {
  const clientToday = useToday();
  const today = todayProp ?? clientToday;
  const locale = useDateLocale(localeProp);
  const days = [...eventsByDate(events.filter((e) => e.date >= from && e.date <= to))];
  if (!days.length)
    return (
      <p data-slot="agenda" className={cn("text-[14px] text-muted-foreground", className)}>
        {empty ?? (from === to ? `Nothing on ${from}.` : `Nothing between ${from} and ${to}.`)}
      </p>
    );
  return (
    <div data-slot="agenda" className={cn("max-w-full overflow-x-auto", className)}>
      <table aria-label={label} className="w-full border-collapse text-[14px] leading-snug">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Date
            </th>
            <th scope="col" className={TH}>
              Time
            </th>
            <th scope="col" className={cn(TH, "w-full")}>
              Event
            </th>
            <th scope="col" className={TH}>
              Kind
            </th>
          </tr>
        </thead>
        {days.map(([date, list]) => (
          <tbody key={date}>
            {list.map((e, i) => (
              <tr key={i}>
                {i === 0 && (
                  <th scope="rowgroup" rowSpan={list.length} className={cn(TD, "text-left font-normal whitespace-nowrap")}>
                    <span className={cn(date === today && "font-semibold")}>{formatDate(date, { weekday: "short", day: "numeric", month: "short" }, locale)}</span>
                    {date === today && <span className="text-muted-foreground"> today</span>}
                  </th>
                )}
                <td className={cn(TD, "whitespace-nowrap text-muted-foreground tabular-nums")}>{e.time ?? "all day"}</td>
                <td className={TD}>{e.title}</td>
                <td className={cn(TD, "whitespace-nowrap")}>
                  <span className="inline-flex items-center gap-1.5">
                    <Swatch color={e.color} />
                    {e.kind}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
