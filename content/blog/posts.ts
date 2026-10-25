// The blog demo's posts, newest first, and the lists derived from them. Bodies live in posts/*.tsx.
import type { BlogPostListItem } from "@/registry/plainspoken/blocks/blog/post-list";
import type { BlogTag } from "@/registry/plainspoken/blocks/blog/tags";
import { href } from "./site";
import type { Post } from "./types";
import { post as boringDeploys } from "./posts/boring-deploys";
import { post as drainPostgres } from "./posts/drain-postgres-primary";
import { post as familyWireguard } from "./posts/family-wireguard";
import { post as flameGraphs } from "./posts/flame-graphs";
import { post as howBuildingsLearn } from "./posts/how-buildings-learn";
import { post as parenzana } from "./posts/parenzana";
import { post as plainPages } from "./posts/plain-pages";
import { post as smallTools } from "./posts/small-tools";
import { post as sqliteProduction } from "./posts/sqlite-production";
import { post as systemdUserUnits } from "./posts/systemd-user-units";
import { post as year2025 } from "./posts/year-2025";

export type { Post } from "./types";

export const POSTS: Post[] = [
  parenzana,
  drainPostgres,
  howBuildingsLearn,
  systemdUserUnits,
  plainPages,
  familyWireguard,
  smallTools,
  boringDeploys,
  year2025,
  flameGraphs,
  sqliteProduction,
].sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** The posts on either side of one, by date */
export function neighbours(slug: string): { older?: Post; newer?: Post } {
  const i = POSTS.findIndex((p) => p.slug === slug);
  return { newer: i > 0 ? POSTS[i - 1] : undefined, older: i >= 0 ? POSTS[i + 1] : undefined };
}

/** Every tag with its post count, most used first, then by name */
export const TAGS: { tag: string; count: number }[] = [...new Set(POSTS.flatMap((p) => p.tags))]
  .map((tag) => ({ tag, count: POSTS.filter((p) => p.tags.includes(tag)).length }))
  .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

export function postsTagged(tag: string): Post[] {
  return POSTS.filter((p) => p.tags.includes(tag));
}

export const tagLinks = (tags: string[]) => tags.map((t) => ({ label: t, href: href.tag(t) }));

/** A post as the list blocks want it */
export function listItem(p: Post): BlogPostListItem {
  return { href: href.post(p.slug), title: p.title, date: p.date, summary: p.summary, minutes: p.minutes, tags: tagLinks(p.tags) };
}

export const TAG_LINKS: BlogTag[] = TAGS.map(({ tag, count }) => ({ label: tag, href: href.tag(tag), count }));
