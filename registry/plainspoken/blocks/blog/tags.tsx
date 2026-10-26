import Link from "next/link";
import { FOCUS_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

export interface BlogTag {
  label: string;
  href: string;
  /** How many posts carry it */
  count?: number;
}

export interface BlogTagsProps {
  tags: BlogTag[];
  /** The label of the tag whose page this is: drawn filled, with aria-current */
  current?: string;
  /** Accessible name of the navigation landmark. Default "Tags". */
  label?: string;
  /** Height of each tag, from the shared scale. Default sm. */
  size?: ControlSize;
  className?: string;
}

/**
 * Every tag as a link with its post count, in boxes at control height that wrap onto more lines.
 * Looks like a row of chips, but each is a plain link to the tag's page, so it works without
 * script and search engines follow it. The current tag is filled.
 */
export function BlogTags({ tags, current, label = "Tags", size = "sm", className }: BlogTagsProps) {
  return (
    <nav aria-label={label} data-slot="blog-tags" className={cn(controlSize(size), className)}>
      <ul className="flex flex-wrap gap-1.5">
        {tags.map((t) => {
          const on = t.label === current;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex h-(--ctl-h) items-center gap-1.5 border px-(--ctl-px) text-(length:--ctl-text) leading-none whitespace-nowrap no-underline",
                  FOCUS_RING,
                  on
                    ? "border-foreground bg-foreground text-background visited:text-background"
                    : "border-border bg-background text-foreground visited:text-foreground hover:bg-secondary",
                )}
              >
                #{t.label}
                {t.count != null && (
                  <span className={cn("tabular-nums", on ? "opacity-80" : "text-muted-foreground")}>
                    <span className="sr-only">, </span>
                    {t.count}
                    <span className="sr-only"> {t.count === 1 ? "post" : "posts"}</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
