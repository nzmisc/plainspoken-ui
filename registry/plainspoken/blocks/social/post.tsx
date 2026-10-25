"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState, type MouseEvent, type ReactNode } from "react";
import {
  Ban,
  Bookmark,
  ChartNoAxesColumn,
  Check,
  Ellipsis,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  Pin,
  Quote,
  Repeat2,
  Share,
  ThumbsDown,
  Trash,
  VolumeX,
} from "@/registry/plainspoken/lib/icons";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button, buttonVariants } from "@/registry/plainspoken/ui/button";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { linkVariants, TextLink } from "@/registry/plainspoken/ui/text-link";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";
import { toast } from "@/registry/plainspoken/ui/toast";
import { PostImage } from "@/registry/plainspoken/blocks/social/media";
import { UserName, Verified } from "@/registry/plainspoken/blocks/social/user";
import { ME, compact, findUser, fullTime, hrefFor, postById, shortTime, userBy, type Poll, type Post } from "@/registry/plainspoken/blocks/social/data";
import { cn } from "@/lib/utils";

// -------------------------------------------------------------------------------------------------
// Text

const TOKEN = /(https?:\/\/[^\s]+[^\s.,!?)]|#[\p{L}\p{N}_]+|@[a-z0-9_]+)/giu;

/**
 * A post's words with its links made real: #tags go to a search for the tag, @mentions to the
 * person's profile, and web addresses open in a new tab (shown without the https://). Line breaks
 * are kept.
 */
export function PostText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(TOKEN);
  return (
    <p className={cn("break-words whitespace-pre-line", className)}>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        if (part.startsWith("#"))
          return (
            <Link key={i} href={hrefFor.search(part)} className={linkVariants()} onClick={(e) => e.stopPropagation()}>
              {part}
            </Link>
          );
        if (part.startsWith("@")) {
          const u = findUser(part.slice(1).toLowerCase());
          return u ? (
            <Link key={i} href={hrefFor.user(u.handle)} className={linkVariants()} onClick={(e) => e.stopPropagation()}>
              {part}
            </Link>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          );
        }
        return (
          <TextLink key={i} href={part} external onClick={(e) => e.stopPropagation()} className="break-all">
            {part.replace(/^https?:\/\//, "")}
          </TextLink>
        );
      })}
    </p>
  );
}

// -------------------------------------------------------------------------------------------------
// Poll

/**
 * A poll in a post: buttons to vote while it is open and you haven't, then the results as bars
 * with percentages, your choice marked with a check and in bold. The total and the time left
 * underneath.
 */
export function PostPoll({ poll, className }: { poll: Poll; className?: string }) {
  const [voted, setVoted] = useState(poll.voted);
  const closed = poll.status === "Final results";
  const total = poll.options.reduce((s, o) => s + o.votes, 0) + (voted != null && poll.voted == null ? 1 : 0);
  const showResults = closed || voted != null;
  const top = Math.max(...poll.options.map((o) => o.votes));
  return (
    <div data-slot="social-poll" className={cn("flex flex-col gap-1.5", className)} onClick={(e) => e.stopPropagation()}>
      {showResults ? (
        <ul className="flex flex-col gap-1">
          {poll.options.map((o, i) => {
            const votes = o.votes + (voted === i && poll.voted == null ? 1 : 0);
            return (
              <li key={o.label} className="flex flex-col">
                <span className={cn("flex items-center gap-1 text-[14px]", (o.votes === top || voted === i) && "font-semibold")}>
                  {o.label}
                  {voted === i && <Icon icon={Check} label="your vote" />}
                </span>
                <Progress value={votes} max={total} label={`${o.label}: ${Math.round((votes / total) * 100)}%`} />
              </li>
            );
          })}
        </ul>
      ) : (
        <div role="group" aria-label="Vote" className="flex flex-col gap-1.5">
          {poll.options.map((o, i) => (
            <Button key={o.label} variant="outline" block onClick={() => setVoted(i)} className="justify-start">
              {o.label}
            </Button>
          ))}
        </div>
      )}
      <p className="text-[13px] text-muted-foreground">
        {compact(total)} votes · {poll.status}
      </p>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// Quoted post

/** Another post inside this one: a bordered, smaller copy that links to the original */
export function QuotedPost({ id, className }: { id: string; className?: string }) {
  const q = postById(id);
  if (!q) return null;
  const u = userBy(q.author);
  return (
    <Link
      href={hrefFor.post(q.id)}
      onClick={(e) => e.stopPropagation()}
      className={cn("block border border-border p-2.5 text-foreground no-underline visited:text-foreground hover:bg-secondary", className)}
    >
      <span className="flex items-center gap-1.5 text-[13px]">
        <Avatar name={u.name} size={20} />
        <b className="truncate">{u.name}</b>
        <Verified user={u} />
        <span className="truncate text-muted-foreground">
          @{u.handle} · {shortTime(q.at)}
        </span>
      </span>
      <span className="mt-1 line-clamp-4 block">{q.text}</span>
      {q.image && <PostImage {...q.image} className="mt-2" />}
    </Link>
  );
}

// -------------------------------------------------------------------------------------------------
// Actions

const ACTION = "text-muted-foreground font-normal hover:text-foreground aria-pressed:text-foreground";

/** The count after an action's icon: shown compact, said in full */
const Count = ({ n }: { n: number }) => (n > 0 ? <span className="tabular-nums">{compact(n)}</span> : null);

function copyLink(id: string) {
  navigator.clipboard?.writeText(`${location.origin}${hrefFor.post(id)}`).then(
    () => toast("Link copied"),
    () => toast({ title: "Couldn't copy the link", variant: "warning" }),
  );
}

export interface PostActionsProps {
  post: Post;
  /** Bigger buttons and no counts (the post's own page shows the counts above) */
  large?: boolean;
  /** "Quote" in the repost menu calls this with the post */
  onQuote?: (post: Post) => void;
  className?: string;
}

/**
 * Reply, repost (a menu: repost or quote), like, views, bookmark and share. Like and bookmark are
 * toggle buttons; the counts are written out for screen readers ("Like, 248"). Each button's name
 * says what it does, the icon alone does not have to.
 */
export function PostActions({ post, large = false, onQuote, className }: PostActionsProps) {
  const size = large ? "md" : "sm";
  const [reposted, setReposted] = useState(!!post.reposted);
  return (
    <div
      role="group"
      aria-label="Post actions"
      className={cn("flex items-center justify-between gap-1", large ? "ctl-md" : "ctl-sm -ml-2", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        href={hrefFor.post(post.id)}
        aria-label={`Reply, ${post.replies} replies`}
        title="Reply"
        className={cn(buttonVariants({ variant: "ghost", size }), ACTION)}
      >
        <Icon icon={MessageCircle} />
        {!large && <Count n={post.replies} />}
      </Link>
      <DropdownMenu
        label="Repost"
        size={size}
        items={[
          { label: reposted ? "Undo repost" : "Repost", icon: Repeat2, onSelect: () => setReposted(!reposted) },
          { label: "Quote", icon: Quote, onSelect: () => onQuote?.(post), disabled: !onQuote },
        ]}
        trigger={(props) => (
          <Button
            {...props}
            variant="ghost"
            size={size}
            icon={Repeat2}
            aria-label={`Repost, ${post.reposts} reposts${reposted ? ", you reposted" : ""}`}
            title="Repost"
            className={cn(ACTION, reposted && "font-bold text-foreground")}
          >
            {!large && <Count n={post.reposts} />}
          </Button>
        )}
      />
      <Toggle
        variant="ghost"
        size={size}
        defaultPressed={post.liked}
        icon={Heart}
        iconPressed={<Icon icon={Heart} className="fill-current" />}
        aria-label={`Like, ${post.likes} likes`}
        title="Like"
        className={cn(ACTION, "aria-pressed:border-transparent aria-pressed:bg-transparent aria-pressed:hover:bg-secondary")}
      >
        {large ? null : <Count n={post.likes} />}
      </Toggle>
      <Tooltip content={`${post.views.toLocaleString("en-US")} views`}>
        <span tabIndex={0} className={cn("inline-flex items-center gap-1 text-[13px] text-muted-foreground", large && "max-sm:hidden")}>
          <Icon icon={ChartNoAxesColumn} label="Views" />
          <Count n={post.views} />
        </span>
      </Tooltip>
      <span className="flex items-center">
        <Toggle
          variant="ghost"
          size={size}
          defaultPressed={post.bookmarked}
          label="Bookmark"
          icon={Bookmark}
          iconPressed={<Icon icon={Bookmark} className="fill-current" />}
          className={cn(ACTION, "aria-pressed:border-transparent aria-pressed:bg-transparent aria-pressed:hover:bg-secondary")}
        />
        <DropdownMenu
          trigger={Share}
          label="Share"
          triggerVariant="ghost"
          size={size}
          align="end"
          triggerClassName={ACTION}
          items={[
            { label: "Copy link", icon: Link2, onSelect: () => copyLink(post.id) },
            { label: "Send in a direct message", icon: MessageCircle, disabled: true, hint: "Not in this demo" },
          ]}
        />
      </span>
    </div>
  );
}

/** The ⋯ menu of a post: for others' posts, not interested, mute, block, report; for yours, pin and delete */
export function PostMenu({ post, className }: { post: Post; className?: string }) {
  const u = userBy(post.author);
  const mine = post.author === ME;
  const items: MenuItem[] = mine
    ? [
        {
          label: post.pinned ? "Unpin from profile" : "Pin to your profile",
          icon: Pin,
          onSelect: () => toast(post.pinned ? "Unpinned" : "Pinned to your profile"),
        },
        { label: "Copy link", icon: Link2, onSelect: () => copyLink(post.id) },
        { type: "separator" },
        { label: "Delete", icon: Trash, destructive: true, onSelect: () => toast({ title: "Deleting is switched off in this demo", variant: "info" }) },
      ]
    : [
        { label: "Not interested in this post", icon: ThumbsDown, onSelect: () => toast("We'll show you fewer posts like this") },
        { label: `Mute @${u.handle}`, icon: VolumeX, onSelect: () => toast(`Muted @${u.handle}`) },
        { label: `Block @${u.handle}`, icon: Ban, onSelect: () => toast(`Blocked @${u.handle}`) },
        { label: "Copy link", icon: Link2, onSelect: () => copyLink(post.id) },
        { type: "separator" },
        { label: "Report post", icon: Flag, destructive: true, onSelect: () => toast({ title: "Thanks. We'll look at this post.", variant: "success" }) },
      ];
  return (
    <span onClick={(e) => e.stopPropagation()} className={className}>
      <DropdownMenu trigger={Ellipsis} label="More" triggerVariant="ghost" size="sm" align="end" items={items} triggerClassName="text-muted-foreground" />
    </span>
  );
}

// -------------------------------------------------------------------------------------------------
// The post

export interface PostCardProps {
  post: Post;
  /** Draw a line down from the avatar to the next post: the rest of a thread follows */
  threadLine?: boolean;
  /** Say whom this replies to, above the text (when the post above isn't shown) */
  showReplyingTo?: boolean;
  onQuote?: (post: Post) => void;
  className?: string;
}

/** Click anywhere on a post that isn't a link or button (and isn't a text selection) to open it */
function useOpenOnClick(id: string) {
  const router = useRouter();
  return (e: MouseEvent) => {
    if ((e.target as Element).closest("a, button, input, label, [role=dialog], [data-slot=floating]")) return;
    if (window.getSelection()?.toString()) return;
    router.push(hrefFor.post(id));
  };
}

/**
 * A post in a timeline: the author's picture, name (with their profile on hover), handle and how
 * long ago; the text with live links; a picture, a poll or a quoted post; and the actions. The
 * time links to the post's page, and so does a click anywhere on the post that isn't a link or a
 * button. Pinned posts say so.
 */
export function PostCard({ post, threadLine = false, showReplyingTo = false, onQuote, className }: PostCardProps) {
  const u = userBy(post.author);
  const open = useOpenOnClick(post.id);
  const parent = showReplyingTo && post.replyTo ? postById(post.replyTo) : undefined;
  return (
    <article
      data-slot="social-post"
      aria-labelledby={`post-${post.id}-by`}
      onClick={open}
      className={cn(
        "grid cursor-pointer grid-cols-[40px_minmax(0,1fr)] gap-x-2.5 px-3 pt-2.5 hover:bg-muted/60",
        !threadLine && "border-b border-border",
        className,
      )}
    >
      {post.pinned && (
        <p className="col-start-2 -mb-0.5 flex items-center gap-1 text-[12px] font-semibold text-muted-foreground">
          <Icon icon={Pin} />
          Pinned
        </p>
      )}
      <div className="row-span-5 flex flex-col items-center">
        <Link href={hrefFor.user(u.handle)} tabIndex={-1} aria-hidden onClick={(e) => e.stopPropagation()}>
          <Avatar name={u.name} size={40} />
        </Link>
        {threadLine && <span aria-hidden className="mt-1 w-0.5 flex-1 bg-border" />}
      </div>
      <header className="flex min-w-0 items-center gap-1 text-[14px]">
        <span id={`post-${post.id}-by`} className="flex min-w-0 items-center gap-1">
          <UserName handle={u.handle} />
          <Verified user={u} />
        </span>
        <span className="truncate text-muted-foreground">@{u.handle}</span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <Link
          href={hrefFor.post(post.id)}
          title={fullTime(post.at)}
          className="shrink-0 text-muted-foreground no-underline visited:text-muted-foreground hover:underline"
        >
          <time dateTime={post.at}>{shortTime(post.at)}</time>
        </Link>
        <PostMenu post={post} className="-my-1 ml-auto shrink-0" />
      </header>
      {parent && (
        <p className="text-[13px] text-muted-foreground">
          Replying to{" "}
          <Link href={hrefFor.user(parent.author)} className={linkVariants()}>
            @{parent.author}
          </Link>
        </p>
      )}
      <div className="flex min-w-0 flex-col gap-2 pt-0.5">
        <PostText text={post.text} />
        {post.image && <PostImage {...post.image} />}
        {post.poll && <PostPoll poll={post.poll} />}
        {post.quoteOf && <QuotedPost id={post.quoteOf} />}
      </div>
      <PostActions post={post} onQuote={onQuote} className="py-1" />
    </article>
  );
}

/** The counts under a post on its own page: "12 Reposts  248 Likes  9 Bookmarks" */
function Stats({ post }: { post: Post }) {
  const items: [number, string][] = [
    [post.reposts, "Reposts"],
    [Math.round(post.reposts / 4), "Quotes"],
    [post.likes, "Likes"],
    [Math.round(post.likes / 12), "Bookmarks"],
  ];
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 border-y border-border py-2 text-[14px]">
      {items
        .filter(([n]) => n > 0)
        .map(([n, label]) => (
          <span key={label}>
            <b className="tabular-nums">{compact(n)}</b> <span className="text-muted-foreground">{label}</span>
          </span>
        ))}
    </p>
  );
}

/**
 * The post a page is about: bigger text, the full date and time, the views, the counts in words
 * and the actions at full size. Its name is the page's heading.
 */
export function FocalPost({ post, onQuote, className }: { post: Post; onQuote?: (post: Post) => void; className?: string }) {
  const u = userBy(post.author);
  return (
    <article
      data-slot="social-focal-post"
      aria-labelledby={`focal-${post.id}`}
      className={cn("flex flex-col gap-3 border-b border-border px-3 pt-3", className)}
    >
      <header className="flex items-center gap-2.5">
        <Link href={hrefFor.user(u.handle)} tabIndex={-1} aria-hidden>
          <Avatar name={u.name} size={44} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col leading-snug">
          <span id={`focal-${post.id}`} className="flex items-center gap-1">
            <UserName handle={u.handle} />
            <Verified user={u} />
          </span>
          <span className="text-muted-foreground">@{u.handle}</span>
        </div>
        <PostMenu post={post} />
      </header>
      <PostText text={post.text} className="text-[17px] leading-snug" />
      {post.image && <PostImage {...post.image} />}
      {post.poll && <PostPoll poll={post.poll} />}
      {post.quoteOf && <QuotedPost id={post.quoteOf} />}
      <p className="text-[14px] text-muted-foreground">
        <time dateTime={post.at}>{fullTime(post.at)}</time> · <b className="text-foreground tabular-nums">{compact(post.views)}</b> Views
      </p>
      <Stats post={post} />
      <PostActions post={post} large onQuote={onQuote} className="-mt-2 pb-1" />
    </article>
  );
}

/** A list of posts, each with its own line, that says how many there are to screen readers */
export function PostList({ posts, onQuote, empty, className }: { posts: Post[]; onQuote?: (post: Post) => void; empty?: ReactNode; className?: string }) {
  if (!posts.length) return <>{empty}</>;
  return (
    <ul className={className}>
      {posts.map((p) => (
        <li key={p.id}>
          <PostCard post={p} onQuote={onQuote} showReplyingTo={!!p.replyTo} />
        </li>
      ))}
    </ul>
  );
}
