"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { controlSize, FOCUS_RING, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Check, Minus } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface CheckboxBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** The "some but not all" state, e.g. a select-all box over a partly selected list */
  indeterminate?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/**
 * The box alone, for a table cell or a list row whose label is elsewhere: give it an `aria-label`.
 * A real checkbox input, drawn by us rather than the browser, so it is the same square everywhere
 * (iOS would draw a small circle) and at least 14px: the current icon size, 16px at md.
 */
export function CheckboxBox({ indeterminate = false, className, ref, ...rest }: CheckboxBoxProps) {
  return (
    <span
      data-slot="checkbox-box"
      className={cn(
        "relative inline-grid size-(--box) shrink-0 align-middle [--box:max(14px,var(--ctl-icon))] *:col-start-1 *:row-start-1 has-disabled:opacity-50",
        className,
      )}
    >
      <input
        ref={(el) => {
          // indeterminate is a property only, with no attribute, so it is set on every render
          if (el) el.indeterminate = indeterminate;
          if (typeof ref === "function") return ref(el);
          if (ref) ref.current = el;
        }}
        type="checkbox"
        className={cn(
          "peer m-0 size-full cursor-pointer appearance-none border border-input bg-background checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary disabled:cursor-not-allowed",
          FOCUS_RING,
        )}
        {...rest}
      />
      <Icon icon={Check} size="100%" strokeWidth={3} className="pointer-events-none hidden p-px text-primary-foreground peer-[:checked:not(:indeterminate)]:block" />
      <Icon icon={Minus} size="100%" strokeWidth={3} className="pointer-events-none hidden p-px text-primary-foreground peer-indeterminate:block" />
    </span>
  );
}

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
 * A checkbox with a clickable label: a square box in the main colour when ticked (see
 * CheckboxBox). The row is at least a control tall, so "Auto-refresh" in a toolbar sits level
 * with the buttons around it; with a description (or a label that wraps) it grows and the box
 * stays by the first line.
 */
export function Checkbox({ label, description, indeterminate = false, size, className, disabled, "aria-describedby": describedBy, ...rest }: CheckboxProps) {
  const descId = useId();
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
      <CheckboxBox
        indeterminate={indeterminate}
        disabled={disabled}
        aria-describedby={[description ? descId : null, describedBy].filter(Boolean).join(" ") || undefined}
        className={cn(!!description && "mt-[0.1em]")}
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
