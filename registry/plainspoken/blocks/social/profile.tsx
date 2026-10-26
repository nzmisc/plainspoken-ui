"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, Bell, BellRing, CalendarDays, Ellipsis, Flag, Image as ImageIcon, Link2, Lock, MapPin, VolumeX } from "@/registry/plainspoken/lib/icons";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Field } from "@/registry/plainspoken/ui/field";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { TextLink } from "@/registry/plainspoken/ui/text-link";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { toast } from "@/registry/plainspoken/ui/toast";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { useCompose } from "@/registry/plainspoken/blocks/social/composer";
import { ProfileBanner } from "@/registry/plainspoken/blocks/social/media";
import { PostList, PostText } from "@/registry/plainspoken/blocks/social/post";
import { FollowButton, Verified } from "@/registry/plainspoken/blocks/social/user";
import { FOLLOWERS, ME, POSTS, compact, joinedDate, postsBy, userBy } from "@/registry/plainspoken/blocks/social/data";

function EditProfile({ open, onClose, handle }: { open: boolean; onClose: () => void; handle: string }) {
  const u = userBy(handle);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit profile"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              toast({ title: "Profile saved", description: "This is a demo: nothing was changed.", variant: "success" });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Name">
          <Input defaultValue={u.name} maxLength={50} />
        </Field>
        <Field label="Bio" hint="Up to 160 characters. #tags and @mentions become links.">
          <Textarea defaultValue={u.bio} maxLength={160} rows={3} />
        </Field>
        <Field label="Location">
          <Input defaultValue={u.location} prefix={MapPin} />
        </Field>
        <Field label="Website">
          <Input defaultValue={u.website} prefix="https://" />
        </Field>
      </div>
    </Dialog>
  );
}

/**
 * The top of a profile: a generated banner, the picture overlapping it, the name with its check,
 * the handle (and "Follows you"), the bio with live links, where they are, their website, when
 * they joined, and how many they follow and are followed by. Your own profile has "Edit profile"
 * (a dialog with the fields); others have notifications, follow and a ⋯ menu.
 */
export function ProfileHeader({ handle }: { handle: string }) {
  const u = userBy(handle);
  const mine = handle === ME;
  const [editing, setEditing] = useState(false);
  return (
    <section aria-label={`${u.name}'s profile`} className="border-b border-border">
      <ProfileBanner seed={handle} />
      <div className="flex flex-col gap-2 px-3 pb-3">
        <div className="flex items-end justify-between gap-2">
          <Avatar name={u.name} size={92} className="-mt-12 outline-4 outline-background" />
          <div className="ctl-md flex items-center gap-1.5 pt-2">
            {mine ? (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            ) : (
              <>
                <DropdownMenu
                  trigger={Ellipsis}
                  label="More"
                  triggerVariant="outline"
                  align="end"
                  items={[
                    { label: "Copy link to profile", icon: Link2, onSelect: () => toast("Link copied") },
                    { label: `Mute @${u.handle}`, icon: VolumeX, onSelect: () => toast(`Muted @${u.handle}`) },
                    { label: `Block @${u.handle}`, icon: Ban, onSelect: () => toast(`Blocked @${u.handle}`) },
                    { type: "separator" },
                    {
                      label: `Report @${u.handle}`,
                      icon: Flag,
                      destructive: true,
                      onSelect: () => toast({ title: "Thanks for telling us", variant: "success" }),
                    },
                  ]}
                />
                <Toggle variant="outline" icon={Bell} iconPressed={BellRing} label="Notify me of new posts" />
                <FollowButton handle={u.handle} size="md" />
              </>
            )}
          </div>
        </div>
        <div>
          <h2 className="flex items-center gap-1 text-[20px] leading-tight font-bold">
            {u.name}
            <Verified user={u} />
          </h2>
          <p className="text-muted-foreground">
            @{u.handle}
            {FOLLOWERS.includes(u.handle) && (
              <Badge className="ml-1.5" icon={false}>
                Follows you
              </Badge>
            )}
          </p>
        </div>
        <PostText text={u.bio} />
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted-foreground">
          {u.location && (
            <span className="inline-flex items-center gap-1">
              <Icon icon={MapPin} />
              {u.location}
            </span>
          )}
          {u.website && (
            <span className="inline-flex items-center gap-1">
              <Icon icon={Link2} />
              <TextLink href={`https://${u.website}`} external>
                {u.website}
              </TextLink>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Icon icon={CalendarDays} />
            Joined {joinedDate(u.joined)}
          </span>
        </p>
        <p className="flex gap-4 text-[14px]">
          <Link href="#" className="text-muted-foreground no-underline visited:text-muted-foreground hover:underline">
            <b className="text-foreground tabular-nums">{compact(u.following)}</b> Following
          </Link>
          <Link href="#" className="text-muted-foreground no-underline visited:text-muted-foreground hover:underline">
            <b className="text-foreground tabular-nums">{compact(u.followers)}</b> Followers
          </Link>
        </p>
      </div>
      {mine && <EditProfile open={editing} onClose={() => setEditing(false)} handle={handle} />}
    </section>
  );
}

/**
 * A profile's posts in four tabs: Posts (the pinned one first), Replies, Media (posts with
 * pictures) and Likes (yours only: other people's likes are private).
 */
export function ProfileTabs({ handle }: { handle: string }) {
  const compose = useCompose();
  const mine = handle === ME;
  const all = postsBy(handle);
  const posts = all.filter((p) => !p.replyTo).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  const replies = all.filter((p) => p.replyTo);
  const media = all.filter((p) => p.image);
  const likes = mine ? POSTS.filter((p) => p.liked) : [];
  const u = userBy(handle);
  return (
    <Tabs
      label={`${u.name}'s posts`}
      variant="plain"
      size="lg"
      className="[&>[role=tablist]]:px-3 [&>[role=tablist]>button]:flex-1 [&>[role=tablist]>button]:justify-center"
      panelClassName="pt-0"
      tabs={[
        { id: "posts", label: "Posts", content: <PostList posts={posts} onQuote={compose?.quote} empty={<EmptyState title={`@${handle} hasn't posted`} />} /> },
        { id: "replies", label: "Replies", content: <PostList posts={replies} onQuote={compose?.quote} empty={<EmptyState title="No replies yet" />} /> },
        {
          id: "media",
          label: "Media",
          content: (
            <PostList
              posts={media}
              onQuote={compose?.quote}
              empty={<EmptyState icon={ImageIcon} title="No pictures yet" description="Posts with pictures show up here." />}
            />
          ),
        },
        {
          id: "likes",
          label: "Likes",
          content: mine ? (
            <PostList posts={likes} onQuote={compose?.quote} />
          ) : (
            <EmptyState icon={Lock} title="Likes are private" description="Only the person who liked a post can see their likes." />
          ),
        },
      ]}
    />
  );
}
