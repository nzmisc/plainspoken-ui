"use client";

import { useEffect, useRef } from "react";
import { CircleX, TriangleAlert } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

const TRACK = "relative h-2.5 min-w-16 flex-1 overflow-hidden border border-border bg-accent";

export interface ProgressProps {
  /** Done so far, 0 to `max`. Leave out for an indeterminate bar: work with no known end. */
  value?: number;
  max?: number;
  /** What is in progress: "Uploading photos". The accessible name; not shown. */
  label: string;
  /** Text after the bar: true (default) for the percentage, a string for your own ("3.2 of 8 GiB"), false for none */
  showValue?: boolean | string;
  className?: string;
}

/**
 * How far along a task is: a bar filling in the main colour, and the percentage after it. With no
 * `value` it is indeterminate: a block slides back and forth, or, when the reader asks for reduced
 * motion, the bar stands still and hatched.
 */
export function Progress({ value, max = 100, label, showValue = true, className }: ProgressProps) {
  const runner = useRef<HTMLDivElement>(null);
  const indeterminate = value == null;
  useEffect(() => {
    const el = runner.current;
    if (!indeterminate || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = el.animate([{ left: "-30%" }, { left: "100%" }], { duration: 1300, iterations: Infinity, easing: "ease-in-out" });
    return () => a.cancel();
  }, [indeterminate]);
  const pct = indeterminate ? null : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div data-slot="progress" className={cn("flex min-w-0 items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuetext={typeof showValue === "string" ? showValue : undefined}
        className={TRACK}
      >
        {indeterminate ? (
          <>
            {/* Both are drawn; the media query picks one, so server and browser render the same */}
            <div ref={runner} className="absolute inset-y-0 -left-[30%] w-[30%] bg-primary motion-reduce:hidden" />
            <div className="absolute inset-0 hidden bg-[repeating-linear-gradient(45deg,var(--color-primary)_0_3px,transparent_3px_7px)] motion-reduce:block" />
          </>
        ) : (
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        )}
      </div>
      {showValue !== false && (
        <span aria-hidden className="min-w-[4ch] text-right text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
          {typeof showValue === "string" ? showValue : indeterminate ? "…" : `${Math.round(pct!)}%`}
        </span>
      )}
    </div>
  );
}

export interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  /** What is measured: "Disk / used". The accessible name; not shown. */
  label: string;
  /** At or above this the bar turns the warning colour and the text gains a warning symbol */
  warn?: number;
  /** At or above this the bar turns the destructive colour and the text gains an error symbol */
  crit?: number;
  /** Text after the bar. Default: the percentage. */
  valueText?: string;
  className?: string;
}

/**
 * A measurement within a known range (a disk's fill, a quota's use), as opposed to a task's
 * progress. Crossing a threshold changes the colour and adds a symbol, and a screen reader hears
 * "84%, warning", so the state never rests on colour alone.
 */
export function Meter({ value, min = 0, max = 100, label, warn, crit, valueText, className }: MeterProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const level = crit != null && value >= crit ? "crit" : warn != null && value >= warn ? "warn" : "ok";
  const text = valueText ?? `${Math.round(pct)}%`;
  return (
    <div data-slot="meter" className={cn("flex min-w-0 items-center gap-2", className)}>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={level === "ok" ? text : `${text}, ${level === "crit" ? "critical" : "warning"}`}
        className={TRACK}
      >
        <div
          className={cn("h-full", level === "crit" ? "bg-destructive" : level === "warn" ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        aria-hidden
        className={cn(
          "min-w-[4ch] text-right text-[13px] whitespace-nowrap tabular-nums",
          level === "crit" ? "text-destructive" : level === "warn" ? "text-warning" : "text-muted-foreground",
        )}
      >
        {level !== "ok" && <Icon icon={level === "crit" ? CircleX : TriangleAlert} className="mr-0.5" />}
        {text}
      </span>
    </div>
  );
}
