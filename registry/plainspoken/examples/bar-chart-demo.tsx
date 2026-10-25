"use client";

import { BarChart } from "@/registry/plainspoken/ui/bar-chart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const ORDERS = [412, 388, 455, 501, 548, 532, 497, 476, 590, 634];

export default function BarChartDemo() {
  return (
    <div className="max-w-2xl">
      <BarChart
        label="Orders per month, January to October 2026"
        valueLabel="Orders"
        categoryLabel="Month"
        categories={MONTHS}
        series={[{ key: "orders", label: "Orders", values: ORDERS }]}
      />
    </div>
  );
}
