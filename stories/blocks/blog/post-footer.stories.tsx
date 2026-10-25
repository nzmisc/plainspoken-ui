import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogPostFooter } from "@/registry/plainspoken/blocks/blog/post-footer";

const meta: Meta<typeof BlogPostFooter> = {
  title: "Blocks/Blog/Post footer",
  component: BlogPostFooter,
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
  args: {
    title: "Draining a Postgres primary without dropping writes",
    replyTo: "ines@example.com",
    older: { title: "How Buildings Learn, for people who build software", href: "/posts/how-buildings-learn" },
    newer: { title: "Four days on the Parenzana", href: "/posts/parenzana" },
  },
};
export default meta;
type Story = StoryObj<typeof BlogPostFooter>;

export const Default: Story = {};

/** The newest post has no newer one. */
export const Newest: Story = { args: { newer: undefined } };

/** The oldest post has no older one. */
export const Oldest: Story = { args: { older: undefined } };

/** No reply box. */
export const NoReply: Story = { args: { replyTo: undefined } };
