import { Alert } from "@/registry/plainspoken/ui/alert";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Status, type StatusVariant } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { cn } from "@/lib/utils";

// Small pictures of the product for the alternating feature sections, built from components and
// filled with sample data. Unlike the hero shot they are not inert: they are short enough to read
// with a screen reader, and the heartbeat's copy button works.

export interface LandingTimelineEvent {
  /** "14:02:10" */
  time: string;
  variant: StatusVariant;
  /** The state in a word or two: "down", "paged" */
  state: string;
  /** What happened, in a sentence */
  text: string;
}

const TIMELINE: LandingTimelineEvent[] = [
  { time: "03:17:40", variant: "default", state: "ignored", text: "Sydney timed out; Singapore and Frankfurt were fine. Nobody paged." },
  { time: "14:02:10", variant: "destructive", state: "failing", text: "Frankfurt: no response after 10 s" },
  { time: "14:02:13", variant: "destructive", state: "down", text: "Virginia and Singapore: HTTP 503. Confirmed." },
  { time: "14:02:14", variant: "info", state: "paged", text: "Texted and called Marta Kos (on call). Status page updated." },
  { time: "14:03:40", variant: "info", state: "acknowledged", text: "Marta replied “ack” to the text." },
  { time: "14:06:05", variant: "success", state: "up", text: "Up in all six regions. Closed after 3 min 55 s." },
];

/** An incident as Keepwatch records it: a false alarm that was caught, then a real outage from first failure to recovery. */
export function LandingAlertTimeline({ events = TIMELINE, className }: { events?: LandingTimelineEvent[]; className?: string }) {
  return (
    <Panel title="api.mosswood.example" meta="incident #212, today" as="h3" className={className} flush>
      <ol className="flex flex-col text-[13px]">
        {events.map((e) => (
          <li key={e.time} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 border-b border-border px-2 py-1.5 last:border-b-0">
            <time className="font-mono text-muted-foreground tabular-nums">{e.time}</time>
            <p className="min-w-0">
              <Status variant={e.variant} className="font-medium">
                {e.state}
              </Status>{" "}
              {e.text}
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

type Day = "ok" | "slow" | "down";

/** 90 days of one component's history, mostly fine, with the given bad days */
function history(bad: Record<number, Day>): Day[] {
  return Array.from({ length: 90 }, (_, i) => bad[i] ?? "ok");
}

const COMPONENTS: { name: string; uptime: string; incidents: number; days: Day[]; now: StatusVariant; nowText: string }[] = [
  { name: "Website", uptime: "100%", incidents: 0, days: history({}), now: "success", nowText: "Operational" },
  { name: "Online shop", uptime: "99.97%", incidents: 1, days: history({ 61: "down" }), now: "success", nowText: "Operational" },
  { name: "Order API", uptime: "99.91%", incidents: 2, days: history({ 23: "slow", 89: "slow" }), now: "warning", nowText: "Slower than usual" },
  { name: "Email notifications", uptime: "99.99%", incidents: 1, days: history({ 40: "slow" }), now: "success", nowText: "Operational" },
];

const DAY_CLASS: Record<Day, string> = { ok: "bg-success/70", slow: "bg-warning", down: "bg-destructive" };

/** A customer's public status page as Keepwatch draws it: the overall state, then each component with 90 days of history. */
export function LandingStatusPagePreview({ company = "Mosswood Books", className }: { company?: string; className?: string }) {
  return (
    <div data-slot="landing-status-page" className={cn("border border-border bg-background", className)}>
      <div className="flex items-baseline justify-between gap-2 border-b border-border bg-muted px-3 py-2">
        <h3 className="font-bold">{company} status</h3>
        <span className="font-mono text-[12px] text-muted-foreground">status.mosswood.example</span>
      </div>
      <div className="flex flex-col gap-3 p-3">
        <Alert variant="warning" title="Order API: slower than usual">
          Orders go through, but take a few seconds longer. We&rsquo;re on it. Next update by 14:30.
        </Alert>
        <ul className="flex flex-col">
          {COMPONENTS.map((c) => (
            <li key={c.name} className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-semibold">{c.name}</span>
                <Status variant={c.now} className="text-[13px]">
                  {c.nowText}
                </Status>
              </div>
              <div aria-hidden className="flex h-5 gap-px">
                {c.days.map((d, i) => (
                  <span key={i} className={cn("min-w-0 flex-1", DAY_CLASS[d])} />
                ))}
              </div>
              <p className="flex justify-between text-[12px] text-muted-foreground">
                <span>90 days ago</span>
                <span>
                  {c.uptime} uptime, {c.incidents === 0 ? "no incidents" : `${c.incidents} ${c.incidents === 1 ? "incident" : "incidents"}`}
                </span>
                <span>today</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const JOBS: { job: string; schedule: string; last: string; status: StatusVariant; word: string }[] = [
  { job: "nightly-backup", schedule: "daily at 03:30", last: "10 h ago", status: "success", word: "on time" },
  { job: "invoice-run", schedule: "hourly", last: "12 min ago", status: "success", word: "on time" },
  { job: "search-reindex", schedule: "every 15 min", last: "58 min ago", status: "warning", word: "late by 43 min" },
  { job: "sitemap", schedule: "Mondays 06:00", last: "6 days ago", status: "success", word: "on time" },
  { job: "old-export", schedule: "daily at 01:00", last: "31 days ago", status: "default", word: "paused" },
];

const PING = "curl -fsS https://ping.keepwatch.example/7f3c2a";

/** Cron jobs reporting in: the one line a job adds at its end, and the table of when each last pinged. */
export function LandingHeartbeatTable({ className }: { className?: string }) {
  return (
    <div data-slot="landing-heartbeats" className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2 border border-border bg-muted py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap">
          <span className="text-muted-foreground"># last line of the job: </span>
          {PING}
        </code>
        <CopyButton text={PING} name="ping command" size="sm" />
      </div>
      <Table density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead className="hidden sm:table-cell">Schedule</TableHead>
            <TableHead>Last ping</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {JOBS.map((j) => (
            <TableRow key={j.job}>
              <TableCell className="font-mono">{j.job}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{j.schedule}</TableCell>
              <TableCell className="whitespace-nowrap">{j.last}</TableCell>
              <TableCell>
                <Status variant={j.status}>{j.word}</Status>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
