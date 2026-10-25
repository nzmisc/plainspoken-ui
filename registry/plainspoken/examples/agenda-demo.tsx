import { Agenda, type CalendarEvent } from "@/registry/plainspoken/ui/agenda";

const TODAY = "2026-10-19";

const EVENTS: CalendarEvent[] = [
  { date: "2026-10-19", time: "09:30", title: "Sprint planning", kind: "meeting", color: "var(--chart-2)" },
  { date: "2026-10-19", time: "14:00", title: "Design review: checkout", kind: "meeting", color: "var(--chart-2)" },
  { date: "2026-10-20", title: "Jonas on call", kind: "on call", color: "var(--chart-3)" },
  { date: "2026-10-21", time: "16:00", title: "Release 4.2 to staging", kind: "release", color: "var(--chart-1)" },
  { date: "2026-10-23", time: "10:00", title: "Release 4.2 to production", kind: "release", color: "var(--chart-1)" },
  { date: "2026-10-23", time: "15:30", title: "Retro", kind: "meeting", color: "var(--chart-2)" },
  { date: "2026-10-27", title: "Q4 roadmap due", kind: "deadline", color: "var(--chart-4)" },
  { date: "2026-10-30", time: "11:00", title: "Security patch window", kind: "release", color: "var(--chart-1)" },
];

/** The next two weeks of a product team, grouped by day. Kinds are written out: the swatch only repeats them. */
export default function AgendaDemo() {
  return <Agenda events={EVENTS} from={TODAY} to="2026-11-01" today={TODAY} locale="en-GB" label="Team events, 19 October to 1 November" />;
}
