import type { HTMLAttributes, ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type StatDirection = "up" | "down" | "flat";

export interface StatChange {
  /** How much, already formatted: "8.2%", "$1,240", "3 orders". Not needed for flat. */
  value?: ReactNode;
  direction: StatDirection;
  /**
   * Whether this change is good news. Up is good and down is bad by default; say otherwise for
   * numbers where less is better (errors, response time, churn).
   */
  sentiment?: "good" | "bad" | "neutral";
  /** What it is compared with: "vs last week", "since yesterday" */
  period?: ReactNode;
}

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  /** What is measured: "Revenue", "Open tickets" */
  label: ReactNode;
  /** The number, already formatted, with its unit: "$12,400", "99.98%", "312 ms" */
  value: ReactNode;
  change?: StatChange;
  /** Small print under the value or the change: "of 2,000 seats", "updated 09:40" */
  hint?: ReactNode;
  /** A small chart to the right of the number (a sparkline, about 80 × 28px). Give it its own accessible name or hide it. */
  chart?: ReactNode;
}

const WORD: Record<StatDirection, string> = { up: "Up", down: "Down", flat: "No change" };
const MARK = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;
const TONE = { good: "text-success", bad: "text-destructive", neutral: "text-muted-foreground" } as const;

/**
 * One headline number with its label, and how it moved: "Revenue $12,400 · Up 8.2% vs last week".
 * The change is said in words and with an arrow as well as in green or red, so colour is never
 * the only sign of which way it went. Line several up in a StatGroup.
 */
export function Stat({ label, value, change, hint, chart, className, ...rest }: StatProps) {
  const sentiment = change?.sentiment ?? (change?.direction === "up" ? "good" : change?.direction === "down" ? "bad" : "neutral");
  return (
    <div data-slot="stat" className={cn("flex min-w-0 flex-col gap-0.5", className)} {...rest}>
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-[24px] leading-tight font-bold tabular-nums">{value}</div>
        {chart != null && <div className="shrink-0">{chart}</div>}
      </div>
      {change && (
        <div className="text-[13px]">
          <span className={cn("font-medium whitespace-nowrap", TONE[sentiment])}>
            <Icon icon={MARK[change.direction]} /> {WORD[change.direction]}
            {change.direction !== "flat" && change.value != null && <> {change.value}</>}
          </span>
          {change.period != null && <span className="text-muted-foreground"> {change.period}</span>}
        </div>
      )}
      {hint != null && <div className="text-[13px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/**
 * Stats side by side in one bordered strip, ruled between them like a table row. They wrap onto
 * more rows on narrow screens; `columns` caps how many sit in a row on wide ones.
 */
export function StatGroup({ columns = 4, className, children, ...rest }: HTMLAttributes<HTMLDivElement> & { columns?: 2 | 3 | 4 | 5 }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5" }[columns];
  return (
    <div
      data-slot="stat-group"
      className={cn(
        // Every stat draws its right and bottom edges; the overflow-hidden frame trims the outer ones
        // where they would double the frame's own border.
        "grid grid-cols-1 overflow-hidden border border-border [&>*]:-mr-px [&>*]:-mb-px [&>*]:border-r [&>*]:border-b [&>*]:border-border [&>*]:px-3 [&>*]:py-2",
        cols,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
