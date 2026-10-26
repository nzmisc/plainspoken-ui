import type { ReactNode } from "react";
import { NextLink } from "@/registry/plainspoken/lib/next-link";
import { Breadcrumb, type Crumb } from "@/registry/plainspoken/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface AppPageHeaderProps {
  /** The way here, from the top; the last is this page */
  crumbs: Crumb[];
  title: ReactNode;
  /** A line under the title */
  description?: ReactNode;
  /** Next to the title: a status badge */
  badge?: ReactNode;
  /** Buttons on the right (under the title on phones) */
  actions?: ReactNode;
  className?: string;
}

/**
 * The top of every page in the app: the breadcrumb trail (links through next/link), the page's
 * h1 with an optional badge, a line of description, and the page's buttons on the right. Renders
 * on the server.
 */
export function AppPageHeader({ crumbs, title, description, badge, actions, className }: AppPageHeaderProps) {
  return (
    <header data-slot="app-page-header" className={cn("mb-4 flex flex-col gap-1", className)}>
      <Breadcrumb items={crumbs} linkAs={NextLink} className="text-[13px]" />
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[22px] leading-tight font-bold">
            {title}
            {badge}
          </h1>
          {description && <p className="mt-0.5 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** The padded, width-capped column a page sits in, inside the app frame */
export function AppPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-5", className)}>{children}</div>;
}
