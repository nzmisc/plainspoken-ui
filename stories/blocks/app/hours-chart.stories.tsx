import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppHoursChart } from "@/registry/plainspoken/blocks/app/hours-chart";

const meta: Meta<typeof AppHoursChart> = {
  title: "Blocks/App skeleton/Hours chart",
  component: AppHoursChart,
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppHoursChart>;

/** Horizontal grouped bars, the second series textured. Hover, or Tab in and use the arrow keys. */
export const Default: Story = {};
