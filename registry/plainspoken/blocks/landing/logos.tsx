import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LandingLogosProps {
  /** The line above the names: "Trusted by 2,400 teams, including" */
  title: ReactNode;
  /** Customer names, set in type rather than logos */
  names: string[];
  className?: string;
}

/** A few typographic treatments, so a row of plain names reads like a row of different marks. */
const STYLES = [
  "font-bold tracking-tight",
  "font-mono text-[15px] uppercase tracking-widest",
  "italic font-semibold",
  "font-medium uppercase tracking-[0.2em] text-[14px]",
  "font-black tracking-tighter",
  "font-mono font-semibold",
  "font-semibold [font-variant-caps:small-caps]",
  "font-light tracking-wide",
];

/**
 * A strip of customer names under the hero, set in type in a few different weights and cases
 * instead of logo images: nothing to load, readable in both themes, and honest about what it is.
 * A plain list, so screen readers say how many there are.
 */
export function LandingLogos({ title, names, className }: LandingLogosProps) {
  return (
    <section data-slot="landing-logos" aria-label="Customers" className={cn("border-b border-border bg-muted", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
        <p className="text-[13px] text-muted-foreground">{title}</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 text-[17px] text-muted-foreground sm:grid-cols-4">
          {names.map((n, i) => (
            <li key={n} className={cn("truncate", STYLES[i % STYLES.length])}>
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
