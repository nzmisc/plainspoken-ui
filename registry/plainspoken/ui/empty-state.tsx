import type { HTMLAttributes, ReactNode } from "react";
import type { Glyph } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** A symbol for what is missing: Inbox for no mail, Search for no results */
  icon?: Glyph;
  /** What is empty, in a few words: "No messages", "Nothing matches “invoice”" */
  title: ReactNode;
  /** A sentence on why, or what to do next. Also takes `children`. */
  description?: ReactNode;
  /** Buttons or links: "Clear filters", "New message" */
  actions?: ReactNode;
  /** A dashed border around it, for an empty area that stands on its own (a drop zone, an empty column) */
  bordered?: boolean;
  /** Less padding and a smaller icon, for inside a panel, a table body or a narrow column */
  compact?: boolean;
}

/**
 * What to show where a list, a search or a page has nothing in it: a muted symbol, a short title,
 * a sentence and the next step, centred in the space. Say what is empty and what to do about it;
 * leave out the jokes.
 */
export function EmptyState({ icon, title, description, actions, bordered = false, compact = false, className, children, ...rest }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "gap-1 px-3 py-4" : "gap-1.5 px-4 py-10",
        bordered && "border border-dashed border-border",
        className,
      )}
      {...rest}
    >
      {icon && <Icon icon={icon} size={compact ? 20 : 28} strokeWidth={1.75} className="mb-1 text-muted-foreground" />}
      <p className={cn("font-semibold", compact ? "text-[14px]" : "text-[16px]")}>{title}</p>
      {(description != null || children != null) && (
        <div className="max-w-[46ch] text-[14px] text-muted-foreground">
          {description}
          {children}
        </div>
      )}
      {actions != null && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
