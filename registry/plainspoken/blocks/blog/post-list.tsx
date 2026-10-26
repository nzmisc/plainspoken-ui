import Link from "next/link";
import { useId } from "react";
import { formatDate } from "@/registry/plainspoken/lib/dates";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface BlogPostListTag {
  label: string;
  href: string;
}

export interface BlogPostListItem {
  href: string;
  title: string;
  /** Publication date, YYYY-MM-DD */
  date: string;
  /** One or two sentences under the title */
  summary?: string;
  /** Reading time in minutes */
  minutes?: number;
  tags?: BlogPostListTag[];
}

export interface BlogPostListProps {
  posts: BlogPostListItem[];
  /** full: "12 Oct 2026"; short: "12 Oct", for lists already grouped by year. Default full. */
  dates?: "full" | "short";
  /** Show each post's summary. Default true. */
  summaries?: boolean;
  /** The level of each post title, to fit the page's outline. Default h3. */
  headingLevel?: 2 | 3 | 4;
  /** Said when there are no posts */
  empty?: string;
  className?: string;
}

const DATE_FORMAT = {
  full: { day: "numeric", month: "short", year: "numeric" },
  short: { day: "numeric", month: "short" },
} as const;

/**
 * A list of posts, newest first: the date in a column of its own (above the title on phones), the
 * title as a real link (purple once read), then the summary, reading time and tags. Each title is
 * a heading, so screen-reader users can jump from post to post.
 */
export function BlogPostList({ posts, dates = "full", summaries = true, headingLevel = 3, empty = "No posts yet.", className }: BlogPostListProps) {
  const H = `h${headingLevel}` as const;
  if (posts.length === 0) return <p className={cn("border-y border-border py-2 text-muted-foreground", className)}>{empty}</p>;
  return (
    <ul data-slot="blog-post-list" className={cn("border-t border-border", className)}>
      {posts.map((p) => (
        <li key={p.href} className="grid gap-x-4 gap-y-0.5 border-b border-border py-2.5 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
          <time dateTime={p.date} className="text-[13px] whitespace-nowrap text-muted-foreground tabular-nums sm:pt-0.5">
            {formatDate(p.date, DATE_FORMAT[dates], "en-GB")}
          </time>
          <div className="flex min-w-0 flex-col gap-0.5">
            <H className="text-[16px] leading-snug font-semibold">
              <Link href={p.href} className={linkVariants()}>
                {p.title}
              </Link>
            </H>
            {summaries && p.summary && <p>{p.summary}</p>}
            {(p.minutes != null || (p.tags && p.tags.length > 0)) && (
              <p className="flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
                {p.minutes != null && <span>{p.minutes} min read</span>}
                {p.tags?.map((t) => (
                  <Link key={t.href} href={t.href} className={linkVariants({ variant: "muted" })}>
                    #{t.label}
                  </Link>
                ))}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export interface BlogArchiveProps extends Omit<BlogPostListProps, "dates" | "headingLevel"> {
  /** The level of each year's heading. Post titles go one level below. Default h2. */
  headingLevel?: 2 | 3;
}

/** One year's section: its heading, how many posts, and the list. */
function YearSection({ year, posts, headingLevel, ...rest }: { year: string; posts: BlogPostListItem[]; headingLevel: 2 | 3 } & Omit<BlogPostListProps, "posts" | "dates" | "headingLevel">) {
  const id = useId();
  const H = `h${headingLevel}` as const;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1.5">
      <H id={id} className="flex items-baseline gap-2 text-[18px] font-bold tabular-nums">
        {year}
        <span className="text-[13px] font-normal text-muted-foreground">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
      </H>
      <BlogPostList posts={posts} dates="short" headingLevel={(headingLevel + 1) as 3 | 4} {...rest} />
    </section>
  );
}

/**
 * Every post, grouped by year under a heading per year (with its count), newest first. The dates
 * drop the year, since the heading says it.
 */
export function BlogArchive({ posts, headingLevel = 2, className, ...rest }: BlogArchiveProps) {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  const years = [...new Set(sorted.map((p) => p.date.slice(0, 4)))];
  if (sorted.length === 0) return <BlogPostList posts={[]} {...rest} className={className} />;
  return (
    <div data-slot="blog-archive" className={cn("flex flex-col gap-8", className)}>
      {years.map((y) => (
        <YearSection key={y} year={y} posts={sorted.filter((p) => p.date.startsWith(y))} headingLevel={headingLevel} {...rest} />
      ))}
    </div>
  );
}
