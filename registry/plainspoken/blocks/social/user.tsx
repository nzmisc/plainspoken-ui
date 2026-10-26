"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BadgeCheck } from "@/registry/plainspoken/lib/icons";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { HoverCard, HoverCardActions, HoverCardFacts } from "@/registry/plainspoken/ui/hover-card";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { FOLLOWERS, FOLLOWING, ME, compact, hrefFor, joinedDate, userBy, type User } from "@/registry/plainspoken/blocks/social/data";
import { cn } from "@/lib/utils";

const NAME_LINK = "font-bold text-foreground no-underline visited:text-foreground hover:underline";

/** The blue-tick equivalent, drawn as a plain check badge with its meaning in words for screen readers */
export function Verified({ user }: { user: User }) {
  if (!user.verified) return null;
  return <Icon icon={BadgeCheck} label={user.org ? "Verified organisation" : "Verified account"} className="shrink-0" />;
}

export interface FollowButtonProps {
  handle: string;
  size?: ControlSize;
  className?: string;
}

/**
 * Follow and unfollow: the main colour while you don't follow someone, a quiet outline once you
 * do, and the word on it says which. A toggle (aria-pressed), so screen readers hear the state.
 * Not shown for yourself.
 */
export function FollowButton({ handle, size = "sm", className }: FollowButtonProps) {
  const [on, setOn] = useState(FOLLOWING.includes(handle));
  if (handle === ME) return null;
  return (
    <Button size={size} variant={on ? "outline" : "primary"} aria-pressed={on} onClick={() => setOn(!on)} className={cn("min-w-[5.5rem]", className)}>
      {on ? "Following" : "Follow"}
    </Button>
  );
}

/** A profile in brief, for a hover card: picture, name, handle, bio, counts, follow */
export function ProfileSummary({ handle }: { handle: string }) {
  const u = userBy(handle);
  return (
    <>
      <span className="flex items-start gap-3 px-3 pt-3">
        <Avatar name={u.name} size={48} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1">
            <Link href={hrefFor.user(u.handle)} className={NAME_LINK}>
              {u.name}
            </Link>
            <Verified user={u} />
          </span>
          <span className="text-muted-foreground">
            @{u.handle}
            {FOLLOWERS.includes(u.handle) && (
              <Badge className="ml-1.5" icon={false}>
                Follows you
              </Badge>
            )}
          </span>
        </span>
      </span>
      <span className="block px-3 pt-2">{u.bio}</span>
      <HoverCardFacts
        rows={[
          [
            "Following",
            <span key="a" className="tabular-nums">
              {compact(u.following)}
            </span>,
          ],
          [
            "Followers",
            <span key="b" className="tabular-nums">
              {compact(u.followers)}
            </span>,
          ],
          ["Joined", joinedDate(u.joined)],
        ]}
      />
      <HoverCardActions>
        <Link href={hrefFor.user(u.handle)} className="text-link underline visited:text-link-visited">
          View profile
        </Link>
        <FollowButton handle={u.handle} className="ml-auto" />
      </HoverCardActions>
    </>
  );
}

/**
 * A person's name, linked to their profile, with their profile in a hover card: hover it (or Tab
 * to it, then Tab into the card) to see the bio, the counts and a follow button. On touch, the
 * first tap opens the card.
 */
export function UserName({ handle, children, className }: { handle: string; children?: ReactNode; className?: string }) {
  const u = userBy(handle);
  return (
    <HoverCard label={`${u.name}'s profile`} card={<ProfileSummary handle={handle} />}>
      <Link href={hrefFor.user(handle)} className={cn(NAME_LINK, "truncate", className)}>
        {children ?? u.name}
      </Link>
    </HoverCard>
  );
}

/** One person in a list: picture, name with their hover card, handle, an optional bio, and a follow button */
export function UserRow({ handle, bio = false, className }: { handle: string; bio?: boolean; className?: string }) {
  const u = userBy(handle);
  return (
    <li className={cn("flex items-start gap-2.5 px-3 py-2", className)}>
      <Link href={hrefFor.user(handle)} tabIndex={-1} aria-hidden>
        <Avatar name={u.name} size={36} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="flex min-w-0 items-center gap-1">
          <UserName handle={handle} />
          <Verified user={u} />
        </span>
        <span className="truncate text-[13px] text-muted-foreground">
          @{u.handle}
          {FOLLOWERS.includes(u.handle) && (
            <Badge className="ml-1.5" icon={false}>
              Follows you
            </Badge>
          )}
        </span>
        {bio && <span className="mt-0.5 line-clamp-2 text-[13px]">{u.bio}</span>}
      </div>
      <FollowButton handle={handle} />
    </li>
  );
}

/** "Who to follow": a titled panel of people with follow buttons, and a link to more */
export function WhoToFollow({
  handles,
  title = "Who to follow",
  bio = false,
  moreHref,
  className,
}: {
  handles: string[];
  title?: string;
  bio?: boolean;
  moreHref?: string;
  className?: string;
}) {
  return (
    <Panel title={title} flush className={className}>
      <ul className="divide-y divide-border">
        {handles.map((h) => (
          <UserRow key={h} handle={h} bio={bio} />
        ))}
      </ul>
      {moreHref && (
        <div className="border-t border-border px-3 py-1.5 text-[13px]">
          <Link href={moreHref} className="text-link underline visited:text-link-visited">
            Show more
          </Link>
        </div>
      )}
    </Panel>
  );
}
