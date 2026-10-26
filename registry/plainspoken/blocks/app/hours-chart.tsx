"use client";

import { HOURS } from "@/registry/plainspoken/blocks/app/data";
import { BarChart } from "@/registry/plainspoken/ui/bar-chart";
import { Panel } from "@/registry/plainspoken/ui/panel";

export interface AppHoursChartProps {
  hours?: { name: string; billable: number; internal: number }[];
  className?: string;
}

/** Hours this month per person, billable beside internal: a horizontal grouped bar chart in a panel. */
export function AppHoursChart({ hours = HOURS, className }: AppHoursChartProps) {
  const billable = hours.reduce((s, h) => s + h.billable, 0);
  const all = billable + hours.reduce((s, h) => s + h.internal, 0);
  return (
    <Panel title="Hours this month" meta={`${Math.round((billable / all) * 100)}% billable`} className={className}>
      <BarChart
        label="Hours per person in October, billable and internal"
        orientation="horizontal"
        categories={hours.map((h) => h.name)}
        series={[
          { key: "billable", label: "Billable", values: hours.map((h) => h.billable) },
          { key: "internal", label: "Internal", values: hours.map((h) => h.internal) },
        ]}
        valueLabel="Hours"
        valueFormat={(v) => `${v} h`}
        showValues
        textured
      />
    </Panel>
  );
}
