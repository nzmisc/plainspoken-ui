import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostThread } from "@/registry/plainspoken/blocks/social/thread";

const meta: Meta<typeof PostThread> = {
  title: "Blocks/Social/Thread",
  component: PostThread,
  decorators: [(S) => <div className="max-w-[600px] border-x border-border">{S()}</div>],
  args: { id: "ada-3" },
};
export default meta;
type Story = StoryObj<typeof PostThread>;

/** The third post of a thread: two above it, joined by a line. */
export const InAThread: Story = {};

/** A post with a conversation under it. */
export const WithReplies: Story = { args: { id: "priya-1" } };

/** No replies yet. */
export const NoReplies: Story = { args: { id: "theo-1" } };

/** A post that doesn't exist. */
export const Missing: Story = { args: { id: "nope" } };
