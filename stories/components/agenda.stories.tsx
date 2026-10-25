import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { addDays, endOfMonth, formatDate, startOfMonth, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Agenda, EventDots, EventLabels, describeEvents, eventsByDate, type CalendarEvent } from "@/registry/plainspoken/ui/agenda";
import { Button } from "@/registry/plainspoken/ui/button";
import { Calendar } from "@/registry/plainspoken/ui/calendar";
import { Legend } from "@/registry/plainspoken/ui/legend";

const TODAY = "2026-10-19";

const KINDS = [
  { key: "release", label: "Releases", color: "var(--chart-1)" },
  { key: "meeting", label: "Meetings", color: "var(--chart-2)" },
  { key: "on call", label: "On call", color: "var(--chart-3)" },
  { key: "deadline", label: "Deadlines", color: "var(--chart-4)" },
];
const colorOf = (kind: string) => KINDS.find((k) => k.key === kind)!.color;

/** A product team's autumn: weekly rituals, a release train, on-call handovers and a few deadlines. */
function sampleEvents(): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const add = (date: ISODate, title: string, kind: string, time?: string) => out.push({ date, title, kind, time, color: colorOf(kind) });
  for (let d = "2026-09-28"; d <= "2026-12-31"; d = addDays(d, 1)) {
    if (weekday(d) === 1) add(d, "Standup and planning", "meeting", "09:30");
    if (weekday(d) === 5) add(d, "Retro", "meeting", "15:30");
    if (weekday(d) === 1) add(d, "On-call handover", "on call", "09:00");
    if (weekday(d) === 3) add(d, "Release train", "release", "16:00");
  }
  add("2026-10-13", "Pricing page copy due", "deadline");
  add("2026-10-26", "Database upgrade", "release", "07:00");
  add("2026-10-26", "Incident review", "meeting", "11:00");
  add("2026-10-26", "Customer call: Northwind", "meeting", "14:00");
  add("2026-11-12", "Q4 roadmap due", "deadline");
  add(TODAY, "Design review: checkout", "meeting", "14:00");
  return out;
}

const meta: Meta<typeof Agenda> = {
  title: "Components/Data display/Agenda",
  component: Agenda,
  args: { events: sampleEvents(), from: TODAY, to: addDays(TODAY, 14), today: TODAY, locale: "en-GB" },
};
export default meta;
type Story = StoryObj<typeof Agenda>;

/** The agenda on its own: the next two weeks, grouped by day, today marked. */
export const AgendaOnly: Story = {};

/** Nothing in the range. */
export const Empty: Story = { args: { from: "2026-12-24", to: "2026-12-24", events: [] } };

/**
 * Month view with short labels in each day, next to the agenda for the shown month. Click a day
 * to see just its events. On phones the labels turn into dots; the agenda carries the detail.
 */
export const MonthAndAgenda: Story = {
  parameters: { layout: "padded" },
  render: function Render() {
    const events = sampleEvents();
    const byDate = eventsByDate(events);
    const [month, setMonth] = useState<ISODate>(TODAY);
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
            {day ? formatDate(day, { weekday: "long", day: "numeric", month: "long" }, "en-GB") : "This month"}
            {day && (
              <Button size="xs" className="font-normal" onClick={() => setDay(null)}>
                Whole month
              </Button>
            )}
          </p>
          <Agenda events={events} from={from} to={to} today={TODAY} locale="en-GB" />
        </div>
      </div>
    );
  },
};

/** The compact calendar with up to three dots per day, for a sidebar or panel, and the chosen day's agenda under it. */
export const CompactWithDots: Story = {
  render: function Render() {
    const events = sampleEvents();
    const byDate = eventsByDate(events);
    const [v, setV] = useState<ISODate | null>(TODAY);
    return (
      <div className="flex max-w-md flex-col gap-2">
        <Calendar
          today={TODAY}
          locale="en-GB"
          value={v}
          onChange={setV}
          renderDay={(d) => <EventDots events={byDate.get(d)} />}
          describeDay={(d) => describeEvents(byDate.get(d))}
        />
        <Legend items={KINDS} shape="square" />
        {v && <Agenda events={events} from={v} to={v} today={TODAY} locale="en-GB" />}
      </div>
    );
  },
};

/** At phone width the table scrolls sideways inside its box rather than squashing the event names. */
export const PhoneWidth: Story = {
  decorators: [
    (S) => (
      <div className="w-[343px]">
        <S />
      </div>
    ),
  ],
};
