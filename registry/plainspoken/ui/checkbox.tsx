"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: ReactNode;
  /** Smaller text under the label */
  description?: ReactNode;
  /** The "some but not all" state, e.g. a select-all box over a partly selected list */
  indeterminate?: boolean;
  /** Height of the row, from the shared scale. Leave out to take the surrounding size. */
  size?: ControlSize;
}

/**
 * Native checkbox in the main colour with a clickable label. The row is at least a control tall,
 * so "Auto-refresh" in a toolbar sits level with the buttons around it; with a description (or a
 * label that wraps) it grows and the box stays by the first line.
 */
export function Checkbox({ label, description, indeterminate = false, size, className, disabled, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const descId = useId();
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label
      data-slot="checkbox"
      className={cn(
        "inline-flex min-h-(--ctl-h) gap-(--ctl-gap) align-baseline text-(length:--ctl-text) leading-snug",
        description ? "items-start py-1" : "items-center",
        disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer",
        controlSize(size),
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "m-0 size-[calc(var(--ctl-icon)-2px)] shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
          !!description && "mt-[0.2em]",
        )}
        {...rest}
      />
      <span className="min-w-0">
        {label}
        {description && (
          <span id={descId} className="block text-[0.9em] text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
