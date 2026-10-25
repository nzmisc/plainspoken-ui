import type { ReactNode } from "react";
import { formatDate } from "@/registry/plainspoken/lib/dates";
import { Panel } from "@/registry/plainspoken/ui/panel";

export interface BlogNowProps {
  /** What you're doing these days, one thing per item */
  items: ReactNode[];
  /** When you last changed the list (YYYY-MM-DD) */
  updated: string;
  /** The box's heading. Default "Now". */
  title?: string;
  /** The heading level, to fit the page's outline. Default h2. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * A "now" box, the personal-site habit of saying what you're up to at the moment (work, reading,
 * training), with the date it was last true. A Panel with a bulleted list: small enough for a side
 * column, plain enough to keep up to date.
 */
export function BlogNow({ items, updated, title = "Now", as = "h2", className }: BlogNowProps) {
  return (
    <Panel
      title={title}
      as={as}
      meta={
        <>
          updated{" "}
          <time dateTime={updated}>{formatDate(updated, { day: "numeric", month: "long", year: "numeric" }, "en-GB")}</time>
        </>
      }
      className={className}
    >
      <ul className="flex list-disc flex-col gap-1 py-0.5 pl-5 marker:text-muted-foreground">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </Panel>
  );
}
