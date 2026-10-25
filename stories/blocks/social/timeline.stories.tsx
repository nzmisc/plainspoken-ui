import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Timeline } from "@/registry/plainspoken/blocks/social/timeline";

const meta: Meta<typeof Timeline> = {
  title: "Blocks/Social/Timeline",
  component: Timeline,
  decorators: [(S) => <div className="max-w-[600px] border-x border-border">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof Timeline>;

/** For you. ←/→ on the tabs switch to Following. */
export const ForYou: Story = {};

/** Following. */
export const Following: Story = { args: { defaultTab: "following" } };

/** Following nobody yet. */
export const Empty: Story = { args: { defaultTab: "following", followingPosts: [] } };
