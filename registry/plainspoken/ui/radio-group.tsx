"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { CircleX } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface RadioOption<V extends string> {
  value: V;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<V extends string> {
  legend: ReactNode;
  value: V | null;
  onChange: (value: V) => void;
  options: RadioOption<V>[];
  /** Side by side instead of stacked (wraps on narrow screens) */
  horizontal?: boolean;
  error?: ReactNode;
  /** Hide the bordered box around the group */
  bare?: boolean;
  /** Form field name; generated when left out */
  name?: string;
  className?: string;
}

/**
 * One choice out of a few, all visible. A real <fieldset> of native radios, so arrow keys move
 * between options and the legend is read out with each one.
 */
export function RadioGroup<V extends string>({ legend, value, onChange, options, horizontal, error, bare, name: ownName, className }: RadioGroupProps<V>) {
  const autoName = useId();
  const name = ownName ?? autoName;
  return (
    <fieldset
      data-slot="radio-group"
      aria-invalid={error ? true : undefined}
      className={cn("min-w-0 text-[14px]", !bare && "border px-3 pt-0 pb-2", !bare && (error ? "border-destructive" : "border-border"), className)}
    >
      <legend className={cn("font-medium", !bare && "px-1")}>{legend}</legend>
      <div className={cn("flex", horizontal ? "flex-wrap gap-x-4 gap-y-1" : "flex-col gap-1", bare && "mt-1")}>
        {options.map((o) => (
          <Radio
            key={o.value}
            name={name}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
            label={o.label}
            description={o.description}
          />
        ))}
      </div>
      {error && (
        <p className="mt-1 text-[13px] text-destructive">
          <Icon icon={CircleX} className="mr-1" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Radio({ label, description, disabled, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex items-start gap-2 leading-snug", disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer")}>
      <input
        type="radio"
        disabled={disabled}
        className="mt-[0.2em] size-3.5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        {...rest}
      />
      <span className="min-w-0">
        {label}
        {description && <span className="block text-[13px] text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}
