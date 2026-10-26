import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FocalPost, PostCard, PostPoll } from "@/registry/plainspoken/blocks/social/post";
import { postById } from "@/registry/plainspoken/blocks/social/data";

const meta: Meta<typeof PostCard> = {
  title: "Blocks/Social/Post",
  component: PostCard,
  args: { post: postById("priya-1")! },
  decorators: [(S) => <div className="max-w-[600px] border-x border-t border-border">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof PostCard>;

/** Text with a #tag, liked and bookmarked. */
export const Playground: Story = {};

/** With a picture. */
export const Picture: Story = { args: { post: postById("kwame-1")! } };

/** Quoting another post. */
export const Quote: Story = { args: { post: postById("mei-q")! } };

/** A reply, saying whom it answers, with an @mention and a web address. */
export const Reply: Story = { args: { post: postById("r-ada-2")!, showReplyingTo: true } };

/** Pinned to the profile, with a line down to the rest of a thread. */
export const PinnedThread: Story = { args: { post: postById("robin-1")!, threadLine: true } };

/** A long post with a link. */
export const Link: Story = { args: { post: postById("samir-1")! } };

/** An open poll (vote to see results) and a finished one with your vote. */
export const Polls: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-3">
      <PostPoll poll={postById("elif-1")!.poll!} />
      <PostPoll poll={postById("robin-2")!.poll!} />
    </div>
  ),
};

/** The post on its own page. */
export const Focal: Story = { render: () => <FocalPost post={postById("grace-1")!} /> };

/** On a phone. */
export const Phone: Story = { args: { post: postById("juan-1")! }, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
