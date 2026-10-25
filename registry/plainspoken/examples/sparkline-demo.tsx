import { Sparkline } from "@/registry/plainspoken/ui/sparkline";

const STATS = [
  { name: "Revenue", value: "$48,210", change: "+8.2% on September", values: [31, 34, 33, 37, 36, 39, 41, 40, 43, 42, 46, 48], format: (v: number) => `$${v}K` },
  { name: "Active users", value: "12,904", change: "+3.1% on September", values: [11.2, 11.4, 11.3, 11.9, 12.1, 11.8, 12.0, 12.3, 12.2, 12.6, 12.7, 12.9], format: (v: number) => `${v}K` },
  { name: "Refund rate", value: "1.4%", change: "−0.3 points on September", values: [2.1, 1.9, 2.2, 1.8, 1.7, 1.9, 1.6, 1.8, 1.5, 1.6, 1.5, 1.4], format: (v: number) => `${v}%` },
];

/** Beside a headline number: the shape of the last twelve months, with the numbers that matter in its accessible name. */
export default function SparklineDemo() {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
      {STATS.map((s) => (
        <div key={s.name} className="flex flex-col gap-0.5">
          <dt className="text-[13px] text-muted-foreground">{s.name}</dt>
          <dd className="flex items-center gap-3">
            <span className="text-[22px] font-bold">{s.value}</span>
            <Sparkline values={s.values} label={`${s.name}, last 12 months`} format={s.format} width={96} height={28} area />
          </dd>
          <dd className="text-[13px] text-muted-foreground">{s.change}</dd>
        </div>
      ))}
    </dl>
  );
}
