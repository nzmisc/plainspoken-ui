import { DonutChart } from "@/registry/plainspoken/ui/donut-chart";

const usd = (v: number) => `$${v.toLocaleString("en-US")}`;

export default function DonutChartDemo() {
  return (
    <DonutChart
      label="Invoices by status, October 2026"
      format={usd}
      size={120}
      thickness={18}
      segments={[
        { key: "paid", label: "Paid", value: 41920 },
        { key: "open", label: "Open", value: 6180 },
        { key: "overdue", label: "Overdue", value: 1240 },
        { key: "draft", label: "Draft", value: 2310 },
      ]}
    >
      <b className="text-[15px]">$51.7K</b>
      <span className="text-[12px] text-muted-foreground">invoiced</span>
    </DonutChart>
  );
}
