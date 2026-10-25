import type { HTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /**
   * What is happening, for screen readers when there is no visible text: "Loading messages".
   * Default "Loading". Set null when the text next to the spinner already says it (inside a
   * loading button), so it isn't read twice.
   */
  label?: string | null;
  /** Visible words after the spinner: "Checking for updates…". They become the announcement. */
  children?: ReactNode;
  /** Icon size in px or a CSS length. Default 1.1em, so it scales with the text; inside a control the control sets it. */
  size?: number | string;
}

/**
 * The house loading mark: the same turning circle a loading Button shows, sized from the text
 * around it. A polite status region, so screen readers hear "Loading" once rather than nothing.
 * With reduced motion it stands still.
 */
export function Spinner({ label = "Loading", children, size, className, ...rest }: SpinnerProps) {
  const icon = <Icon icon={LoaderCircle} size={size} className="animate-spin motion-reduce:animate-none" />;
  if (children != null)
    return (
      <span data-slot="spinner" role="status" className={cn("inline-flex items-center gap-1.5", className)} {...rest}>
        {icon}
        <span>{children}</span>
      </span>
    );
  return (
    <span
      data-slot="spinner"
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex align-[-0.15em]", className)}
      {...rest}
    >
      {icon}
    </span>
  );
}
