import { cn } from "@/lib/utils";

export interface SparklineProps {
  /** Evenly spaced values, oldest first; null for a gap */
  values: (number | null)[];
  /** What it is, the start of its accessible name: "Requests per minute, last hour" (the numbers are added) */
  label: string;
  /** Replaces the summary of the numbers written from the data, e.g. "up 12% on last week" */
  summary?: string;
  /** line, or bar for counts per period (one bar per value) */
  type?: "line" | "bar";
  /** In px. Fixed sizes keep a column of sparklines comparable. */
  width?: number;
  height?: number;
  /** CSS colour of the line or bars. Default the first chart colour. */
  color?: string;
  /** A light wash under the line */
  area?: boolean;
  /** Value range. Default: the data's range for a line, 0 to the highest value for bars. */
  domain?: [number, number];
  /** Values in the accessible summary. Default: plain numbers, the same on the server and in the browser. */
  format?: (v: number) => string;
  className?: string;
}

const plain = (v: number) => String(Math.round(v * 100) / 100);

/**
 * A word-sized chart for a stat or a table cell: the shape of a series, no axes. Its accessible
 * name says what it is and the numbers that matter (first, last, low, high), so it means the same
 * read aloud. A line ends in a dot on the latest value; bars draw the latest period in full colour
 * and the rest lighter. No state or effects: it renders on the server.
 */
export function Sparkline({
  values,
  label,
  summary,
  type = "line",
  width = 80,
  height = 20,
  color = "var(--chart-1)",
  area = false,
  domain,
  format = plain,
  className,
}: SparklineProps) {
  const real = values.filter((v): v is number => v != null);
  const lo = domain?.[0] ?? (type === "bar" ? Math.min(0, ...real) : Math.min(...real));
  const hi = domain?.[1] ?? Math.max(type === "bar" ? 0 : -Infinity, ...real);
  const pad = type === "line" ? 2.5 : 0; // room for the end dot
  const y = (v: number) => pad + (height - 2 * pad) * (1 - (v - lo) / (hi - lo || 1));
  const n = values.length;
  const last = real.at(-1);
  const name = real.length
    ? `${label}: ${summary ?? `${type === "bar" ? "latest" : `from ${format(real[0])} to`} ${format(last!)}, low ${format(Math.min(...real))}, high ${format(Math.max(...real))}`}`
    : `${label}: no data`;

  let body = null;
  if (real.length && type === "line") {
    const x = (i: number) => pad + (n > 1 ? (i / (n - 1)) * (width - 2 * pad) : (width - 2 * pad) / 2);
    let d = "";
    let fillD = "";
    let runStart = -1;
    values.forEach((v, i) => {
      if (v == null) {
        if (runStart >= 0) fillD += `L${x(i - 1).toFixed(1)},${height}L${x(runStart).toFixed(1)},${height}Z`;
        runStart = -1;
        return;
      }
      const pt = `${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      d += `${runStart < 0 ? "M" : "L"}${pt}`;
      fillD += `${runStart < 0 ? "M" : "L"}${pt}`;
      if (runStart < 0) runStart = i;
    });
    if (runStart >= 0) fillD += `L${x(n - 1).toFixed(1)},${height}L${x(runStart).toFixed(1)},${height}Z`;
    const li = values.findLastIndex((v) => v != null);
    body = (
      <>
        {area && <path d={fillD} fill={color} opacity={0.12} />}
        <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(li)} cy={y(last!)} r={2.25} fill={color} />
      </>
    );
  } else if (real.length) {
    // Whole pixels only: bars at fractional positions blur by different amounts, so the gaps
    // between them look uneven. Any width left over goes equally either side.
    const slot = width / n;
    const gap = n > 1 ? (slot >= 6 ? 2 : slot >= 3 ? 1 : 0) : 0;
    const bar = Math.max(1, Math.floor((width - gap * (n - 1)) / n));
    const left = Math.floor((width - (bar * n + gap * (n - 1))) / 2);
    const base = Math.round(y(Math.max(lo, Math.min(hi, 0))));
    body = values.map((v, i) => {
      if (v == null) return null;
      const top = Math.round(y(v));
      return (
        <rect
          key={i}
          x={left + i * (bar + gap)}
          y={Math.min(top, base)}
          width={bar}
          height={Math.max(1, Math.abs(base - top))}
          fill={color}
          opacity={i === n - 1 ? 1 : 0.45}
          shapeRendering="crispEdges"
        />
      );
    });
  }

  return (
    <svg
      data-slot="sparkline"
      role="img"
      aria-label={name}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block shrink-0 overflow-visible align-middle", className)}
    >
      <title>{name}</title>
      {body}
    </svg>
  );
}
