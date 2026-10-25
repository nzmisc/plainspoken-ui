import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppRevenueChart } from "@/registry/plainspoken/blocks/app/revenue-chart";

const meta: Meta<typeof AppRevenueChart> = {
  title: "Blocks/App skeleton/Revenue chart",
  component: AppRevenueChart,
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppRevenueChart>;

/** Two series, told apart by colour, dash and marker. Hover, or Tab in and use ←/→. */
export const Default: Story = {};
