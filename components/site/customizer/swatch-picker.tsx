"use client";

import { useId, type ReactNode } from "react";
import { Check } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface SwatchOption<V extends string> {
  value: V;
  label: string;
  /** Colours drawn side by side in the swatch, as CSS colour values */
  colours: string[];
  /** Longer description for the tooltip, e.g. which shade is for which mode */
  title?: string;
}

/**
 * One colour out of a few, as a grid of named swatches. Native radios underneath (like
 * SegmentedControl), so arrow keys move the choice and screen readers say "Stone, 2 of 7". The
 * chosen tile gets a border in the main colour and a check, so it doesn't rely on colour alone.
 */
export function SwatchPicker<V extends string>({
  legend,
  value,
  onChange,
  options,
  extra,
  className,
}: {
  legend: ReactNode;
  value: V;
  onChange: (value: V) => void;
  options: SwatchOption<V>[];
  /** Something under the grid that belongs to the same choice (a custom colour field) */
  extra?: ReactNode;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-1 text-[14px] font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <label
              key={o.value}
              title={o.title}
              className={cn(
                "relative flex h-ctl-md min-w-0 cursor-pointer items-center gap-2 border px-2 text-[13px] leading-none select-none",
                "has-[:focus-visible]:z-10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ring",
                on ? "border-primary bg-secondary font-semibold" : "border-input hover:bg-secondary",
              )}
            >
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              <span aria-hidden className="flex h-4 shrink-0 border border-border">
                {o.colours.map((c, i) => (
                  <span key={i} className="block h-full w-2" style={{ background: c }} />
                ))}
              </span>
              <span className="min-w-0 truncate">{o.label}</span>
              {on && <Icon icon={Check} className="ml-auto" />}
            </label>
          );
        })}
      </div>
      {extra}
    </fieldset>
  );
}
