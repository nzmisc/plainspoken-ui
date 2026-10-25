"use client";

import { BarChart } from "@/registry/plainspoken/ui/bar-chart";

const PAGES: [string, number][] = [
  ["/docs/getting-started", 18420],
  ["/pricing", 12960],
  ["/blog/moving-off-the-cloud", 9815],
  ["/docs/api/authentication", 7302],
  ["/changelog", 5120],
  ["/docs/guides/importing-from-csv", 4488],
  ["/about", 1975],
];

/** Horizontal bars for long labels and rankings; the chart grows with the number of rows. "Data" opens the numbers as a table. */
export default function BarChartHorizontal() {
  return (
    <div className="max-w-2xl">
      <BarChart
        orientation="horizontal"
        label="Most viewed pages, last 30 days"
        valueLabel="Views"
        categoryLabel="Page"
        categories={PAGES.map(([p]) => p)}
        series={[{ key: "views", label: "Views", values: PAGES.map(([, v]) => v) }]}
        tickFormat={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))}
        valueFormat={(v) => v.toLocaleString("en-US")}
        dataTable="details"
      />
    </div>
  );
}
