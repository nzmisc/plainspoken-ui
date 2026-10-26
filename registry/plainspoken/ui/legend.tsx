import type { HTMLAttributes, ReactNode } from "react";
import { markerPath, textureBackground, type MarkerShape, type Texture } from "@/registry/plainspoken/lib/chart-scale";
import { cn } from "@/lib/utils";

export interface SwatchProps {
  /** Any CSS colour, usually a chart token: "var(--chart-1)" */
  color: string;
  /**
   * square: a filled square, for bars, donut segments and calendar events. line: a short stroke,
   * for line-chart series, drawn with the series' dash pattern and marker so the key matches the
   * chart even without colour.
   */
  shape?: "square" | "line";
  /** SVG stroke-dasharray of the series' line ("6 3"); line swatches only */
  dash?: string;
  /** The series' marker, drawn in the middle of a line swatch */
  marker?: MarkerShape;
  /** The bar texture of a textured bar chart; square swatches only */
  texture?: Texture;
  className?: string;
}

/**
 * The key that ties a label to a chart mark. Decorative (aria-hidden): the label next to it says
 * the same thing in words, and labels stay in the text colour (never the series colour), so they
 * are readable whatever the chart colours are.
 */
export function Swatch({ color, shape = "square", dash, marker, texture = "solid", className }: SwatchProps) {
  if (shape === "square")
    return (
      <span
        aria-hidden
        data-slot="swatch"
        className={cn("inline-block size-2.5 shrink-0 align-[-1px]", texture !== "solid" && "outline outline-1 -outline-offset-1", className)}
        style={{ background: textureBackground(texture, color), outlineColor: color }}
      />
    );
  return (
    <svg aria-hidden data-slot="swatch" width={18} height={10} viewBox="0 0 18 10" className={cn("inline-block shrink-0 overflow-visible align-middle", className)}>
      <line x1={1} x2={17} y1={5} y2={5} stroke={color} strokeWidth={2} strokeDasharray={dash} strokeLinecap={dash ? "butt" : "round"} />
      {marker && <path d={markerPath(marker, 9, 5, 3)} fill={color} stroke="var(--background)" strokeWidth={1} />}
    </svg>
  );
}

export interface LegendItem {
  key: string;
  label: ReactNode;
  color: string;
  dash?: string;
  marker?: MarkerShape;
  texture?: Texture;
  /** The current or total value, in bold after the label: "87%", "4.1 GiB" */
  value?: ReactNode;
}

export interface LegendProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  items: LegendItem[];
  /** Swatch shape for every item: line for line charts, square for bars and donuts */
  shape?: "square" | "line";
  /** One item per line, for a legend beside a donut */
  stacked?: boolean;
}

/**
 * A chart's key: swatch, label and, optionally, the value in bold. Items sit on the text baseline
 * and the swatch is centred on its own, so a legend set in a row of other text lines up with it
 * (an empty swatch would otherwise supply the baseline and push the legend about 3px down).
 * A plain list, so screen readers announce how many series there are.
 */
export function Legend({ items, shape = "line", stacked = false, className, ...rest }: LegendProps) {
  return (
    <ul data-slot="legend" className={cn("flex text-[13px]", stacked ? "flex-col gap-0.5" : "flex-wrap gap-x-4 gap-y-0.5", className)} {...rest}>
      {items.map((it) => (
        <li key={it.key} className="flex items-baseline gap-1.5 whitespace-nowrap">
          <Swatch color={it.color} shape={shape} dash={it.dash} marker={it.marker} texture={it.texture} className="self-center" />
          <span>{it.label}</span>
          {it.value != null && <b className={cn("tabular-nums", stacked && "ml-auto pl-3")}>{it.value}</b>}
        </li>
      ))}
    </ul>
  );
}
