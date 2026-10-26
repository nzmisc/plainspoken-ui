import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SeparatorProps {
  /** horizontal (default): a rule across. vertical: a line as tall as its row, for toolbars. */
  orientation?: "horizontal" | "vertical";
  /** Text in the middle of a horizontal line: "or", "Older messages" */
  label?: ReactNode;
  /**
   * Only a visual divider, hidden from screen readers. On by default for vertical lines (in a
   * toolbar they separate nothing a listener needs to know about); off for horizontal ones,
   * which are a thematic break (<hr>).
   */
  decorative?: boolean;
  className?: string;
}

/**
 * A 1px dividing line in the border colour. Horizontal it is an <hr> (or a labelled rule with the
 * text in the middle); vertical it stretches to the height of the flex row it sits in, and falls
 * back to the text height elsewhere.
 */
export function Separator({ orientation = "horizontal", label, decorative, className }: SeparatorProps) {
  if (orientation === "vertical") {
    const hidden = decorative ?? true;
    return (
      <span
        data-slot="separator"
        role={hidden ? "none" : "separator"}
        aria-orientation={hidden ? undefined : "vertical"}
        className={cn("inline-block min-h-[1em] w-px shrink-0 self-stretch bg-border align-middle", className)}
      />
    );
  }
  // No separator role here: its children would be hidden from screen readers, and the label is
  // worth hearing ("or"). The lines either side are decoration.
  if (label != null)
    return (
      <div data-slot="separator" className={cn("flex items-center gap-3 text-[13px] text-muted-foreground", className)}>
        <span aria-hidden className="h-px flex-1 bg-border" />
        {label}
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
    );
  return (
    <hr
      data-slot="separator"
      role={decorative ? "none" : undefined}
      className={cn("h-0 shrink-0 border-0 border-t border-border", className)}
    />
  );
}
