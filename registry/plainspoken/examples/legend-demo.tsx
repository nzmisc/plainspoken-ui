import { seriesStyle } from "@/registry/plainspoken/lib/chart-scale";
import { Legend } from "@/registry/plainspoken/ui/legend";

const SERIES = ["Web", "iOS", "Android"].map((label, i) => ({ key: label, label, ...seriesStyle(i) }));

/** Line keys carry each series' dash pattern and marker as well as its colour, so they still match the chart in grayscale. */
export default function LegendDemo() {
  return (
    <div className="flex flex-col gap-3">
      <Legend items={SERIES} />
      <Legend items={SERIES.map((s, i) => ({ ...s, value: ["18,204", "9,871", "6,302"][i] }))} />
      <Legend
        shape="square"
        items={[
          { key: "paid", label: "Paid", color: "var(--chart-1)", value: "$41,920" },
          { key: "open", label: "Open", color: "var(--chart-2)", value: "$6,180" },
          { key: "overdue", label: "Overdue", color: "var(--chart-4)", value: "$1,240" },
        ]}
      />
    </div>
  );
}
