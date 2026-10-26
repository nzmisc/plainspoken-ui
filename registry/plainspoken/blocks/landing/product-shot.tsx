"use client";

import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { LineChart, type LineSeries } from "@/registry/plainspoken/ui/line-chart";
import { Navbar } from "@/registry/plainspoken/ui/navbar";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Sparkline } from "@/registry/plainspoken/ui/sparkline";
import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { cn } from "@/lib/utils";

// Sample data, fixed so the picture is the same on every render: 24 hours of p95 response times
// every 30 minutes, ending at a fixed moment, with the EU API slowing down in the last hour.
const T0 = Date.UTC(2026, 9, 24, 15, 0);
const STEP = 30 * 60_000;
const wave = (i: number, base: number, amp: number, period: number, phase = 0) => Math.round(base + amp * Math.sin(i / period + phase) + ((i * 37) % 11));

const SERIES: LineSeries[] = [
  {
    key: "eu",
    label: "Frankfurt",
    points: Array.from({ length: 48 }, (_, i) => ({ t: T0 + i * STEP, v: i >= 46 ? 380 + (i - 46) * 60 : wave(i, 168, 24, 5) })),
  },
  {
    key: "us",
    label: "Virginia",
    points: Array.from({ length: 48 }, (_, i) => ({ t: T0 + i * STEP, v: wave(i, 214, 18, 4, 1.3) })),
  },
];

const CHECKS: { name: string; kind: string; status: "up" | "slow"; uptime: string; ms: number[] }[] = [
  { name: "www.mosswood.example", kind: "HTTP", status: "up", uptime: "100%", ms: [182, 176, 190, 171, 168, 175, 181, 172, 169, 174] },
  { name: "api.mosswood.example (EU)", kind: "API", status: "slow", uptime: "99.91%", ms: [160, 171, 158, 166, 175, 169, 172, 240, 390, 440] },
  { name: "api.mosswood.example (US)", kind: "API", status: "up", uptime: "99.99%", ms: [214, 220, 209, 218, 225, 211, 207, 216, 219, 212] },
  { name: "checkout", kind: "HTTP", status: "up", uptime: "100%", ms: [301, 296, 310, 288, 305, 299, 292, 301, 297, 290] },
  { name: "nightly-backup", kind: "Heartbeat", status: "up", uptime: "100%", ms: [4, 4, 5, 4, 4, 4, 5, 4, 4, 4] },
  { name: "status.mosswood.example", kind: "HTTP", status: "up", uptime: "100%", ms: [96, 101, 94, 99, 92, 97, 95, 98, 93, 96] },
  { name: "search-reindex", kind: "Heartbeat", status: "up", uptime: "99.95%", ms: [12, 14, 11, 13, 12, 15, 12, 11, 13, 12] },
  { name: "smtp.mosswood.example", kind: "TCP", status: "up", uptime: "100%", ms: [41, 44, 39, 42, 40, 43, 41, 38, 42, 40] },
];

const ms = (v: number) => `${Math.round(v)} ms`;

const TABS = [
  { key: "checks", label: "Checks", href: "#checks" },
  { key: "incidents", label: "Incidents", href: "#incidents" },
  { key: "status", label: "Status pages", href: "#status-pages" },
  { key: "oncall", label: "On call", href: "#on-call" },
];

export interface LandingProductShotProps {
  /** The product's name, in the picture's top bar */
  product?: string;
  /** What the picture shows, for screen readers (the picture itself is hidden from them and from the keyboard) */
  description?: string;
  className?: string;
}

/**
 * A "screenshot" of the product that is the product's own components: a Navbar, a row of stats,
 * a response-time chart and a table of checks with sparklines and statuses. It is drawn live, so
 * it follows light and dark mode and stays sharp at any size. The whole picture is `inert`
 * (no Tab stops, nothing for screen readers to wander into) and described in one sentence instead.
 */
export function LandingProductShot({
  product = "Keepwatch",
  description = "The Keepwatch dashboard: 48 checks, 99.98% uptime over 30 days, a median response of 184 ms, and one open incident, the EU API responding slowly for the last hour.",
  className,
}: LandingProductShotProps) {
  return (
    <figure data-slot="landing-product-shot" className={cn("min-w-0", className)}>
      <div inert className="overflow-hidden border border-border bg-background text-[14px] select-none">
        <Navbar
          brand={product}
          links={TABS}
          current="checks"
          label="Product sections"
          actions={
            <span className="flex items-center gap-2">
              <Badge variant="warning">1 incident</Badge>
              <Avatar name="Marta Kos" size={24} />
            </span>
          }
          phone="hide"
        />
        <div className="flex flex-col gap-3 p-3">
          <StatGroup columns={4}>
            <Stat label="Uptime, 30 days" value="99.98%" change={{ direction: "up", value: "0.03 pts", period: "vs September" }} />
            <Stat
              label="Median response"
              value="184 ms"
              change={{ direction: "down", value: "12 ms", sentiment: "good", period: "vs last week" }}
              chart={<Sparkline values={[201, 198, 196, 193, 190, 188, 187, 185, 184]} label="Median response, last 9 days" format={ms} />}
            />
            <Stat label="Open incidents" value="1" hint="EU API slow since 14:02" />
            <Stat label="Checks" value="48" hint="of 100 on the Team plan" />
          </StatGroup>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <Panel title="Response time" meta="p95, last 24 hours" as="h3">
              <LineChart series={SERIES} label="p95 response time, last 24 hours" height={190} yFormat={ms} markers="end" dataTable="none" />
            </Panel>
            <Panel title="Checks" meta="8 of 48" as="h3" flush>
              <Table density="compact" frameless>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Last 5 hours</TableHead>
                    <TableHead>30 days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CHECKS.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="max-w-[10rem] truncate sm:max-w-[14rem]">
                        {c.name} <span className="hidden text-muted-foreground sm:inline">· {c.kind}</span>
                      </TableCell>
                      <TableCell>
                        {c.status === "up" ? <Status variant="success">up</Status> : <Status variant="warning">slow</Status>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Sparkline
                          values={c.ms}
                          label={`${c.name} response time`}
                          format={ms}
                          width={72}
                          height={16}
                          color={c.status === "slow" ? "var(--warning)" : undefined}
                        />
                      </TableCell>
                      <TableCell numeric>{c.uptime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{description}</figcaption>
    </figure>
  );
}
