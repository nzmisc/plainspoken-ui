"use client";

import { Bell, CircleAlert, CircleCheck, MessageSquare, UserPlus, type Glyph } from "@/registry/plainspoken/lib/icons";
import { APP_NOW, NOTIFICATIONS, type AppNotification } from "@/registry/plainspoken/blocks/app/data";
import { ms } from "@/registry/plainspoken/blocks/app/format";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { cn } from "@/lib/utils";

const KIND: Record<AppNotification["kind"], { icon: Glyph; tone: string }> = {
  payment: { icon: CircleCheck, tone: "text-success" },
  overdue: { icon: CircleAlert, tone: "text-destructive" },
  comment: { icon: MessageSquare, tone: "text-muted-foreground" },
  invite: { icon: UserPlus, tone: "text-muted-foreground" },
};

export interface AppNotificationsProps {
  items?: AppNotification[];
  /** The demo's clock, for "2h ago" */
  now?: string;
  /** Where "All notification settings" goes */
  settingsHref?: string;
  /** Start open (stories, screenshots) */
  defaultOpen?: boolean;
}

/**
 * The bell in the top bar and its popover: payments, overdue invoices, comments and invites,
 * newest first, unread ones bold with a dot, each with how long ago. The bell's name says how
 * many are unread ("Notifications, 3 unread"), and a square on it shows it too.
 */
export function AppNotifications({ items = NOTIFICATIONS, now = APP_NOW, settingsHref = "/demos/app/settings", defaultOpen }: AppNotificationsProps) {
  const unread = items.filter((n) => n.unread).length;
  const label = unread ? `Notifications, ${unread} unread` : "Notifications";
  return (
    <Popover
      label={label}
      title="Notifications"
      align="end"
      defaultOpen={defaultOpen}
      className="w-[22rem] max-w-[calc(100vw-1rem)]"
      bodyClassName="p-0"
      trigger={(props) => (
        <span className="relative inline-flex">
          <IconButton {...props} variant="ghost" icon={Bell} label={label} />
          {unread > 0 && <span aria-hidden className="pointer-events-none absolute top-1 right-1 size-2 border border-background bg-destructive" />}
        </span>
      )}
    >
      <ul className="max-h-96 divide-y divide-border overflow-y-auto">
        {items.map((n) => {
          const k = KIND[n.kind];
          return (
            <li key={n.id} className={cn("flex gap-2.5 px-3 py-2", n.unread && "bg-muted")}>
              <Icon icon={k.icon} className={cn("mt-[0.2em]", k.tone)} />
              <div className="min-w-0 flex-1">
                <p className={cn("flex items-baseline justify-between gap-2", n.unread && "font-semibold")}>
                  <span>
                    {n.unread && <span className="sr-only">Unread: </span>}
                    {n.title}
                  </span>
                  <RelativeTime date={ms(n.when)} now={ms(now)} format="long" locale="en-GB" className="shrink-0 text-[12px] font-normal text-muted-foreground" />
                </p>
                <p className="text-[13px] text-muted-foreground">{n.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-border bg-muted px-3 py-1.5 text-[13px]">
        <a href={settingsHref} className="text-link underline visited:text-link-visited">
          Notification settings
        </a>
      </p>
    </Popover>
  );
}
