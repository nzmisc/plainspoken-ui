import { STATS } from "@/registry/plainspoken/blocks/app/data";
import { money } from "@/registry/plainspoken/blocks/app/format";
import { Sparkline } from "@/registry/plainspoken/ui/sparkline";
import { Stat, StatGroup, type StatDirection } from "@/registry/plainspoken/ui/stat";

const pct = (now: number, before: number) => `${Math.abs(Math.round(((now - before) / before) * 100))}%`;
const dir = (now: number, before: number): StatDirection => (now > before ? "up" : now < before ? "down" : "flat");

export interface AppStatsProps {
  stats?: typeof STATS;
  /** At most this many side by side. Default 4; 2 for a narrow column. */
  columns?: 2 | 4;
  className?: string;
}

/**
 * The four numbers at the top of the dashboard, each with how it moved since last month and a
 * sparkline of the last twelve months: invoiced, outstanding, overdue (where up is bad) and days
 * to get paid (where down is good). Renders on the server.
 */
export function AppStats({ stats = STATS, columns = 4, className }: AppStatsProps) {
  const s = stats;
  return (
    <StatGroup columns={columns} className={className}>
      <Stat
        label="Invoiced in October"
        value={money(s.revenue.value)}
        change={{ direction: dir(s.revenue.value, s.revenue.previous), value: pct(s.revenue.value, s.revenue.previous), period: "on September" }}
        chart={<Sparkline values={s.revenue.trend} label="Invoiced per month, last 12 months" format={money} area />}
      />
      <Stat
        label="Outstanding"
        value={money(s.outstanding.value)}
        change={{ direction: dir(s.outstanding.value, s.outstanding.previous), value: pct(s.outstanding.value, s.outstanding.previous), sentiment: "neutral", period: "on September" }}
        chart={<Sparkline values={s.outstanding.trend} label="Outstanding at month end, last 12 months" format={money} color="var(--chart-2)" />}
      />
      <Stat
        label="Overdue"
        value={money(s.overdue.value)}
        change={{ direction: dir(s.overdue.value, s.overdue.previous), value: pct(s.overdue.value, s.overdue.previous), sentiment: "bad", period: "on September" }}
        hint="4 invoices, oldest 27 days late"
        chart={<Sparkline values={s.overdue.trend} label="Overdue at month end, last 12 months" format={money} type="bar" color="var(--destructive)" />}
      />
      <Stat
        label="Average days to get paid"
        value={`${s.daysToPay.value} days`}
        change={{ direction: dir(s.daysToPay.value, s.daysToPay.previous), value: `${Math.abs(s.daysToPay.value - s.daysToPay.previous)} days`, sentiment: "good", period: "on September" }}
        chart={<Sparkline values={s.daysToPay.trend} label="Days to get paid, last 12 months" color="var(--chart-3)" />}
      />
    </StatGroup>
  );
}
