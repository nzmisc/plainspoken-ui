import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogArchive, BlogPostList } from "@/registry/plainspoken/blocks/blog/post-list";
import { POSTS, listItem } from "@/content/blog/posts";

const meta: Meta<typeof BlogPostList> = {
  title: "Blocks/Blog/Post list",
  component: BlogPostList,
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
  args: { posts: POSTS.slice(0, 5).map(listItem) },
};
export default meta;
type Story = StoryObj<typeof BlogPostList>;

/** Recent posts, as on the home page. Titles turn purple once read. */
export const Recent: Story = {};

/** Titles and dates only. */
export const Compact: Story = { args: { summaries: false } };

/** No posts yet. */
export const Empty: Story = { args: { posts: [] } };

/** The whole archive, grouped by year. */
export const Archive: Story = { render: () => <BlogArchive posts={POSTS.map(listItem)} /> };

/** On a phone the date goes above the title. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
