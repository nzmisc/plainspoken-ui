"use client";

import { useState, type InputHTMLAttributes, type Ref } from "react";
import { Minus, Plus } from "@/registry/plainspoken/lib/icons";
import { FOCUS_WITHIN_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { useFieldProps } from "@/registry/plainspoken/ui/field";
import { cn } from "@/lib/utils";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size" | "min" | "max" | "step" | "type"> {
  /** The number, or null for empty. Leave out (and use defaultValue) to let the field keep its own. */
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** How much − and +, and ↑/↓, change it. Decimals follow the step: 0.25 steps give two places. */
  step?: number;
  /** Unit after the number, in muted text: "min", "GiB", "%" */
  unit?: string;
  invalid?: boolean;
  /** Height from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  /** Classes for the outer box */
  className?: string;
  /** Classes for the <input>: its width (default 7 characters) */
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A number with − and + buttons either side, on the shared height scale. Typing works as in any
 * number input, ↑/↓ step, and the value is clamped to min and max when the field loses focus.
 * The buttons are skipped by Tab, since the arrow keys do the same, and are disabled at the
 * limits. Inside a Field it takes the label, hint, error and required flag, like Input.
 */
export function NumberField({
  value,
  defaultValue = null,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  invalid,
  disabled,
  size,
  className,
  inputClassName,
  id,
  required,
  onBlur,
  ref,
  ...rest
}: NumberFieldProps) {
  const f = useFieldProps({ id, invalid, required });
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value !== undefined ? value : own;
  const set = (v: number | null) => {
    setOwn(v);
    onChange?.(v);
  };
  const bump = (dir: 1 | -1) =>
    set(clamp(Number(((current ?? (Number.isFinite(min) ? min : 0)) + dir * step).toFixed(decimals(step))), min, max));
  // Square, as wide as the box is tall, like an IconButton of the same size
  const stepper = cn(
    "inline-flex w-(--ctl-h) shrink-0 cursor-pointer items-center justify-center border-input text-muted-foreground",
    "hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
  );
  return (
    <span
      data-slot="number-field"
      data-measure
      className={cn(
        "inline-flex h-(--ctl-h) w-fit max-w-full items-stretch border align-baseline text-(length:--ctl-text) leading-none [&_svg]:size-(--ctl-icon)",
        f.invalid ? "border-destructive" : "border-input",
        disabled ? "bg-muted text-muted-foreground" : "bg-background",
        controlSize(size),
        FOCUS_WITHIN_RING,
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Decrease"
        disabled={disabled || (current != null && current <= min)}
        onClick={() => bump(-1)}
        className={cn(stepper, "border-r")}
      >
        <Icon icon={Minus} />
      </button>
      <input
        ref={ref}
        id={f.id}
        type="number"
        inputMode={Number.isInteger(step) && min >= 0 ? "numeric" : "decimal"}
        aria-describedby={f["aria-describedby"]}
        aria-invalid={f["aria-invalid"]}
        required={f.required}
        disabled={disabled}
        min={Number.isFinite(min) ? min : undefined}
        max={Number.isFinite(max) ? max : undefined}
        step={step}
        value={current ?? ""}
        onChange={(e) => set(e.target.value === "" ? null : e.target.valueAsNumber)}
        onBlur={(e) => {
          if (current != null && clamp(current, min, max) !== current) set(clamp(current, min, max));
          onBlur?.(e);
        }}
        className={cn(
          "w-[7ch] min-w-0 bg-transparent px-(--ctl-inset) text-right tabular-nums focus-visible:outline-none disabled:cursor-not-allowed",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          unit && "pr-1",
          inputClassName,
        )}
        {...rest}
      />
      {unit && <span className="flex items-center pr-(--ctl-inset) whitespace-nowrap text-muted-foreground">{unit}</span>}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Increase"
        disabled={disabled || (current != null && current >= max)}
        onClick={() => bump(1)}
        className={cn(stepper, "border-l")}
      >
        <Icon icon={Plus} />
      </button>
    </span>
  );
}
