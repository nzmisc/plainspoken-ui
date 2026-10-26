import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrendList, TrendsPanel } from "@/registry/plainspoken/blocks/social/trends";

const meta: Meta<typeof TrendsPanel> = {
  title: "Blocks/Social/Trends",
  component: TrendsPanel,
  args: { count: 5, className: "w-80" },
};
export default meta;
type Story = StoryObj<typeof TrendsPanel>;

/** The side panel. Each ⋯ hides a trend. */
export const Panel: Story = {};

/** The numbered list on Explore. */
export const Numbered: Story = { render: () => <TrendList numbered className="max-w-[600px] border border-border" /> };
