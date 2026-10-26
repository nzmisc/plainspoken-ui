import { useId, type ReactNode } from "react";
import { Check } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface LandingSectionProps {
  /** The fragment the nav links to: #features */
  id?: string;
  /** A short line above the heading: "Pricing", "How it works" */
  eyebrow?: ReactNode;
  /** The section's h2 */
  title: ReactNode;
  /** A sentence or two under the heading */
  lead?: ReactNode;
  /** muted: a gray band, to tell neighbouring sections apart without a box around each */
  tone?: "default" | "muted";
  /** Centre the heading and lead (they stay left-aligned on phones) */
  centered?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * One band of a marketing page: an optional eyebrow, the h2, a lead paragraph, then the content,
 * all at the page's width. Sections alternate plain and gray, ruled off top and bottom, and leave
 * room under a sticky nav when jumped to by an anchor.
 */
export function LandingSection({ id, eyebrow, title, lead, tone = "default", centered = false, children, className }: LandingSectionProps) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-slot="landing-section"
      className={cn("scroll-mt-12 border-b border-border", tone === "muted" ? "bg-muted" : "bg-background", className)}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:py-16">
        <header className={cn("flex max-w-[62ch] flex-col gap-2", centered && "sm:mx-auto sm:items-center sm:text-center")}>
          {eyebrow != null && <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>}
          <h2 id={headingId} className="text-[26px] leading-tight font-bold text-balance sm:text-[30px]">
            {title}
          </h2>
          {lead != null && <p className="text-[16px] leading-relaxed text-muted-foreground">{lead}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export interface LandingPageHeaderProps {
  /** The page's h1 */
  title: ReactNode;
  /** A sentence or two under it */
  lead?: ReactNode;
  className?: string;
}

/** The top of an inner page (Pricing, Sign up): a big h1 and a lead paragraph, at the page's width. */
export function LandingPageHeader({ title, lead, className }: LandingPageHeaderProps) {
  return (
    <header data-slot="landing-page-header" className={cn("flex max-w-[60ch] flex-col gap-2", className)}>
      <h1 className="text-[32px] leading-tight font-bold tracking-tight text-balance sm:text-[40px]">{title}</h1>
      {lead != null && <p className="text-[17px] leading-relaxed text-muted-foreground">{lead}</p>}
    </header>
  );
}

/** Short claims, each after a green check mark: what a plan includes, what a feature does. */
export function LandingCheckList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul data-slot="landing-check-list" className={cn("flex flex-col gap-1.5", className)}>
      {items.map((it, i) => (
        <li key={i} className="flex items-baseline gap-2">
          <Icon icon={Check} className="shrink-0 text-success" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
