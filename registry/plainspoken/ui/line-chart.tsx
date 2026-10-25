"use client";

import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { markerPath, nearestIndex, niceTicks, seriesStyle, timeTickLabel, timeTicks, type MarkerShape } from "@/registry/plainspoken/lib/chart-scale";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { useElementWidth } from "@/registry/plainspoken/hooks/use-element-width";
import { ChartDataTable, type ChartDataTableMode } from "@/registry/plainspoken/ui/chart-data-table";
import { Legend, Swatch } from "@/registry/plainspoken/ui/legend";
import { cn } from "@/lib/utils";

export interface LinePoint {
  /** Time, epoch milliseconds */
  t: number;
  /** null for a missing sample: the line breaks there */
  v: number | null;
}

export interface LineSeries {
  key: string;
  label: string;
  /** Sorted by t */
  points: LinePoint[];
  /** CSS colour. Defaults to the chart token of the series' slot (var(--chart-1) for the first). */
  color?: string;
  /** SVG dash pattern ("6 3"), or false for a solid line. Defaults to the slot's pattern (the first is solid). */
  dash?: string | false;
  /** Marker shape at the line's end, on hover and on sparse points. Defaults to the slot's. */
  marker?: MarkerShape;
}

export interface LineChartProps {
  series: LineSeries[];
  /** What the chart shows, as its accessible name: "Sign-ups per day, October" */
  label: string;
  /** A sentence saying what the chart means, read before the numbers. Without it a summary is written from the data. */
  summary?: string;
  /** Visible window [start, end] in ms. Defaults to the first and last sample. */
  xDomain?: [number, number];
  /** Fixed value range. Otherwise from 0 (see includeZero) to a round number above the data. */
  yDomain?: [number, number];
  yTicks?: number[];
  /** Start the value axis at zero even when every value is far above it. Default true. */
  includeZero?: boolean;
  /** Value axis tick labels */
  yFormat?: (v: number) => string;
  /** Values in the tooltip, table and summary. Defaults to yFormat. */
  valueFormat?: (v: number) => string;
  /** Times in the tooltip, table and summary. Defaults to a date, a time, or both, from the sample spacing. */
  timeFormat?: (t: number) => string;
  /** Axis titles, shown above the value axis and under the time axis: "Requests per second", "Time (UTC)" */
  yLabel?: ReactNode;
  xLabel?: ReactNode;
  /** Height of the plot plus the time axis, in px */
  height?: number;
  /** Samples farther apart than this are not joined (missing data) */
  gapMs?: number;
  /** Markers on every sample ("all"), only at each line's end ("end"), or none. Default: all when there are 24 or fewer samples. */
  markers?: "all" | "end" | "none";
  /** The key under the chart. Default: on with two or more series. "latest" adds each series' last value. */
  legend?: boolean | "latest";
  /** The numbers as a table: hidden for screen readers (default), under a "Data" disclosure, or none */
  dataTable?: ChartDataTableMode;
  /** BCP 47 locale for times; the browser's by default */
  locale?: string;
  /** Shown over an empty plot */
  empty?: ReactNode;
  className?: string;
}

const M = { top: 8, right: 12, bottom: 20 };
const DAY = 86_400_000;

const defaultFormat = (v: number) => (Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));

/**
 * A time-series line chart in plain SVG, for one measure over time (one value axis only: measures
 * with different units go in separate charts). Each series has its own colour, line pattern and
 * marker, and the legend repeats all three, so series can be told apart without colour.
 *
 * Hover, or drag on a touch screen, for a crosshair with every series' value at that time. With
 * the keyboard: Tab to the chart, then Left and Right step through the samples, Home and End go
 * to the first and last, Escape hides the crosshair; the values are read out as you go. Screen
 * readers also get a summary and the full data as a table (`dataTable="details"` shows it to
 * everyone).
 *
 * The chart draws after measuring its width, so it renders nothing on the server and its time
 * labels always use the viewer's time zone.
 */
export function LineChart({
  series,
  label,
  summary,
  xDomain,
  yDomain,
  yTicks: yTicksProp,
  includeZero = true,
  yFormat = defaultFormat,
  valueFormat = yFormat,
  timeFormat,
  yLabel,
  xLabel,
  height = 180,
  gapMs = Number.POSITIVE_INFINITY,
  markers,
  legend = series.length > 1,
  dataTable = "hidden",
  locale,
  empty = "No data yet",
  className,
}: LineChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const summaryId = useId();
  const [active, setActive] = useState<number | null>(null);

  const styled = useMemo(
    () =>
      series.map((s, i) => {
        const slot = seriesStyle(i);
        return {
          ...s,
          color: s.color ?? slot.color,
          dash: s.dash === false ? undefined : (s.dash ?? (series.length > 1 ? slot.dash : undefined)),
          marker: s.marker ?? slot.marker,
        };
      }),
    [series],
  );

  const all = styled.flatMap((s) => s.points.filter((p) => p.v != null)) as { t: number; v: number }[];
  const [x0, x1] = xDomain ?? (all.length ? [Math.min(...all.map((p) => p.t)), Math.max(...all.map((p) => p.t))] : [0, 1]);
  const span = x1 - x0 || 1;
  const visible = useMemo(
    () => styled.map((s) => ({ ...s, points: s.points.filter((p) => p.t >= x0 - (Number.isFinite(gapMs) ? gapMs : 0) && p.t <= x1) })),
    [styled, x0, x1, gapMs],
  );
  // Every time with at least one value, for the crosshair and the table.
  const times = useMemo(
    () => [...new Set(visible.flatMap((s) => s.points.filter((p) => p.v != null && p.t >= x0).map((p) => p.t)))].sort((a, b) => a - b),
    [visible, x0],
  );
  const hasData = times.length > 0;

  const yTicks = useMemo(() => {
    if (yTicksProp) return yTicksProp;
    if (yDomain) return niceTicks(yDomain[0], yDomain[1], 4);
    const vals = visible.flatMap((s) => s.points.flatMap((p) => (p.v == null ? [] : [p.v])));
    if (!vals.length) return niceTicks(0, 1, 4);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return niceTicks(includeZero ? Math.min(0, lo) : lo, includeZero ? Math.max(0, hi) : hi, 4);
  }, [yTicksProp, yDomain, visible, includeZero]);
  const [y0, y1] = yDomain ?? [yTicks[0], yTicks[yTicks.length - 1]];

  // Smallest gap between samples decides how times are written.
  const spacing = useMemo(() => {
    let min = Infinity;
    for (let i = 1; i < times.length; i++) min = Math.min(min, times[i] - times[i - 1]);
    return min;
  }, [times]);
  const fmtTime =
    timeFormat ??
    ((t: number) => {
      const d = new Date(t);
      if (spacing >= DAY) return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
      const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: spacing < 60_000 ? "2-digit" : undefined, hourCycle: "h23" });
      return span <= DAY ? time : `${d.toLocaleDateString(locale, { month: "short", day: "numeric" })}, ${time}`;
    });

  const left = Math.max(...yTicks.map((v) => yFormat(v).length)) * 6.6 + 10;
  const plotW = Math.max(0, width - left - M.right);
  const plotH = height - M.top - M.bottom;
  const sx = (t: number) => left + ((t - x0) / span) * plotW;
  const sy = (v: number) => M.top + plotH - ((v - y0) / (y1 - y0 || 1)) * plotH;
  const { ticks: xTicks, step } = timeTicks(x0, x1, Math.max(1, Math.floor(plotW / 72)));
  const markerMode = markers ?? (times.length <= 24 ? "all" : "end");

  const paths = visible.map((s) => {
    let d = "";
    const singles: { t: number; v: number }[] = [];
    let prev: LinePoint | null = null;
    s.points.forEach((p, i) => {
      if (p.v == null) {
        prev = null;
        return;
      }
      const joined = prev != null && p.t - prev.t <= gapMs;
      d += `${joined ? "L" : "M"}${sx(p.t).toFixed(1)},${sy(p.v).toFixed(1)}`;
      const next = s.points[i + 1];
      if (!joined && (!next || next.v == null || next.t - p.t > gapMs)) singles.push({ t: p.t, v: p.v });
      prev = p;
    });
    const last = [...s.points].reverse().find((p) => p.v != null) as { t: number; v: number } | undefined;
    return { s, d, singles, last };
  });

  // The values at the active time: each series' sample at exactly that time, or the nearest one
  // within the gap tolerance (series sampled on slightly different clocks).
  const valuesAt = (t: number) => {
    const tol = Number.isFinite(gapMs) ? gapMs / 2 : span / 50;
    return visible.flatMap((s) => {
      if (!s.points.length) return [];
      const p = s.points[nearestIndex(s.points, t)];
      return p.v != null && Math.abs(p.t - t) <= tol ? [{ s, p: p as { t: number; v: number } }] : [];
    });
  };
  const at = active != null && hasData ? times[Math.min(active, times.length - 1)] : null;
  const rows = at != null ? valuesAt(at) : [];
  const describeAt = (t: number) => {
    const vs = valuesAt(t);
    return `${fmtTime(t)}: ${vs.length ? vs.map(({ s, p }) => `${s.label} ${valueFormat(p.v)}`).join(", ") : "no values"}`;
  };

  const onPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (!hasData) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (x < left - 8 || x > left + plotW + 8) return setActive(null);
    const t = x0 + ((x - left) / (plotW || 1)) * span;
    setActive(nearestIndex(times.map((tt) => ({ t: tt })), t));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!hasData) return;
    const n = times.length;
    const next: Record<string, (a: number | null) => number | null> = {
      ArrowRight: (a) => Math.min(n - 1, (a ?? -1) + 1),
      ArrowLeft: (a) => Math.max(0, (a ?? n) - 1),
      Home: () => 0,
      End: () => n - 1,
      Escape: () => null,
    };
    const f = next[e.key];
    if (!f) return;
    e.preventDefault();
    setActive(f);
  };

  const hx = at != null ? sx(at) : 0;
  const autoSummary = () => {
    if (!hasData) return `${label}: no data.`;
    const parts = visible.map((s) => {
      const vs = s.points.filter((p) => p.v != null && p.t >= x0) as { t: number; v: number }[];
      if (!vs.length) return `${s.label}: no data`;
      const hi = vs.reduce((a, b) => (b.v > a.v ? b : a));
      const lo = vs.reduce((a, b) => (b.v < a.v ? b : a));
      return `${s.label} from ${valueFormat(vs[0].v)} to ${valueFormat(vs[vs.length - 1].v)}, highest ${valueFormat(hi.v)} (${fmtTime(hi.t)}), lowest ${valueFormat(lo.v)} (${fmtTime(lo.t)})`;
    });
    return `${fmtTime(times[0])} to ${fmtTime(times[times.length - 1])}. ${parts.join(". ")}.`;
  };

  return (
    <figure data-slot="line-chart" className={cn("m-0 flex min-w-0 flex-col gap-1", className)}>
      {yLabel != null && <div className="text-[12px] text-muted-foreground">{yLabel}</div>}
      <div
        ref={ref}
        role="group"
        aria-label={label}
        aria-describedby={width > 0 ? summaryId : undefined}
        tabIndex={hasData ? 0 : undefined}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        onKeyDown={onKeyDown}
        onFocus={(e) => e.target === e.currentTarget && e.currentTarget.matches(":focus-visible") && active == null && setActive(times.length - 1)}
        onBlur={() => setActive(null)}
        className={cn("relative w-full touch-pan-y select-none", FOCUS_RING)}
        style={{ height }}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible text-[11px]">
            <defs>
              <clipPath id={clipId}>
                <rect x={left - 6} y={0} width={plotW + M.right + 6} height={height - M.bottom + 6} />
              </clipPath>
            </defs>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={left} x2={left + plotW} y1={sy(v)} y2={sy(v)} className={v === 0 ? "stroke-border" : "stroke-border/60"} />
                <text x={left - 6} y={sy(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground tabular-nums">
                  {yFormat(v)}
                </text>
              </g>
            ))}
            <line x1={left} x2={left + plotW} y1={M.top + plotH} y2={M.top + plotH} className="stroke-border" />
            {xTicks.map((t) => (
              <g key={t}>
                <line x1={sx(t)} x2={sx(t)} y1={M.top + plotH} y2={M.top + plotH + 4} className="stroke-border" />
                <text x={sx(t)} y={height - 4} textAnchor="middle" className="fill-muted-foreground tabular-nums">
                  {timeTickLabel(t, step, locale)}
                </text>
              </g>
            ))}
            <g clipPath={`url(#${clipId})`}>
              {paths.map(({ s, d }) => (
                <path
                  key={s.key}
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap={s.dash ? "butt" : "round"}
                  strokeDasharray={s.dash}
                />
              ))}
              {paths.map(({ s, singles }) => {
                const pts =
                  markerMode === "all" ? (s.points.filter((p) => p.v != null && p.t >= x0) as { t: number; v: number }[]) : markerMode === "end" ? singles : [];
                return pts.map((p) => (
                  <path key={`${s.key}-${p.t}`} d={markerPath(s.marker, sx(p.t), sy(p.v), 3)} fill={s.color} className="stroke-background" strokeWidth={1.5} />
                ));
              })}
              {at == null &&
                markerMode !== "none" &&
                paths.map(({ s, last }) =>
                  last ? <path key={s.key} d={markerPath(s.marker, sx(last.t), sy(last.v), 4)} fill={s.color} className="stroke-background" strokeWidth={2} /> : null,
                )}
            </g>
            {at != null && (
              <g pointerEvents="none">
                <line x1={hx} x2={hx} y1={M.top} y2={M.top + plotH} className="stroke-muted-foreground" />
                {rows.map(({ s, p }) => (
                  <path key={s.key} d={markerPath(s.marker, sx(p.t), sy(p.v), 4.5)} fill={s.color} className="stroke-background" strokeWidth={2} />
                ))}
              </g>
            )}
          </svg>
        )}
        {width > 0 && !hasData && (
          <div className="absolute inset-y-0 right-0 flex items-center justify-center text-[13px] text-muted-foreground" style={{ left, bottom: M.bottom }}>
            {empty}
          </div>
        )}
        {at != null && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 z-10 border border-border bg-background px-1.5 py-0.5 text-[12px] whitespace-nowrap shadow-sm"
            style={hx > width * 0.6 ? { right: width - hx + 10 } : { left: hx + 10 }}
          >
            <div className="text-muted-foreground tabular-nums">{fmtTime(at)}</div>
            {rows.map(({ s, p }) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <Swatch color={s.color} shape="line" dash={s.dash} marker={s.marker} />
                {s.label}
                <b className="ml-auto pl-3 tabular-nums">{valueFormat(p.v)}</b>
              </div>
            ))}
          </div>
        )}
        {width > 0 && (
          <>
            <p id={summaryId} className="sr-only">
              {summary ?? autoSummary()}
            </p>
            <p className="sr-only" aria-live="polite">
              {at != null ? describeAt(at) : ""}
            </p>
          </>
        )}
      </div>
      {xLabel != null && <div className="text-center text-[12px] text-muted-foreground">{xLabel}</div>}
      {legend && (
        <Legend
          items={styled.map((s) => {
            const last = [...s.points].reverse().find((p) => p.v != null);
            return {
              key: s.key,
              label: s.label,
              color: s.color,
              dash: s.dash,
              marker: s.marker,
              // Values wait for the measured width like the rest, so the server never formats a number
              value: legend === "latest" && width > 0 && last?.v != null ? valueFormat(last.v) : undefined,
            };
          })}
        />
      )}
      {width > 0 && hasData && (
        <ChartDataTable
          mode={dataTable}
          caption={label}
          columns={["Time", ...styled.map((s) => s.label)]}
          rows={times.map((t) => {
            const byKey = new Map(valuesAt(t).map(({ s, p }) => [s.key, p.v]));
            return { key: String(t), cells: [fmtTime(t), ...styled.map((s) => (byKey.has(s.key) ? valueFormat(byKey.get(s.key)!) : "–"))] };
          })}
        />
      )}
    </figure>
  );
}
