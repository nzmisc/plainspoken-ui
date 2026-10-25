import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogPostHeader } from "@/registry/plainspoken/blocks/blog/post-header";
import { getPost, tagLinks } from "@/content/blog/posts";
import { href } from "@/content/blog/site";

const post = getPost("drain-postgres-primary")!;

const meta: Meta<typeof BlogPostHeader> = {
  title: "Blocks/Blog/Post header",
  component: BlogPostHeader,
  decorators: [(S) => <div className="max-w-4xl">{S()}</div>],
  args: {
    title: post.title,
    summary: post.summary,
    date: post.date,
    minutes: post.minutes,
    tags: tagLinks(post.tags),
    crumbs: [{ label: "Home", href: href.home }, { label: "Writing", href: href.posts }, { label: post.title }],
  },
};
export default meta;
type Story = StoryObj<typeof BlogPostHeader>;

export const Default: Story = {};

/** With an update date as well. */
export const Updated: Story = { args: { updated: "2026-10-03" } };

/** Just the title and the date. */
export const Minimal: Story = { args: { summary: undefined, minutes: undefined, tags: undefined, crumbs: undefined } };
