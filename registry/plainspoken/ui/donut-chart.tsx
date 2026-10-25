import type { ReactNode } from "react";
import { CHART_COLORS } from "@/registry/plainspoken/lib/chart-scale";
import { Legend } from "@/registry/plainspoken/ui/legend";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  /** CSS colour. Defaults to the chart token of the segment's slot; use "var(--accent)" for an "empty" or "left" part. */
  color?: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** What the ring shows, as its accessible name: "Invoices by status" (the parts and their shares are added to it) */
  label: string;
  /** Outer diameter in px */
  size?: number;
  /** Width of the ring in px */
  thickness?: number;
  /** Values in the legend and the accessible summary */
  format?: (v: number) => string;
  /** The key beside the ring, with each part's value and share. Default: on for three or more parts. */
  legend?: boolean;
  /** Text in the hole: the one number that matters, e.g. "62%" over "used". Hidden from screen readers, which get the summary. */
  children?: ReactNode;
  className?: string;
}

/**
 * How far each part runs on under the next, in px along the ring. Parts meet edge to edge with no
 * gap; without the overlap, anti-aliasing would leave a hairline of background at every seam.
 */
const OVERLAP = 0.75;

/**
 * A ring split into parts of a whole, edge to edge, drawn clockwise from 12 o'clock in segment order. For a
 * share at a glance (a quota used, invoices by status) with at most about six parts; to compare
 * close values use a bar chart. With three or more parts the legend writes out each part's value
 * and share for everyone, so no part is told by colour alone; without the legend, screen readers
 * get the same in the ring's accessible name.
 * No state or effects: it renders on the server.
 */
export function DonutChart({ segments, label, size = 96, thickness = 14, format = String, legend = segments.length > 2, children, className }: DonutChartProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const parts = segments.map((s, i) => ({ ...s, color: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }));
  const total = parts.reduce((a, s) => a + Math.max(0, s.value), 0);
  const drawn = parts.filter((s) => s.value > 0);
  const overlap = drawn.length > 1 ? OVERLAP : 0;
  const share = (v: number) => {
    if (!total) return "–";
    const pct = (Math.max(0, v) / total) * 100;
    return pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;
  };
  const summary = total ? parts.map((s) => `${s.label} ${format(s.value)} (${share(s.value)})`).join(", ") : "no data";
  let offset = 0;
  return (
    <figure data-slot="donut-chart" className={cn("m-0 flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <div role="img" aria-label={legend ? label : `${label}: ${summary}`} className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden className="block -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={thickness} opacity={total ? 0 : 1} />
          {total > 0 &&
            drawn
              .map((s) => {
                const len = (s.value / total) * c;
                const el = (
                  <circle
                    key={s.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={thickness}
                    // A tiny part still shows as a sliver, over the start of the next part
                    strokeDasharray={`${Math.max(1.5, len) + overlap} ${c}`}
                    strokeDashoffset={-offset}
                  >
                    <title>{`${s.label}: ${format(s.value)} (${share(s.value)})`}</title>
                  </circle>
                );
                offset += len;
                return el;
              })
              // Drawn last part first, so each part lies over the one after it
              .reverse()}
        </svg>
        {children != null && (
          <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
            {children}
          </div>
        )}
      </div>
      {legend && (
        <Legend
          stacked
          shape="square"
          items={parts.map((s) => ({
            key: s.key,
            label: s.label,
            color: s.color,
            value: (
              <>
                {format(s.value)} <span className="font-normal text-muted-foreground">{share(s.value)}</span>
              </>
            ),
          }))}
        />
      )}
    </figure>
  );
}
