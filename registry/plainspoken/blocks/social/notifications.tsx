"use client";

import Link from "next/link";
import { AtSign, Heart, MessageCircle, Repeat2, Settings, UserPlus, type Glyph } from "@/registry/plainspoken/lib/icons";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { toast } from "@/registry/plainspoken/ui/toast";
import { useCompose } from "@/registry/plainspoken/blocks/social/composer";
import { PostCard } from "@/registry/plainspoken/blocks/social/post";
import { NOTIFICATIONS, agoMinutes, hrefFor, postById, userBy, type Notification, type NotificationKind } from "@/registry/plainspoken/blocks/social/data";
import { cn } from "@/lib/utils";

const KIND: Record<NotificationKind, { icon: Glyph; verb: string }> = {
  like: { icon: Heart, verb: "liked your post" },
  repost: { icon: Repeat2, verb: "reposted your post" },
  follow: { icon: UserPlus, verb: "followed you" },
  mention: { icon: AtSign, verb: "mentioned you" },
  reply: { icon: MessageCircle, verb: "replied to you" },
};

/** "Priya Raman, Mei Tanaka and 42 others" */
function names(n: Notification) {
  const people = n.who.map((h) => userBy(h).name);
  const others = n.others ?? 0;
  if (!others) return people.length > 1 ? `${people.slice(0, -1).join(", ")} and ${people.at(-1)}` : people[0];
  return `${people.join(", ")} and ${others} other${others === 1 ? "" : "s"}`;
}

/**
 * One grouped notification: what happened (an icon for the kind), the faces of who did it, a
 * sentence, and the post it is about, muted. Mentions and replies show the whole post instead.
 */
export function NotificationItem({ n }: { n: Notification }) {
  const compose = useCompose();
  const post = n.postId ? postById(n.postId) : undefined;
  if ((n.kind === "mention" || n.kind === "reply") && post) return <PostCard post={post} showReplyingTo onQuote={compose?.quote} />;
  const k = KIND[n.kind];
  const href = post ? hrefFor.post(post.id) : hrefFor.user(n.who[0]);
  return (
    <article className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-2.5 border-b border-border px-3 py-2.5 hover:bg-muted/60">
      <Icon icon={k.icon} size={22} className={cn("justify-self-end", n.kind === "like" && "fill-current")} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {n.who.length > 1 ? (
            <AvatarGroup label="Who" max={5} size={28}>
              {n.who.map((h) => (
                <Avatar key={h} name={userBy(h).name} />
              ))}
            </AvatarGroup>
          ) : (
            <Avatar name={userBy(n.who[0]).name} size={28} />
          )}
          <time className="text-[13px] text-muted-foreground tabular-nums">{agoMinutes(n.minutesAgo)}</time>
        </div>
        <p>
          <Link href={hrefFor.user(n.who[0])} className="font-bold text-foreground no-underline visited:text-foreground hover:underline">
            {names(n)}
          </Link>{" "}
          {k.verb}
        </p>
        {post && (
          <Link href={href} className="line-clamp-3 text-muted-foreground no-underline visited:text-muted-foreground hover:text-foreground">
            {post.text}
          </Link>
        )}
      </div>
    </article>
  );
}

const DAY = 24 * 60;
const GROUPS: [string, (n: Notification) => boolean][] = [
  ["Today", (n) => n.minutesAgo < DAY],
  ["Yesterday", (n) => n.minutesAgo >= DAY && n.minutesAgo < 2 * DAY],
  ["Earlier this week", (n) => n.minutesAgo >= 2 * DAY],
];

function Grouped({ items }: { items: Notification[] }) {
  if (!items.length) return <EmptyState icon={AtSign} title="Nothing yet" description="When someone mentions you, you'll find it here." />;
  return (
    <>
      {GROUPS.map(([title, test]) => {
        const group = items.filter(test);
        if (!group.length) return null;
        return (
          <section key={title} aria-labelledby={`n-${title}`}>
            <h2 id={`n-${title}`} className="border-b border-border bg-muted px-3 py-1 text-[13px] font-bold">
              {title}
            </h2>
            <ul>
              {group.map((n) => (
                <li key={n.id}>
                  <NotificationItem n={n} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

/** Notifications in two tabs, All and Mentions, grouped by day: likes and reposts bundled by post, follows by day */
export function NotificationList({ notifications = NOTIFICATIONS }: { notifications?: Notification[] }) {
  const mentions = notifications.filter((n) => n.kind === "mention" || n.kind === "reply");
  return (
    <Tabs
      label="Notifications"
      variant="plain"
      size="lg"
      className="[&>[role=tablist]]:px-3 [&>[role=tablist]>button]:flex-1 [&>[role=tablist]>button]:justify-center"
      panelClassName="pt-0"
      tabs={[
        { id: "all", label: "All", content: <Grouped items={notifications} /> },
        { id: "mentions", label: "Mentions", count: mentions.length, content: <Grouped items={mentions} /> },
      ]}
    />
  );
}

/** The settings button for the notifications page's header */
export function NotificationSettings() {
  return <IconButton variant="ghost" icon={Settings} label="Notification settings" onClick={() => toast("Notification settings are not in this demo")} />;
}
