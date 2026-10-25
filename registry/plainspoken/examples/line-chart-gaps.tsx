"use client";

import { LineChart, type LinePoint } from "@/registry/plainspoken/ui/line-chart";

const MIN = 60_000;
const END = Date.UTC(2026, 9, 19, 14, 0);
const START = END - 120 * MIN;

/** Two hours of one-minute samples; the metrics agent was down from 13:05 to 13:20 and missed one sample at 13:41. */
function samples(f: (i: number) => number): LinePoint[] {
  return Array.from({ length: 121 }, (_, i) => {
    const missing = (i >= 65 && i < 80) || i === 101;
    return { t: START + i * MIN, v: missing ? null : Math.round(f(i) * 10) / 10 };
  });
}

/** Missing samples are left as gaps instead of being joined across; a fixed 0–100% axis keeps the two lines comparable. */
export default function LineChartGaps() {
  return (
    <div className="max-w-3xl">
      <LineChart
        label="CPU and memory of web-01, last two hours"
        yLabel="Percent of capacity"
        xDomain={[START, END]}
        yDomain={[0, 100]}
        yTicks={[0, 25, 50, 75, 100]}
        yFormat={(v) => `${v}%`}
        valueFormat={(v) => `${v.toFixed(1)}%`}
        gapMs={90_000}
        legend="latest"
        series={[
          { key: "cpu", label: "CPU", points: samples((i) => 22 + 14 * Math.sin(i / 9) + ((i * 7) % 11)) },
          { key: "mem", label: "Memory", points: samples((i) => 48 + i / 9 + Math.sin(i / 4) * 1.5) },
        ]}
      />
    </div>
  );
}
