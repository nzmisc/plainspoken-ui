"use client";

import { BarChart } from "@/registry/plainspoken/ui/bar-chart";

const WEEKS = ["Sep 7", "Sep 14", "Sep 21", "Sep 28", "Oct 5", "Oct 12", "Oct 19"];
const NET = [184, 92, -41, 37, -118, 63, 141];

/** Values below zero hang from the zero line, so gains and losses read at a glance. */
export default function BarChartNegative() {
  return (
    <div className="max-w-xl">
      <BarChart
        label="Net change in paying customers per week"
        summary="Five of seven weeks grew; the week of October 5 lost 118 customers after the price change."
        valueLabel="Customers gained or lost"
        categoryLabel="Week starting"
        categories={WEEKS}
        series={[{ key: "net", label: "Net change", values: NET }]}
        valueFormat={(v) => (v > 0 ? `+${v}` : String(v))}
        tickFormat={(v) => String(v)}
        height={220}
      />
    </div>
  );
}
