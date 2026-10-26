"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "@/registry/plainspoken/lib/icons";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { SearchBox } from "@/registry/plainspoken/blocks/social/app-shell";
import { useCompose } from "@/registry/plainspoken/blocks/social/composer";
import { PostList } from "@/registry/plainspoken/blocks/social/post";
import { TrendList } from "@/registry/plainspoken/blocks/social/trends";
import { UserRow, WhoToFollow } from "@/registry/plainspoken/blocks/social/user";
import { ME, POSTS, USERS, suggestions, topLevel } from "@/registry/plainspoken/blocks/social/data";

const TABS_LOOK = "[&>[role=tablist]]:px-3 [&>[role=tablist]>button]:flex-1 [&>[role=tablist]>button]:justify-center";

/**
 * Explore: a search box, and under it either what's trending (numbered), the most liked posts and
 * people to follow, or, with ?q= in the address, the posts and people that match. Reads the
 * address, so it needs a <Suspense> around it.
 */
export function Explore() {
  const q = (useSearchParams().get("q") ?? "").trim();
  const compose = useCompose();
  const needle = q.toLowerCase();
  const posts = needle ? POSTS.filter((p) => p.text.toLowerCase().includes(needle)) : [];
  const people = needle ? USERS.filter((u) => u.handle !== ME && `${u.name} ${u.handle} ${u.bio}`.toLowerCase().includes(needle.replace(/^@/, ""))) : [];
  const popular = [...POSTS]
    .filter(topLevel)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 8);
  return (
    <div data-slot="social-explore">
      <div className="sticky top-(--demo-bar,0px) z-20 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm">
        <h1 className="sr-only">{q ? `Search: ${q}` : "Explore"}</h1>
        <SearchBox key={q} defaultValue={q} />
      </div>
      {q ? (
        <Tabs
          label="Results"
          variant="plain"
          size="lg"
          className={TABS_LOOK}
          panelClassName="pt-0"
          tabs={[
            {
              id: "top",
              label: "Posts",
              count: posts.length,
              content: (
                <PostList
                  posts={posts}
                  onQuote={compose?.quote}
                  empty={<EmptyState icon={Search} title={`No posts about “${q}”`} description="Try a shorter word, a #tag or someone's @handle." />}
                />
              ),
            },
            {
              id: "people",
              label: "People",
              count: people.length,
              content: people.length ? (
                <ul className="divide-y divide-border">
                  {people.map((u) => (
                    <UserRow key={u.handle} handle={u.handle} bio />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Search} title={`Nobody matches “${q}”`} />
              ),
            },
          ]}
        />
      ) : (
        <Tabs
          label="Explore"
          variant="plain"
          size="lg"
          className={TABS_LOOK}
          panelClassName="pt-0"
          tabs={[
            { id: "trending", label: "Trending", content: <TrendList numbered /> },
            { id: "popular", label: "Popular", content: <PostList posts={popular} onQuote={compose?.quote} /> },
            {
              id: "people",
              label: "Who to follow",
              content: <WhoToFollow title="Suggested for you" bio handles={suggestions(10).map((u) => u.handle)} className="m-3" />,
            },
          ]}
        />
      )}
    </div>
  );
}
