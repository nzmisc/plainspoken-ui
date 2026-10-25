import Link from "next/link";
import { useId, type ReactNode } from "react";
import { ArrowRight } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface BlogShellProps {
  /** The site's top bar, usually BlogHeader */
  header: ReactNode;
  /** The site's footer, usually BlogFooter */
  footer: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The frame of a personal site: a skip link, the header, one <main> landmark centred at a
 * readable width, and the footer pushed to the bottom of short pages. Every page of the site
 * renders inside it, so header, main and footer line up on every page.
 */
export function BlogShell({ header, footer, children, className }: BlogShellProps) {
  return (
    <div data-slot="blog-shell" className={cn("flex min-h-[calc(100dvh-var(--demo-bar,0px))] flex-col bg-background", className)}>
      <a
        href="#main"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:bg-background focus:px-3 focus:py-1 focus:text-foreground",
          FOCUS_RING,
        )}
      >
        Skip to content
      </a>
      {header}
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none sm:py-8">
        {children}
      </main>
      {footer}
    </div>
  );
}

export interface BlogColumnsProps {
  children: ReactNode;
  /** Side column on wide screens (Now, tags, projects); it moves under the main column on narrow ones */
  aside?: ReactNode;
  /** Accessible name of the side column's landmark */
  asideLabel?: string;
  className?: string;
}

/**
 * A page's main column with a narrow side column beside it from the lg breakpoint, and below it
 * on phones and tablets. The main column stays at a reading width either way.
 */
export function BlogColumns({ children, aside, asideLabel = "More", className }: BlogColumnsProps) {
  return (
    <div className={cn("grid gap-x-12 gap-y-10", aside != null && "lg:grid-cols-[minmax(0,1fr)_16rem]", className)}>
      <div className="flex min-w-0 flex-col gap-8">{children}</div>
      {aside != null && (
        <aside aria-label={asideLabel} className="flex min-w-0 flex-col gap-6">
          {aside}
        </aside>
      )}
    </div>
  );
}

export interface BlogPageHeaderProps {
  /** The page's h1 */
  title: ReactNode;
  /** A sentence or two under it */
  children?: ReactNode;
  className?: string;
}

/** The top of a list page (Writing, a tag, About): the page's one h1 and a lead paragraph in muted text. */
export function BlogPageHeader({ title, children, className }: BlogPageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-1.5", className)}>
      <h1 className="text-[28px] leading-tight font-bold text-balance">{title}</h1>
      {children != null && (
        <div className="max-w-[68ch] text-[16px] text-muted-foreground [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2 [&_a:visited]:text-link-visited">
          {children}
        </div>
      )}
    </header>
  );
}

export interface BlogSectionProps {
  title: ReactNode;
  /** A link after the content: "All 11 posts" */
  more?: { label: string; href: string };
  /** The heading level. Default h2. */
  as?: "h2" | "h3";
  children: ReactNode;
  className?: string;
}

/** A titled part of a page (Recent writing, Projects): a heading, the content, and an optional "more" link under it. */
export function BlogSection({ title, more, as: H = "h2", children, className }: BlogSectionProps) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-2", className)}>
      <H id={id} className="text-[18px] font-bold">
        {title}
      </H>
      {children}
      {more && (
        <p>
          <Link href={more.href} className={cn(linkVariants(), "inline-flex items-baseline gap-1")}>
            {more.label}
            <Icon icon={ArrowRight} />
          </Link>
        </p>
      )}
    </section>
  );
}
