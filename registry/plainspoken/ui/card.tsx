import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

/**
 * A bordered box for one piece of content: a plan, a post, a settings group. Square, 1px border,
 * no shadow, card background. Build it from CardHeader (CardTitle, CardDescription, CardAction),
 * CardContent and CardFooter, or put anything inside. For a dense titled box with a gray title
 * bar (dashboards), use Panel.
 */
export function Card({ className, ...rest }: CardProps) {
  return <div data-slot="card" className={cn("flex min-w-0 flex-col border border-border bg-card text-card-foreground", className)} {...rest} />;
}

/** The top of a card: title and description on the left, a CardAction on the right. */
export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min grid-cols-[1fr_auto] items-start gap-x-3 gap-y-0.5 px-4 pt-3 pb-0 last:pb-3 [&>*:not([data-slot=card-action])]:col-start-1",
        className,
      )}
      {...rest}
    />
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The heading level that fits the page's outline. Default h3. */
  as?: "h2" | "h3" | "h4" | "div";
}

/** The card's heading: bold, 16px. A real heading (h3 unless you say otherwise), so it shows up in the page outline. */
export function CardTitle({ as: Tag = "h3", className, ...rest }: CardTitleProps) {
  return <Tag data-slot="card-title" className={cn("text-[16px] leading-snug font-bold", className)} {...rest} />;
}

/** A line or two under the title, in muted small print. */
export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="card-description" className={cn("text-[13px] text-muted-foreground", className)} {...rest} />;
}

/** Controls at the top right of the header (a menu, a link), level with the title. sm controls by default. */
export function CardAction({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-action"
      className={cn("ctl-sm col-start-2 row-span-2 row-start-1 flex items-center gap-1 self-start", className)}
      {...rest}
    />
  );
}

/** The body. */
export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn("flex-1 px-4 py-3", className)} {...rest} />;
}

/**
 * A strip along the bottom for the card's buttons, gray and ruled off like a dialog's button
 * bar, so the actions read as belonging to the whole card.
 */
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex flex-wrap items-center gap-2 border-t border-border bg-muted px-4 py-2", className)}
      {...rest}
    />
  );
}
