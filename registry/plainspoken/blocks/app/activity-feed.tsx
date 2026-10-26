import Link from "next/link";
import { APP_NOW, ACTIVITY, type ActivityItem } from "@/registry/plainspoken/blocks/app/data";
import { ms } from "@/registry/plainspoken/blocks/app/format";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

export interface AppActivityFeedProps {
  items?: ActivityItem[];
  /** The demo's clock, for "2h ago" */
  now?: string;
  title?: string;
  className?: string;
}

/**
 * What happened lately, newest first, in a panel: who did what to which invoice, project or
 * customer, as a sentence with a link, and how long ago. Payments and people get avatars.
 */
export function AppActivityFeed({ items = ACTIVITY, now = APP_NOW, title = "Recent activity", className }: AppActivityFeedProps) {
  return (
    <Panel title={title} flush className={className}>
      <ol className="divide-y divide-border">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-2.5 px-2 py-1.5">
            <Avatar name={a.who} size={24} />
            <p className="min-w-0 flex-1 text-[14px] leading-snug">
              <b className="font-semibold">{a.who}</b> {a.what}{" "}
              {a.href ? (
                <Link href={a.href} className={linkVariants()}>
                  {a.target}
                </Link>
              ) : (
                a.target
              )}
            </p>
            <RelativeTime date={ms(a.when)} now={ms(now)} format="long" locale="en-GB" className="shrink-0 text-[12px] text-muted-foreground" />
          </li>
        ))}
      </ol>
    </Panel>
  );
}
