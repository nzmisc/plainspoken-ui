"use client";

import { useId, type ReactNode } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Print "on"/"off" next to the switch, so the state is in words too */
  showState?: boolean;
  className?: string;
}

/**
 * An on/off setting that takes effect immediately (inside forms that are submitted, use a Checkbox).
 * role="switch", toggled by click, Space or Enter. Square, like everything else.
 */
export function Switch({ checked, onChange, label, description, disabled, showState = true, className }: SwitchProps) {
  const id = useId();
  return (
    <div data-slot="switch" className={cn("flex items-start gap-2 text-[14px] leading-snug", disabled && "text-muted-foreground", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-[0.15em] h-4 w-8 shrink-0 cursor-pointer border p-0",
          checked ? "border-primary bg-primary" : "border-input bg-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          FOCUS_RING,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-px size-3 border bg-background transition-[left] motion-reduce:transition-none",
            checked ? "left-[calc(100%-13px)] border-primary" : "left-px border-input",
          )}
        />
      </button>
      <span className="min-w-0">
        <label htmlFor={id} className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
          {label}
        </label>
        {showState && (
          <span className="ml-1.5 text-[13px] text-muted-foreground" aria-hidden>
            {checked ? "on" : "off"}
          </span>
        )}
        {description && (
          <span id={`${id}-d`} className="block text-[13px] text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}
