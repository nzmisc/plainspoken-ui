import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  /** Small muted text after the title: "last 10 min", "updated 3 s ago" */
  meta?: ReactNode;
  /** Controls at the right of the title bar. They default to sm, which fits the bar exactly. */
  actions?: ReactNode;
  /** The title's heading level. Default h2: panels are usually the sections of a page. */
  as?: "h2" | "h3" | "h4";
  /** No padding around the body, for a table or a list that brings its own borders */
  flush?: boolean;
}

/**
 * A titled box, the basic unit of a dashboard: a gray title bar with a heading, optional meta
 * text and controls, over a bordered body. The bar is 29px tall, border included, with or without
 * controls (an sm control, 24px, fits with 2px above and below), so panels side by side line up.
 * On narrow screens meta and actions wrap under the title.
 */
export function Panel({ title, meta, actions, as: Heading = "h2", flush = false, className, children, ...rest }: PanelProps) {
  return (
    <section data-slot="panel" className={cn("min-w-0 border border-border bg-background", className)} {...rest}>
      <header className="flex min-h-[29px] flex-wrap items-center gap-x-2 border-b border-border bg-muted px-2 py-0.5">
        <Heading className="text-[14px] font-bold">{title}</Heading>
        {meta != null && <span className="text-[13px] text-muted-foreground">{meta}</span>}
        {actions != null && <div className="ctl-sm ml-auto flex items-center gap-1">{actions}</div>}
      </header>
      <div className={cn(!flush && "p-2")}>{children}</div>
    </section>
  );
}
