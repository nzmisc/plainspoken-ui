import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DescriptionItemData {
  term: ReactNode;
  description: ReactNode;
}

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  /** The pairs, as data. Or write DescriptionItem children. */
  items?: DescriptionItemData[];
  /**
   * side (default): terms in a column on the left, descriptions beside them; on phones each term
   * goes above its description. stacked: always term above description.
   */
  layout?: "side" | "stacked";
  /** A rule between pairs, for long lists that are read across */
  divided?: boolean;
}

/**
 * Term and description pairs: the facts about one thing ("Host: atlas", "Plan: Team"), a glossary,
 * an order summary. A real <dl>, with each pair in a <div> (allowed since HTML 5.2), so screen
 * readers hear the pairs and the pairs can be ruled off.
 */
export function DescriptionList({ items, layout = "side", divided = false, className, children, ...rest }: DescriptionListProps) {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      className={cn(
        "group/dl grid min-w-0 text-[14px]",
        layout === "side" ? "grid-cols-1 sm:grid-cols-[fit-content(16rem)_1fr]" : "grid-cols-1",
        divided ? "border-y border-border [&>div+div]:border-t [&>div+div]:border-border [&>div]:py-1.5" : "gap-y-1.5",
        className,
      )}
      {...rest}
    >
      {items?.map((it, i) => (
        <DescriptionItem key={i} term={it.term}>
          {it.description}
        </DescriptionItem>
      ))}
      {children}
    </dl>
  );
}

export interface DescriptionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  term: ReactNode;
  children: ReactNode;
}

/** One pair. Inside a side-by-side list it spans both columns and lines up on the list's grid. */
export function DescriptionItem({ term, children, className, ...rest }: DescriptionItemProps) {
  return (
    <div
      data-slot="description-item"
      className={cn("col-span-full grid min-w-0 grid-cols-subgrid gap-x-4", className)}
      {...rest}
    >
      <dt className="text-muted-foreground group-data-[layout=stacked]/dl:text-[13px]">{term}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
