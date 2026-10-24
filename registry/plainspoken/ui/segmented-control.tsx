"use client";

import { useId, type ReactNode } from "react";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

export interface SegmentedControlProps<V extends string> {
  /** Accessible name of the group: "Range", "View" */
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: (V | { value: V; label: ReactNode })[];
  size?: ControlSize;
  className?: string;
}

/**
 * Two to five mutually exclusive views or modes side by side (24h / 7d / 30d), exactly a button's
 * height. Native radios underneath, so arrow keys work and screen readers say "1 of 3". The chosen
 * segment is filled with the main colour.
 */
export function SegmentedControl<V extends string>({ label, value, onChange, options, size, className }: SegmentedControlProps<V>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-slot="segmented-control"
      className={cn(
        "inline-flex h-(--ctl-h) max-w-full overflow-x-auto align-baseline text-(length:--ctl-text) [&>*+*]:-ml-px",
        controlSize(size),
        className,
      )}
    >
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        const on = value === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              "relative flex cursor-pointer items-center border px-(--ctl-px) leading-none font-medium whitespace-nowrap select-none",
              "has-[:focus-visible]:z-10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ring",
              on ? "z-[1] border-primary bg-primary text-primary-foreground" : "border-input bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            <input type="radio" name={name} value={opt.value} checked={on} onChange={() => onChange(opt.value)} className="sr-only" />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
