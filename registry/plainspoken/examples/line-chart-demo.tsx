"use client";

import { LineChart, type LinePoint } from "@/registry/plainspoken/ui/line-chart";

const DAY = 86_400_000;
const START = Date.UTC(2026, 9, 1, 12);

/** 31 days of a made-up but plausible daily count: a weekly rhythm (quiet weekends) on a slow trend. */
function daily(base: number, growth: number, weekend: number, seed: number): LinePoint[] {
  return Array.from({ length: 31 }, (_, i) => {
    const dow = (i + 4) % 7; // Oct 1 2026 is a Thursday
    const wobble = Math.sin(i * 1.7 + seed) * 0.04 + Math.sin(i * 0.45 + seed * 2) * 0.03;
    const v = base * (1 + growth * i) * (dow === 0 || dow === 6 ? weekend : 1) * (1 + wobble);
    return { t: START + i * DAY, v: Math.round(v) };
  });
}

const SERIES = [
  { key: "web", label: "Web", points: daily(18200, 0.006, 0.62, 1) },
  { key: "ios", label: "iOS", points: daily(9400, 0.011, 1.08, 2) },
  { key: "android", label: "Android", points: daily(6100, 0.009, 1.12, 3) },
];

export default function LineChartDemo() {
  return (
    <div className="max-w-3xl">
      <LineChart
        label="Daily active users by platform, October 2026"
        yLabel="Daily active users"
        series={SERIES}
        legend="latest"
        yFormat={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))}
        valueFormat={(v) => v.toLocaleString("en-US")}
      />
    </div>
  );
}
