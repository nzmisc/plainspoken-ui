"use client";

import { Users } from "@/registry/plainspoken/lib/icons";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { Composer, useCompose } from "@/registry/plainspoken/blocks/social/composer";
import { PostList } from "@/registry/plainspoken/blocks/social/post";
import { followingTimeline, forYou, type Post } from "@/registry/plainspoken/blocks/social/data";

export interface TimelineProps {
  /** Posts for the "For you" tab; default: every post that isn't a reply */
  forYouPosts?: Post[];
  /** Posts for "Following"; default: posts from the accounts you follow */
  followingPosts?: Post[];
  defaultTab?: "for-you" | "following";
}

/**
 * The home timeline: two tabs, For you and Following, in a strip that stays at the top while the
 * posts scroll, the composer, then the posts newest first. Arrow keys move between the tabs.
 */
export function Timeline({ forYouPosts = forYou(), followingPosts = followingTimeline(), defaultTab = "for-you" }: TimelineProps) {
  const compose = useCompose();
  const list = (posts: Post[]) => (
    <>
      <Composer className="border-b border-border" />
      <PostList
        posts={posts}
        onQuote={compose?.quote}
        empty={<EmptyState icon={Users} title="Nothing here yet" description="Follow some people and their posts show up here." />}
      />
    </>
  );
  return (
    <Tabs
      label="Timeline"
      variant="plain"
      size="lg"
      defaultValue={defaultTab}
      className="[&>[role=tablist]]:sticky [&>[role=tablist]]:top-(--demo-bar,0px) [&>[role=tablist]]:z-10 [&>[role=tablist]]:bg-background [&>[role=tablist]]:px-3 [&>[role=tablist]>button]:flex-1 [&>[role=tablist]>button]:justify-center"
      panelClassName="pt-0"
      tabs={[
        { id: "for-you", label: "For you", content: list(forYouPosts) },
        { id: "following", label: "Following", content: list(followingPosts) },
      ]}
    />
  );
}
