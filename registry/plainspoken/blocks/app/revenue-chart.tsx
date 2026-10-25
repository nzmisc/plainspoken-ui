"use client";

import { MONTHS, REVENUE } from "@/registry/plainspoken/blocks/app/data";
import { money, moneyShort, monthName, ms } from "@/registry/plainspoken/blocks/app/format";
import { LineChart } from "@/registry/plainspoken/ui/line-chart";
import { Panel } from "@/registry/plainspoken/ui/panel";

export interface AppRevenueChartProps {
  months?: string[];
  invoiced?: number[];
  paid?: number[];
  className?: string;
}

/**
 * Invoiced against paid, month by month for a year, in a panel: two lines told apart by colour,
 * pattern and marker, with a legend that gives the latest month. Hover or arrow through the
 * months for both values at once.
 */
export function AppRevenueChart({ months = MONTHS, invoiced = REVENUE.invoiced, paid = REVENUE.paid, className }: AppRevenueChartProps) {
  const t = months.map((m) => ms(`${m}-01`));
  const total = invoiced.reduce((s, v) => s + v, 0);
  return (
    <Panel title="Invoiced and paid" meta={`last 12 months, ${money(total)} invoiced`} className={className}>
      <LineChart
        label="Invoiced and paid per month, November 2025 to October 2026"
        series={[
          { key: "invoiced", label: "Invoiced", points: invoiced.map((v, i) => ({ t: t[i], v })) },
          { key: "paid", label: "Paid", points: paid.map((v, i) => ({ t: t[i], v })) },
        ]}
        yFormat={moneyShort}
        valueFormat={money}
        xTicks={t}
        xTickFormat={(x) => {
          // "Nov", and the year at each January: the chart thins labels that would collide
          const name = monthName(new Date(x).toISOString().slice(0, 7));
          return name.startsWith("Jan") ? name : name.slice(0, 3);
        }}
        timeFormat={(x) => monthName(new Date(x).toISOString().slice(0, 7))}
        legend="latest"
        height={220}
        locale="en-GB"
      />
    </Panel>
  );
}
