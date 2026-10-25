import { Card, CardContent } from "@/registry/plainspoken/ui/card";
import { Stat } from "@/registry/plainspoken/ui/stat";

const DAILY = [31, 34, 29, 40, 38, 44, 41, 47, 52, 49, 55, 58];

/** A tiny line chart for the slot; hidden from screen readers, since the change line already says which way it went. */
function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 80},${26 - ((v - min) / (max - min)) * 24}`).join(" ");
  return (
    <svg aria-hidden width={80} height={28} viewBox="0 0 80 28" className="block overflow-visible">
      <polyline points={points} fill="none" stroke="var(--color-chart-1)" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/** chart puts a small chart to the right of the number. */
export default function StatSparkline() {
  return (
    <Card className="max-w-xs">
      <CardContent>
        <Stat
          label="Signups per day"
          value="58"
          change={{ value: "87%", direction: "up", period: "in 12 days" }}
          chart={<Sparkline values={DAILY} />}
        />
      </CardContent>
    </Card>
  );
}
