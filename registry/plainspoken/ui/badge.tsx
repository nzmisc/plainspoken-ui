import type { HTMLAttributes } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert, type Glyph } from "@/registry/plainspoken/lib/icons";
import { IconSlot, renderIcon, type IconLike } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "info" | "success" | "warning" | "destructive";

const VARIANT: Record<BadgeVariant, { outline: string; solid: string; mark: Glyph | null }> = {
  default: { outline: "border-border bg-muted text-foreground", solid: "border-foreground bg-foreground text-background", mark: null },
  info: { outline: "border-primary text-primary", solid: "border-primary bg-primary text-primary-foreground", mark: Info },
  success: { outline: "border-success text-success", solid: "border-success bg-success text-background", mark: CircleCheck },
  warning: { outline: "border-warning text-warning", solid: "border-warning bg-warning text-background", mark: TriangleAlert },
  destructive: { outline: "border-destructive text-destructive", solid: "border-destructive bg-destructive text-background", mark: CircleX },
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Filled instead of outlined, for counts and labels that must stand out */
  solid?: boolean;
  /**
   * Another symbol instead of the variant's, or false for none. Leave the symbol on coloured
   * variants unless the words alone make the state clear ("3 errors"), so colour is never the
   * only signal.
   */
  icon?: IconLike | false;
}

/**
 * A small boxed label for a state or a category: "running", "beta", "3 errors". Not a control: it
 * sizes itself from small print (12px) and sits on the text baseline, so it works in running text,
 * table cells and titles alike. Coloured variants carry a symbol as well as the colour.
 */
export function Badge({ variant = "default", solid = false, icon, className, children, ...rest }: BadgeProps) {
  const v = VARIANT[variant];
  const mark = icon === false ? null : (icon ?? v.mark);
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 align-baseline text-[12px] leading-[18px] font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
        solid ? v.solid : v.outline,
        className,
      )}
      {...rest}
    >
      {mark && <IconSlot>{renderIcon(mark)}</IconSlot>}
      {children}
    </span>
  );
}
