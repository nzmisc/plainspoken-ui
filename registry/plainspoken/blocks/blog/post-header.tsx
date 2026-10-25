import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Clock, Tag } from "@/registry/plainspoken/lib/icons";
import { formatDate } from "@/registry/plainspoken/lib/dates";
import { NextLink } from "@/registry/plainspoken/lib/next-link";
import { Breadcrumb, type Crumb } from "@/registry/plainspoken/ui/breadcrumb";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface BlogPostHeaderProps {
  title: string;
  /** Publication date, YYYY-MM-DD */
  date: string;
  /** Last real change, YYYY-MM-DD, when there was one */
  updated?: string;
  /** Reading time in minutes */
  minutes?: number;
  tags?: { label: string; href: string }[];
  /** The standfirst: one or two sentences under the title */
  summary?: ReactNode;
  /** Where the post sits: Home / Writing / this post. The last item is the post itself. */
  crumbs?: Crumb[];
  className?: string;
}

const long = (d: string) => formatDate(d, { day: "numeric", month: "long", year: "numeric" }, "en-GB");

/**
 * The head of a blog post: a breadcrumb back to the archive, the title as the page's h1, a
 * standfirst, and a line of facts (date, reading time, tags) with symbols. Dates are <time>
 * elements, so feed readers and search engines read them exactly.
 */
export function BlogPostHeader({ title, date, updated, minutes, tags, summary, crumbs, className }: BlogPostHeaderProps) {
  return (
    <header data-slot="blog-post-header" className={cn("flex flex-col gap-3 border-b border-border pb-5", className)}>
      {crumbs && crumbs.length > 0 && <Breadcrumb items={crumbs} linkAs={NextLink} className="text-[13px]" />}
      <h1 className="text-[28px] leading-tight font-bold text-balance sm:text-[32px]">{title}</h1>
      {summary != null && <p className="max-w-[60ch] text-[17px] leading-normal text-muted-foreground">{summary}</p>}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        <li className="inline-flex items-baseline gap-1">
          <Icon icon={CalendarDays} />
          <span>
            <span className="sr-only">Published </span>
            <time dateTime={date}>{long(date)}</time>
            {updated && (
              <>
                {", updated "}
                <time dateTime={updated}>{long(updated)}</time>
              </>
            )}
          </span>
        </li>
        {minutes != null && (
          <li className="inline-flex items-baseline gap-1">
            <Icon icon={Clock} />
            {minutes} min read
          </li>
        )}
        {tags && tags.length > 0 && (
          <li className="inline-flex items-baseline gap-1">
            <Icon icon={Tag} />
            <span className="sr-only">Tags: </span>
            <span className="flex flex-wrap gap-x-2">
              {tags.map((t) => (
                <Link key={t.href} href={t.href} rel="tag" className={linkVariants({ variant: "muted" })}>
                  #{t.label}
                </Link>
              ))}
            </span>
          </li>
        )}
      </ul>
    </header>
  );
}
