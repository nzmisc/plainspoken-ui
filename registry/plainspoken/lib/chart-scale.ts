// Scales, ticks and series styles shared by the SVG charts (line-chart, bar-chart, sparkline,
// donut-chart, legend). Plain functions, no React.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const TIME_STEPS = [MIN, 2 * MIN, 5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN, HOUR, 2 * HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, DAY, 2 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];

/**
 * Tick times between x0 and x1 (epoch ms), at most about `maxTicks` of them, aligned to the
 * viewer's wall clock (whole minutes, hours, midnights). Uses the browser's time zone, so call it
 * in the browser (the charts only draw after they have measured their width, which is client-side).
 */
export function timeTicks(x0: number, x1: number, maxTicks: number): { ticks: number[]; step: number } {
  const span = x1 - x0;
  const step = TIME_STEPS.find((s) => span / s <= Math.max(1, maxTicks)) ?? TIME_STEPS[TIME_STEPS.length - 1];
  const ticks: number[] = [];
  if (step >= DAY) {
    // Whole days (and weeks, months) from local midnight, so daylight-saving changes can't shift them.
    const days = Math.round(step / DAY);
    const d = new Date(x0);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < x0) d.setDate(d.getDate() + 1);
    for (; d.getTime() <= x1; d.setDate(d.getDate() + days)) ticks.push(d.getTime());
    return { ticks, step };
  }
  const offset = -new Date(x0).getTimezoneOffset() * MIN; // local = utc + offset
  for (let t = Math.ceil((x0 + offset) / step) * step - offset; t <= x1; t += step) ticks.push(t);
  return { ticks, step };
}

/** A time tick's label: "14:30" within a day, "Oct 19" for day steps and at midnight. */
export function timeTickLabel(t: number, step: number, locale?: string): string {
  const d = new Date(t);
  const midnight = d.getHours() === 0 && d.getMinutes() === 0;
  if (step >= DAY || (midnight && step >= HOUR)) return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** Round-number ticks covering [min, max]: about `count` steps of 1, 2, 2.5 or 5 times a power of ten. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v / step) * step);
  return out;
}

/** Index of the item in a t-sorted array closest to t (binary search). */
export function nearestIndex(points: { t: number }[], t: number): number {
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(points[lo - 1].t - t) <= Math.abs(points[lo].t - t)) return lo - 1;
  return lo;
}

/** Short numbers for axis ticks: 950, 1.2K, 34K, 1.5M. */
export function compactNumber(v: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

// ---------------------------------------------------------------------------------------------
// Series styles. Colour is never the only thing telling series apart: each slot also has its own
// line pattern and marker, and the legend shows both.

/** The five chart colours from the theme, in their fixed order (a series keeps its slot). */
export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;

/** Line patterns by slot, as SVG stroke-dasharray values: solid, dashed, dotted, dash-dot, long dash. */
export const CHART_DASHES = [undefined, "6 3", "1.5 3", "8 3 1.5 3", "12 4"] as const;

export type MarkerShape = "circle" | "square" | "triangle" | "diamond" | "cross";

/** Marker shapes by slot */
export const CHART_MARKERS: readonly MarkerShape[] = ["circle", "square", "triangle", "diamond", "cross"];

/** Fill textures for bars, an opt-in second channel next to colour (print, colour blindness) */
export type Texture = "solid" | "hatch" | "hatch-reverse" | "cross" | "dots";

/** Textures by slot: the first series stays solid */
export const CHART_TEXTURES: readonly Texture[] = ["solid", "hatch", "hatch-reverse", "cross", "dots"];

export interface SeriesStyle {
  color: string;
  dash?: string;
  marker: MarkerShape;
  texture: Texture;
}

/** The look of the series in slot i (0-based); slots past five reuse colours with a new pattern. */
export function seriesStyle(i: number): SeriesStyle {
  return {
    color: CHART_COLORS[i % CHART_COLORS.length],
    dash: CHART_DASHES[i % CHART_DASHES.length],
    marker: CHART_MARKERS[(i + Math.floor(i / CHART_COLORS.length)) % CHART_MARKERS.length],
    texture: CHART_TEXTURES[i % CHART_TEXTURES.length],
  };
}

/**
 * An SVG path for a marker centred on (x, y), about 2r across. Filled shapes have roughly the same
 * area, so no series looks heavier than another; the cross is drawn as a filled plus.
 */
export function markerPath(shape: MarkerShape, x: number, y: number, r: number): string {
  const f = (n: number) => n.toFixed(2);
  switch (shape) {
    case "circle":
      return `M${f(x - r)},${f(y)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;
    case "square": {
      const s = r * 0.89;
      return `M${f(x - s)},${f(y - s)}h${f(2 * s)}v${f(2 * s)}h${f(-2 * s)}Z`;
    }
    case "triangle": {
      const s = r * 1.25;
      return `M${f(x)},${f(y - s)}L${f(x + s * 0.94)},${f(y + s * 0.62)}L${f(x - s * 0.94)},${f(y + s * 0.62)}Z`;
    }
    case "diamond": {
      const s = r * 1.22;
      return `M${f(x)},${f(y - s)}L${f(x + s)},${f(y)}L${f(x)},${f(y + s)}L${f(x - s)},${f(y)}Z`;
    }
    case "cross": {
      const a = r * 1.15;
      const b = r * 0.4;
      return `M${f(x - b)},${f(y - a)}h${f(2 * b)}v${f(a - b)}h${f(a - b)}v${f(2 * b)}h${f(b - a)}v${f(a - b)}h${f(-2 * b)}v${f(b - a)}h${f(b - a)}v${f(-2 * b)}h${f(a - b)}Z`;
    }
  }
}

/**
 * A texture as a CSS background over the series colour, for swatches. The stripes and dots are
 * the page background, so they read as gaps in the colour in light and dark mode alike.
 */
export function textureBackground(texture: Texture, color: string): string {
  const bg = "var(--background)";
  switch (texture) {
    case "solid":
      return color;
    case "hatch":
      return `repeating-linear-gradient(45deg, ${color} 0 2.5px, ${bg} 2.5px 4px)`;
    case "hatch-reverse":
      return `repeating-linear-gradient(-45deg, ${color} 0 2.5px, ${bg} 2.5px 4px)`;
    case "cross":
      return `repeating-linear-gradient(45deg, transparent 0 2.5px, ${bg} 2.5px 3.5px), repeating-linear-gradient(-45deg, ${color} 0 2.5px, ${bg} 2.5px 3.5px)`;
    case "dots":
      return `radial-gradient(circle, ${bg} 0 0.9px, transparent 1.1px) 0 0 / 4px 4px, ${color}`;
  }
}
