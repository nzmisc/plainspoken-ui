import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ACTIVITY } from "@/registry/plainspoken/blocks/app/data";
import { AppActivityFeed } from "@/registry/plainspoken/blocks/app/activity-feed";

const meta: Meta<typeof AppActivityFeed> = {
  title: "Blocks/App skeleton/Activity feed",
  component: AppActivityFeed,
  decorators: [(S) => <div className="max-w-md">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppActivityFeed>;

/** Newest first, with links, and how long ago from the demo's fixed clock. */
export const Default: Story = {};

/** A few items, under another title. */
export const Short: Story = { args: { title: "What happened with Fjord Outdoor", items: ACTIVITY.slice(0, 2) } };
