import type { ReactNode } from "react";
import { X } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface ChipProps {
  children: ReactNode;
  size?: ControlSize;
  /** A toggle chip ("Failed only"): pressed or not. Leave out for a chip that is only removable, or only a label. */
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** Shows a × that calls this. Its accessible name is "Remove" plus the chip's text. */
  onRemove?: () => void;
  /** Words for the remove button when the chip's children aren't plain text */
  name?: string;
  className?: string;
}

/**
 * A filter token at control height: a toggle (a button with aria-pressed), a removable value with
 * its own × button, or, with neither, a plain label. Lighter than a button: no fill until pressed.
 */
export function Chip({ children, size, pressed, onPressedChange, onRemove, name, className }: ChipProps) {
  const look = cn(
    "inline-flex h-(--ctl-h) items-center border text-(length:--ctl-text) leading-none whitespace-nowrap align-baseline [&_svg]:size-(--ctl-icon)",
    controlSize(size),
    className,
  );
  if (onRemove)
    return (
      <span data-slot="chip" className={cn(look, "border-border bg-background")}>
        <span className="pl-(--ctl-inset)">{children}</span>
        <button
          type="button"
          aria-label={`Remove ${name ?? (typeof children === "string" ? children : "filter")}`}
          title="Remove"
          onClick={onRemove}
          className={cn("ml-0.5 flex h-full w-(--ctl-h) cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground", FOCUS_RING)}
        >
          <Icon icon={X} />
        </button>
      </span>
    );
  if (pressed == null)
    return (
      <span data-slot="chip" className={cn(look, "border-border bg-background px-(--ctl-px)")}>
        {children}
      </span>
    );
  return (
    <button
      type="button"
      data-slot="chip"
      aria-pressed={pressed}
      onClick={() => onPressedChange?.(!pressed)}
      className={cn(
        look,
        "cursor-pointer px-(--ctl-px)",
        FOCUS_RING,
        pressed ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
