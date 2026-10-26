"use client";

import { BarChart } from "@/registry/plainspoken/ui/bar-chart";

/**
 * Several series side by side in each category, always in the legend's order. `textured` adds
 * stripes and dots to every series after the first, for print and readers who can't tell the
 * colours apart.
 */
export default function BarChartGrouped() {
  return (
    <div className="max-w-2xl">
      <BarChart
        label="New subscriptions by plan, per quarter"
        valueLabel="New subscriptions"
        categoryLabel="Quarter"
        categories={["Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"]}
        series={[
          { key: "starter", label: "Starter", values: [1240, 1385, 1310, 1502] },
          { key: "team", label: "Team", values: [610, 702, 815, 940] },
          { key: "business", label: "Business", values: [88, 121, 164, 203] },
        ]}
        tickFormat={(v) => v.toLocaleString("en-US")}
        textured
      />
    </div>
  );
}
