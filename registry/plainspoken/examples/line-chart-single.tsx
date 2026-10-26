"use client";

import { LineChart, type LinePoint } from "@/registry/plainspoken/ui/line-chart";

const DAY = 86_400_000;
const START = Date.UTC(2026, 8, 21, 12);

// Prepaid API credit: spent a little every day, topped up once.
const balance: LinePoint[] = [];
for (let i = 0, b = 25; i < 28; i++) {
  if (i === 17) b += 20;
  balance.push({ t: START + i * DAY, v: Math.round(b * 100) / 100 });
  b -= 0.9 + ((i * 37) % 10) / 12;
}

/** One series needs no legend: the label says what it is. "Data" under the chart opens the numbers for everyone. */
export default function LineChartSingle() {
  return (
    <div className="max-w-xl">
      <LineChart
        label="API credit balance, last four weeks"
        summary="The balance falls by about $1.20 a day, from $25.00 to $4.77 on October 7, back to $23.70 after a $20 top-up on October 8, and down to $10.95 by October 18."
        yLabel="Balance (USD)"
        height={150}
        yFormat={(v) => `$${v}`}
        valueFormat={(v) => `$${v.toFixed(2)}`}
        series={[{ key: "balance", label: "Balance", points: balance }]}
        dataTable="details"
      />
    </div>
  );
}
