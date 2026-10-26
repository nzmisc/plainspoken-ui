import type { HTMLAttributes, ReactNode } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert, X, type Glyph } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Icon, renderIcon, type IconLike } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

const VARIANT: Record<AlertVariant, { border: string; text: string; mark: Glyph; word: string }> = {
  default: { border: "border-border border-l-foreground", text: "text-foreground", mark: Info, word: "Note" },
  info: { border: "border-primary", text: "text-primary", mark: Info, word: "Note" },
  success: { border: "border-success", text: "text-success", mark: CircleCheck, word: "Done" },
  warning: { border: "border-warning", text: "text-warning", mark: TriangleAlert, word: "Warning" },
  destructive: { border: "border-destructive", text: "text-destructive", mark: CircleX, word: "Error" },
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  /** The bold first line. Defaults to the variant's word ("Warning:"), so the state is always in words. */
  title?: ReactNode;
  /** Another symbol instead of the variant's */
  icon?: IconLike;
  /** Buttons or links on the right (they wrap below on narrow screens). sm controls fit best. */
  actions?: ReactNode;
  /** Shows a × button that calls this */
  onDismiss?: () => void;
  /**
   * Have screen readers announce it when it appears (role="alert"). On by default for
   * destructive, off otherwise: an alert that is there when the page loads needs no announcing.
   */
  announce?: boolean;
}

/**
 * A message box in the page flow, for things the reader must see: the variant's colour on the
 * border and the title, a symbol and words in the title, the body in normal text. Use a toast for
 * passing news such as "Saved".
 */
export function Alert({ variant = "default", title, icon, actions, onDismiss, announce, className, children, ...rest }: AlertProps) {
  const v = VARIANT[variant];
  const shout = announce ?? variant === "destructive";
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={shout ? "alert" : undefined}
      className={cn("flex items-start gap-2 border border-l-4 bg-background px-3 py-2 text-[14px]", v.border, className)}
      {...rest}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-60">
          <p className={cn("font-semibold", v.text)}>
            {icon ? renderIcon(icon) : <Icon icon={v.mark} />} {title ?? `${v.word}:`}
          </p>
          {children != null && children !== false && <div className="mt-0.5">{children}</div>}
        </div>
        {/* sm controls by default: their 24px sit level with the 21px title line */}
        {actions && <div className="ctl-sm -mt-px flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {onDismiss && (
        <IconButton
          size="sm"
          variant="ghost"
          icon={X}
          label="Dismiss"
          onClick={onDismiss}
          className="-mt-px -mr-1.5 text-muted-foreground hover:text-foreground"
        />
      )}
    </div>
  );
}
