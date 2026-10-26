import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppStats } from "@/registry/plainspoken/blocks/app/stats";

const meta: Meta<typeof AppStats> = {
  title: "Blocks/App skeleton/Dashboard stats",
  component: AppStats,
};
export default meta;
type Story = StoryObj<typeof AppStats>;

/** Four across on wide screens, two on tablets, one on phones. Overdue going up is red; days to pay going down is green. */
export const Four: Story = {};

/** Two across, for a narrow column. */
export const TwoColumns: Story = { args: { columns: 2 }, decorators: [(S) => <div className="max-w-xl">{S()}</div>] };
