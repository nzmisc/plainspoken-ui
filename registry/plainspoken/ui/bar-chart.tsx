"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { niceTicks, seriesStyle, type Texture } from "@/registry/plainspoken/lib/chart-scale";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { useElementWidth } from "@/registry/plainspoken/hooks/use-element-width";
import { ChartDataTable, type ChartDataTableMode } from "@/registry/plainspoken/ui/chart-data-table";
import { Legend, Swatch } from "@/registry/plainspoken/ui/legend";
import { cn } from "@/lib/utils";

export interface BarSeries {
  key: string;
  label: string;
  /** One value per category, in the same order; null where there is none */
  values: (number | null)[];
  /** CSS colour. Defaults to the chart token of the series' slot (var(--chart-1) for the first). */
  color?: string;
}

export interface BarChartProps {
  /** The groups along the category axis: months, products, regions */
  categories: string[];
  /** One series for a plain bar chart; several for grouped bars, side by side in each category */
  series: BarSeries[];
  /** What the chart shows, as its accessible name: "Orders per month, 2026" */
  label: string;
  /** A sentence saying what the chart means, read before the numbers. Without it a summary is written from the data. */
  summary?: string;
  /** vertical: columns rising from the bottom (the default; for time and short labels). horizontal: bars from the left, for long labels and rankings. */
  orientation?: "vertical" | "horizontal";
  /** Axis titles: "Orders" for the values, "Month" for the categories. The value title also heads the table's value columns when there is one series. */
  valueLabel?: ReactNode;
  categoryLabel?: string;
  /** Fixed value range. Otherwise from 0 to a round number above the data (and below it, for negative values). */
  valueDomain?: [number, number];
  valueTicks?: number[];
  /** Value axis tick labels */
  tickFormat?: (v: number) => string;
  /** Values at the bar ends, in the tooltip, table and summary. Defaults to tickFormat. */
  valueFormat?: (v: number) => string;
  /** Write each value at the end of its bar. Default: on for a single series, where it fits. */
  showValues?: boolean;
  /** Vertical charts: height of the plot plus the category axis, in px. Horizontal charts grow with the number of categories. */
  height?: number;
  /** The key under the chart. Default: on with two or more series. */
  legend?: boolean;
  /** Stripes and dots on every series but the first, as well as colours: for print and colour-blind readers. Off by default. */
  textured?: boolean;
  /** The numbers as a table: hidden for screen readers (default), under a "Data" disclosure, or none */
  dataTable?: ChartDataTableMode;
  /** Shown over an empty plot */
  empty?: ReactNode;
  className?: string;
}

const MAX_BAR = 24;
const GAP = 2;
const PATTERN: Record<Exclude<Texture, "solid">, ReactNode> = {
  hatch: <path d="M0,6 L6,0 M-1.5,1.5 L1.5,-1.5 M4.5,7.5 L7.5,4.5" strokeWidth={1.6} />,
  "hatch-reverse": <path d="M0,0 L6,6 M-1.5,4.5 L1.5,7.5 M4.5,-1.5 L7.5,1.5" strokeWidth={1.6} />,
  cross: <path d="M0,6 L6,0 M0,0 L6,6" strokeWidth={1.2} />,
  dots: <circle cx={3} cy={3} r={1.1} stroke="none" className="fill-background" />,
};

const defaultFormat = (v: number) => (Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
/** Rough text width at the chart's 11px tabular figures, for layout before anything is drawn */
const textW = (s: string, px = 6.4) => s.length * px;

/**
 * Bar chart in plain SVG: one series, or several grouped side by side in each category, as
 * columns (vertical) or bars (horizontal, for long labels). Bars are at most 24px thick, start at
 * zero and have a 2px gap between neighbours; a single series gets its values written at the bar
 * ends. Several series are told apart by colour, by their fixed order in every group (the legend
 * lists them in that order) and, with `textured`, by stripes and dots too.
 *
 * Hover, or tap, for a category's values. With the keyboard: Tab to the chart, then the arrow
 * keys step through the categories, Home and End go to the first and last, Escape hides the
 * tooltip; the values are read out as you go. Screen readers also get a summary and the data as a
 * table (`dataTable="details"` shows it to everyone). Draws after measuring its width, so nothing
 * is rendered on the server.
 */
export function BarChart({
  categories,
  series,
  label,
  summary,
  orientation = "vertical",
  valueLabel,
  categoryLabel,
  valueDomain,
  valueTicks,
  tickFormat = defaultFormat,
  valueFormat = tickFormat,
  showValues = series.length === 1,
  height = 200,
  legend = series.length > 1,
  textured = false,
  dataTable = "hidden",
  empty = "No data yet",
  className,
}: BarChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const summaryId = useId();
  const [active, setActive] = useState<number | null>(null);
  const horizontal = orientation === "horizontal";

  const styled = series.map((s, i) => {
    const slot = seriesStyle(i);
    return { ...s, color: s.color ?? slot.color, texture: textured ? slot.texture : ("solid" as Texture) };
  });
  const n = styled.length;
  const vals = styled.flatMap((s) => s.values.filter((v): v is number => v != null));
  const hasData = categories.length > 0 && vals.length > 0;
  const ticks = valueTicks ?? (valueDomain ? niceTicks(valueDomain[0], valueDomain[1], 4) : niceTicks(Math.min(0, ...vals), Math.max(0, ...vals, hasData ? 0 : 1), horizontal ? 5 : 4));
  const [v0, v1] = valueDomain ?? [ticks[0], ticks[ticks.length - 1]];
  const fill = (s: (typeof styled)[number]) => (s.texture === "solid" ? s.color : `url(#${uid}-${s.key})`);

  // Layout. Vertical: value axis on the left, categories along the bottom. Horizontal: category
  // labels on the left, value axis along the bottom, room on the right for the end values.
  const maxValueText = showValues ? Math.max(0, ...vals.map((v) => textW(valueFormat(v)))) : 0;
  const tickText = Math.max(...ticks.map((v) => textW(tickFormat(v))));
  let left: number, right: number, top: number, plotW: number, plotH: number, band: number, total: number;
  if (horizontal) {
    const barH = n === 1 ? 16 : 12;
    band = n * barH + (n - 1) * GAP + 10;
    top = 4;
    left = Math.min(Math.max(...categories.map((c) => textW(c, 7))) + 10, Math.max(80, width * 0.4));
    right = Math.max(12, tickText / 2 + 2, maxValueText + 8);
    plotW = Math.max(0, width - left - right);
    plotH = band * categories.length;
    total = top + plotH + 20;
  } else {
    top = showValues ? 16 : 8;
    left = tickText + 10;
    right = 8;
    plotW = Math.max(0, width - left - right);
    total = height;
    plotH = total - top - 20;
    band = plotW / Math.max(1, categories.length);
  }
  const sv = (v: number) => (horizontal ? left + ((v - v0) / (v1 - v0 || 1)) * plotW : top + plotH - ((v - v0) / (v1 - v0 || 1)) * plotH);
  const base = sv(Math.max(v0, Math.min(v1, 0)));
  const thick = horizontal ? (n === 1 ? 16 : 12) : Math.max(2, Math.min(MAX_BAR, (band * 0.72 - (n - 1) * GAP) / n));
  const group = n * thick + (n - 1) * GAP;
  const bandStart = (i: number) => (horizontal ? top : left) + i * band;
  // Vertical labels that don't fit their column are thinned out: every k-th one is shown.
  const every = horizontal ? 1 : Math.max(1, Math.ceil((Math.max(...categories.map((c) => textW(c, 6.8))) + 8) / Math.max(1, band)));
  const fits = (s: string) => (horizontal ? true : textW(s) <= band - 2);

  const fmtOr = (v: number | null) => (v == null ? "–" : valueFormat(v));
  const describe = (i: number) => `${categories[i]}: ${styled.map((s) => (n > 1 ? `${s.label} ${fmtOr(s.values[i] ?? null)}` : fmtOr(s.values[i] ?? null))).join(", ")}`;
  const autoSummary = () => {
    const parts = styled.map((s) => {
      const items = categories.flatMap((c, i) => (s.values[i] == null ? [] : [{ c, v: s.values[i]! }]));
      if (!items.length) return `${s.label}: no data`;
      const hi = items.reduce((a, b) => (b.v > a.v ? b : a));
      const lo = items.reduce((a, b) => (b.v < a.v ? b : a));
      return `${n > 1 ? `${s.label}: ` : ""}highest ${hi.c} (${valueFormat(hi.v)}), lowest ${lo.c} (${valueFormat(lo.v)})`;
    });
    return `${categories.length} ${categories.length === 1 ? "category" : "categories"}. ${parts.join(". ")}.`;
  };

  const onPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (!hasData) return;
    const r = e.currentTarget.getBoundingClientRect();
    const pos = horizontal ? e.clientY - r.top - top : e.clientX - r.left - left;
    const i = Math.floor(pos / band);
    setActive(i >= 0 && i < categories.length ? i : null);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!hasData) return;
    const last = categories.length - 1;
    const step: Record<string, (a: number | null) => number | null> = {
      ArrowRight: (a) => Math.min(last, (a ?? -1) + 1),
      ArrowDown: (a) => Math.min(last, (a ?? -1) + 1),
      ArrowLeft: (a) => Math.max(0, (a ?? last + 1) - 1),
      ArrowUp: (a) => Math.max(0, (a ?? last + 1) - 1),
      Home: () => 0,
      End: () => last,
      Escape: () => null,
    };
    const f = step[e.key];
    if (!f) return;
    e.preventDefault();
    setActive(f);
  };

  // Tooltip beside the active category, on the side with more room
  const tipStyle =
    active == null
      ? undefined
      : horizontal
        ? { top: bandStart(active) + band + 2, left: left + 4 }
        : bandStart(active) + band / 2 > width * 0.6
          ? { right: width - bandStart(active) + 4, top: 0 }
          : { left: bandStart(active) + band + 4, top: 0 };

  return (
    <figure data-slot="bar-chart" className={cn("m-0 flex min-w-0 flex-col gap-1", className)}>
      {valueLabel != null && !horizontal && <div className="text-[12px] text-muted-foreground">{valueLabel}</div>}
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
        onBlur={() => setActive(null)}
        className={cn("relative w-full touch-pan-y select-none", FOCUS_RING)}
        style={{ height: total }}
      >
        {width > 0 && (
          <svg width={width} height={total} aria-hidden className="block overflow-visible text-[11px]">
            {textured && (
              <defs>
                {styled
                  .filter((s) => s.texture !== "solid")
                  .map((s) => (
                    <pattern key={s.key} id={`${uid}-${s.key}`} width={6} height={6} patternUnits="userSpaceOnUse">
                      <rect width={6} height={6} fill={s.color} />
                      <g className="stroke-background">{PATTERN[s.texture as Exclude<Texture, "solid">]}</g>
                    </pattern>
                  ))}
              </defs>
            )}
            {active != null &&
              (horizontal ? (
                <rect x={0} y={bandStart(active)} width={width} height={band} className="fill-muted" />
              ) : (
                <rect x={bandStart(active)} y={top - 8} width={band} height={plotH + 8} className="fill-muted" />
              ))}
            {ticks.map((v) =>
              horizontal ? (
                <g key={v}>
                  <line x1={sv(v)} x2={sv(v)} y1={top} y2={top + plotH} className={v === 0 ? "stroke-border" : "stroke-border/60"} />
                  <text x={sv(v)} y={top + plotH + 14} textAnchor="middle" className="fill-muted-foreground tabular-nums">
                    {tickFormat(v)}
                  </text>
                </g>
              ) : (
                <g key={v}>
                  <line x1={left} x2={left + plotW} y1={sv(v)} y2={sv(v)} className={v === 0 ? "stroke-border" : "stroke-border/60"} />
                  <text x={left - 6} y={sv(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground tabular-nums">
                    {tickFormat(v)}
                  </text>
                </g>
              ),
            )}
            {categories.map((c, i) => {
              const start = bandStart(i) + (band - group) / 2;
              return (
                <g key={c + i}>
                  {styled.map((s, j) => {
                    const v = s.values[i];
                    if (v == null) return null;
                    const pos = start + j * (thick + GAP);
                    const end = sv(Math.max(v0, Math.min(v1, v)));
                    const lo = Math.min(base, end);
                    const len = Math.max(v === 0 ? 0 : 1, Math.abs(end - base));
                    const text = valueFormat(v);
                    return (
                      <g key={s.key}>
                        {horizontal ? (
                          <rect x={lo} y={pos} width={len} height={thick} fill={fill(s)} />
                        ) : (
                          <rect x={pos} y={lo} width={thick} height={len} fill={fill(s)} />
                        )}
                        {showValues &&
                          (horizontal ? (
                            <text x={v < 0 ? lo - 4 : lo + len + 4} y={pos + thick / 2} dy="0.32em" textAnchor={v < 0 ? "end" : "start"} className="fill-foreground tabular-nums">
                              {text}
                            </text>
                          ) : (
                            fits(text) && (
                              <text x={pos + thick / 2} y={v < 0 ? lo + len + 11 : lo - 4} textAnchor="middle" className="fill-foreground tabular-nums">
                                {text}
                              </text>
                            )
                          ))}
                      </g>
                    );
                  })}
                  {horizontal ? (
                    <text x={left - 8} y={bandStart(i) + band / 2} dy="0.32em" textAnchor="end" className="fill-foreground text-[12px]">
                      {truncate(c, left - 10)}
                      <title>{c}</title>
                    </text>
                  ) : (
                    i % every === 0 && (
                      <text x={bandStart(i) + band / 2} y={top + plotH + 14} textAnchor="middle" className="fill-muted-foreground">
                        {c}
                      </text>
                    )
                  )}
                </g>
              );
            })}
            {horizontal ? (
              <line x1={base} x2={base} y1={top} y2={top + plotH} className="stroke-foreground/50" />
            ) : (
              <line x1={left} x2={left + plotW} y1={base} y2={base} className="stroke-foreground/50" />
            )}
          </svg>
        )}
        {width > 0 && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-[13px] text-muted-foreground" style={{ left }}>
            {empty}
          </div>
        )}
        {active != null && tipStyle && (
          <div aria-hidden className="pointer-events-none absolute z-10 border border-border bg-background px-1.5 py-0.5 text-[12px] whitespace-nowrap shadow-sm" style={tipStyle}>
            <div className="font-medium">{categories[active]}</div>
            {styled.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <Swatch color={s.color} texture={s.texture} />
                {s.label}
                <b className="ml-auto pl-3 tabular-nums">{fmtOr(s.values[active] ?? null)}</b>
              </div>
            ))}
          </div>
        )}
        {width > 0 && (
          <>
            <p id={summaryId} className="sr-only">
              {summary ?? (hasData ? autoSummary() : `${label}: no data.`)}
            </p>
            <p className="sr-only" aria-live="polite">
              {active != null ? describe(active) : ""}
            </p>
          </>
        )}
      </div>
      {(categoryLabel != null || (valueLabel != null && horizontal)) && (
        <div className="text-center text-[12px] text-muted-foreground">{horizontal ? valueLabel : categoryLabel}</div>
      )}
      {legend && <Legend shape="square" items={styled.map((s) => ({ key: s.key, label: s.label, color: s.color, texture: s.texture }))} />}
      {width > 0 && hasData && (
        <ChartDataTable
          mode={dataTable}
          caption={label}
          columns={[categoryLabel ?? "Category", ...styled.map((s) => (n === 1 && typeof valueLabel === "string" ? valueLabel : s.label))]}
          rows={categories.map((c, i) => ({ key: c + i, cells: [c, ...styled.map((s) => fmtOr(s.values[i] ?? null))] }))}
        />
      )}
    </figure>
  );
}

/** Cuts a label to about `px` wide with an ellipsis; the full text stays in the SVG title. */
function truncate(s: string, px: number): string {
  const max = Math.max(3, Math.floor(px / 7));
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
