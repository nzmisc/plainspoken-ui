import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps {
  /**
   * Stand in for a paragraph: this many text-line bars, the last one shorter. Leave out for a
   * single block, sized with className (`h-4 w-40`, `size-12`).
   */
  lines?: number;
  className?: string;
  style?: CSSProperties;
}

const BAR = "animate-pulse bg-accent motion-reduce:animate-none";

/**
 * Gray placeholder shapes for content that is still loading, so the layout doesn't jump when it
 * arrives. They are hidden from screen readers: put `aria-busy="true"` (and a label) on the region
 * being loaded instead. The pulse stops with reduced motion.
 */
export function Skeleton({ lines, className, style }: SkeletonProps) {
  if (lines)
    return (
      <div data-slot="skeleton" aria-hidden className={cn("flex flex-col gap-[0.5em]", className)} style={style}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={cn(BAR, "h-[1em]", lines > 1 && i === lines - 1 ? "w-3/5" : "w-full")} />
        ))}
      </div>
    );
  return <div data-slot="skeleton" aria-hidden className={cn(BAR, "h-[1em] w-full", className)} style={style} />;
}
