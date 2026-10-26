import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogNow } from "@/registry/plainspoken/blocks/blog/now";
import { NOW } from "@/content/blog/site";

const meta: Meta<typeof BlogNow> = {
  title: "Blocks/Blog/Now box",
  component: BlogNow,
  decorators: [(S) => <div className="max-w-xs">{S()}</div>],
  args: { updated: NOW.updated, items: NOW.items },
};
export default meta;
type Story = StoryObj<typeof BlogNow>;

export const Default: Story = {};

/** A single item, with a different title. */
export const Short: Story = { args: { title: "Lately", items: ["On parental leave until January. Replies will be slow."] } };
