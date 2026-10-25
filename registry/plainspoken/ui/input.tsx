"use client";

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { isGlyph, type Glyph } from "@/registry/plainspoken/lib/icons";
import { FOCUS_WITHIN_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Icon, IconSlot } from "@/registry/plainspoken/ui/icon";
import { useFieldProps } from "@/registry/plainspoken/ui/field";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "size"> {
  /** Height from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  /**
   * Before the value: an icon (drawn inside the box, muted), text such as "https://" (in a gray
   * cell), or an element such as a small button (inside the box, as it is)
   */
  prefix?: Glyph | ReactNode;
  /** Same, after the value: "GiB", ".example.com", a clear button */
  suffix?: Glyph | ReactNode;
  invalid?: boolean;
  /** Classes for the outer box: width, flex-1 */
  className?: string;
  /** Classes for the <input> itself */
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

/** An icon sits inside the box with no divider; text gets its own gray cell; anything else sits inside as it is. */
function Affix({ value, side }: { value: Glyph | ReactNode; side: "start" | "end" }) {
  if (isGlyph(value))
    return (
      <span className={cn("flex items-center text-muted-foreground", side === "start" ? "pl-(--ctl-inset)" : "pr-(--ctl-inset)")}>
        <IconSlot>
          <Icon icon={value} />
        </IconSlot>
      </span>
    );
  if (typeof value !== "string" && typeof value !== "number")
    return <span className={cn("flex shrink-0 items-center", side === "start" ? "pl-0.5" : "pr-0.5")}>{value}</span>;
  return (
    <span
      className={cn(
        "flex items-center border-input bg-muted px-(--ctl-inset) whitespace-nowrap text-muted-foreground",
        side === "start" ? "border-r" : "border-l",
      )}
    >
      {value}
    </span>
  );
}

/**
 * Single-line text input on the shared height scale: the box is exactly as tall as a Button of the
 * same size, whatever sits inside it. Inside a Field it takes the field's id, hint, error and
 * required flag, and stretches to the field's width.
 */
export function Input({ size, prefix, suffix, invalid, className, inputClassName, id, required, disabled, ref, ...rest }: InputProps) {
  const f = useFieldProps({ id, invalid, required });
  return (
    <span
      data-slot="input"
      className={cn(
        "inline-flex h-(--ctl-h) min-w-0 items-stretch border bg-background align-baseline text-(length:--ctl-text) leading-none [&_svg]:size-(--ctl-icon)",
        f.invalid ? "border-destructive" : "border-input",
        disabled && "bg-muted text-muted-foreground",
        controlSize(size),
        FOCUS_WITHIN_RING,
        className,
      )}
    >
      {prefix != null && <Affix value={prefix} side="start" />}
      <input
        ref={ref}
        id={f.id}
        aria-describedby={f["aria-describedby"]}
        aria-invalid={f["aria-invalid"]}
        required={f.required}
        disabled={disabled}
        className={cn(
          "w-full min-w-0 flex-1 bg-transparent px-(--ctl-inset) placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed",
          // The browser's up/down arrows sit inside the padding box: without this they float short of the edge
          "[&[type=number]]:pr-0",
          inputClassName,
        )}
        {...rest}
      />
      {suffix != null && <Affix value={suffix} side="end" />}
    </span>
  );
}
