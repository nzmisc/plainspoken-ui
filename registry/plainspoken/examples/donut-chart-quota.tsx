import { DonutChart } from "@/registry/plainspoken/ui/donut-chart";

const QUOTAS = [
  { name: "Storage", used: 62, detail: "31 GB of 50 GB" },
  { name: "Seats", used: 90, detail: "18 of 20 people" },
  { name: "API calls", used: 7, detail: "70K of 1M this month" },
];

/** Used against left: the part that is left is drawn in the accent gray, so only the used part has a colour. */
export default function DonutChartQuota() {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      {QUOTAS.map((q) => (
        <div key={q.name} className="flex items-center gap-3">
          <DonutChart
            label={`${q.name} used`}
            size={72}
            thickness={10}
            format={(v) => `${v}%`}
            segments={[
              { key: "used", label: "Used", value: q.used, color: "var(--chart-1)" },
              { key: "left", label: "Left", value: 100 - q.used, color: "var(--accent)" },
            ]}
          >
            <b className="text-[14px]">{q.used}%</b>
          </DonutChart>
          <div className="text-[14px] leading-snug">
            <b>{q.name}</b>
            <div className="text-[13px] text-muted-foreground">{q.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
