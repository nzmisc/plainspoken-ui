"use client";

import Link from "next/link";
import { Ellipsis, Flag, ThumbsDown } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { toast } from "@/registry/plainspoken/ui/toast";
import { SOCIAL_BASE, TRENDS, compact, hrefFor, type Trend } from "@/registry/plainspoken/blocks/social/data";
import { cn } from "@/lib/utils";

/**
 * What people are posting about: each trend's category ("Science · Trending"), the topic linked to
 * a search for it, and how many posts mention it, with a ⋯ menu to hide it. Numbered, since the
 * order is the ranking.
 */
export function TrendList({ trends = TRENDS, numbered = false, className }: { trends?: Trend[]; numbered?: boolean; className?: string }) {
  return (
    <ol className={cn("divide-y divide-border", className)}>
      {trends.map((t, i) => (
        <li key={t.topic} className="group relative flex items-start gap-2 px-3 py-2 hover:bg-secondary">
          <Link href={hrefFor.search(t.topic)} className={cn("flex min-w-0 flex-1 flex-col text-foreground no-underline visited:text-foreground", FOCUS_RING)}>
            <span className="text-[12px] text-muted-foreground">
              {numbered && <span className="tabular-nums">{i + 1} · </span>}
              {t.context}
            </span>
            <span className="truncate font-bold">{t.topic}</span>
            <span className="text-[12px] text-muted-foreground tabular-nums">{compact(t.posts)} posts</span>
          </Link>
          <DropdownMenu
            trigger={Ellipsis}
            label={`More about ${t.topic}`}
            triggerVariant="ghost"
            size="sm"
            align="end"
            triggerClassName="text-muted-foreground"
            items={[
              { label: "Not interested in this", icon: ThumbsDown, onSelect: () => toast(`You'll see less about ${t.topic}`) },
              { label: "This trend is spam or harmful", icon: Flag, onSelect: () => toast({ title: "Thanks for telling us", variant: "success" }) },
            ]}
          />
        </li>
      ))}
    </ol>
  );
}

/** "What's happening": the top trends in a titled panel for the side column, with a link to the rest */
export function TrendsPanel({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <Panel title="What's happening" flush className={className}>
      <TrendList trends={TRENDS.slice(0, count)} />
      <div className="border-t border-border px-3 py-1.5 text-[13px]">
        <Link href={`${SOCIAL_BASE}/explore`} className="text-link underline visited:text-link-visited">
          Show more
        </Link>
      </div>
    </Panel>
  );
}
