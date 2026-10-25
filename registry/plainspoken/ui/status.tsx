import type { HTMLAttributes, ReactNode } from "react";
import { CircleCheck, CircleX, Dot, Info, TriangleAlert, type Glyph } from "@/registry/plainspoken/lib/icons";
import { Icon, renderIcon, type IconLike } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type StatusVariant = "default" | "info" | "success" | "warning" | "destructive";

const VARIANT: Record<StatusVariant, { cls: string; mark: Glyph }> = {
  default: { cls: "text-muted-foreground", mark: Dot },
  info: { cls: "text-primary", mark: Info },
  success: { cls: "text-success", mark: CircleCheck },
  warning: { cls: "text-warning", mark: TriangleAlert },
  destructive: { cls: "text-destructive", mark: CircleX },
};

export interface StatusProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  /** Another symbol instead of the variant's */
  icon?: IconLike;
  /** The words: "running", "filling up", "unreachable". Required: the colour never speaks alone. */
  children: ReactNode;
}

/**
 * A state as coloured text with a symbol: "✓ running", "▲ filling up", "✕ unreachable". For table
 * cells and lists, where a boxed Badge would be too loud. Always symbol and words, never colour
 * alone; default is gray, for "unknown" and "stopped on purpose".
 */
export function Status({ variant = "default", icon, className, children, ...rest }: StatusProps) {
  const v = VARIANT[variant];
  return (
    <span data-slot="status" data-variant={variant} className={cn("whitespace-nowrap", v.cls, className)} {...rest}>
      {icon ? renderIcon(icon) : <Icon icon={v.mark} />} {children}
    </span>
  );
}

export interface ErrorLineProps extends HTMLAttributes<HTMLParagraphElement> {
  /** The word before the message. Default "Error:". */
  label?: ReactNode;
}

/**
 * A one-line error in a red box, for a failed fetch or poll inside a panel or table cell: compact
 * where an Alert would take over the panel. Long messages wrap anywhere, URLs included.
 */
export function ErrorLine({ label = "Error:", className, children, ...rest }: ErrorLineProps) {
  return (
    <p
      data-slot="error-line"
      className={cn("border border-destructive px-2 py-0.5 text-[13px] break-words text-destructive", className)}
      {...rest}
    >
      <Icon icon={CircleX} className="mr-1" />
      <b className="font-semibold">{label}</b> {children}
    </p>
  );
}
