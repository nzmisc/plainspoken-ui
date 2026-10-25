import { Sparkline } from "@/registry/plainspoken/ui/sparkline";

const SERVICES = [
  { name: "api", rpm: [820, 860, 910, 870, 940, 1010, 980, 1050, 1120, 1080, 1150, 1210], errors: [2, 1, 0, 3, 1, 0, 0, 2, 1, 0, 1, 0] },
  { name: "web", rpm: [450, 470, 440, 480, 500, 490, 520, 510, 530, 560, 540, 575], errors: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0] },
  { name: "worker", rpm: [120, 118, 130, 210, 340, 300, 180, 150, 140, 135, 128, 131], errors: [0, 0, 0, 4, 9, 6, 1, 0, 0, 0, 0, 0] },
  { name: "search", rpm: [300, 310, null, null, 290, 305, 320, 315, 330, 325, 340, 352], errors: [1, 0, 0, 0, 2, 1, 0, 0, 0, 1, 0, 0] },
];

const td = "border border-border px-2 py-0.5";
const th = "border border-border bg-muted px-2 py-0.5 text-left font-medium";

/** In table cells at a fixed size, so the rows compare. Bars suit counts per period; a gap in the line is missing data. */
export default function SparklineTable() {
  return (
    <table className="border-collapse text-[14px]">
      <thead>
        <tr>
          <th className={th}>Service</th>
          <th className={th}>Requests per minute, last hour</th>
          <th className={th}>Now</th>
          <th className={th}>Errors per 5 minutes</th>
        </tr>
      </thead>
      <tbody>
        {SERVICES.map((s) => (
          <tr key={s.name}>
            <td className={td}>
              <code className="font-mono text-[13px]">{s.name}</code>
            </td>
            <td className={td}>
              <Sparkline values={s.rpm} label={`${s.name} requests per minute`} />
            </td>
            <td className={`${td} text-right tabular-nums`}>{s.rpm.at(-1)?.toLocaleString("en-US")}</td>
            <td className={td}>
              <Sparkline type="bar" values={s.errors} label={`${s.name} errors per 5 minutes`} color="var(--chart-2)" width={72} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
