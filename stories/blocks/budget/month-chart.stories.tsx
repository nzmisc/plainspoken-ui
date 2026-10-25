import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BUDGET_LINES } from "@/registry/plainspoken/blocks/budget/data";
import { BudgetMonthChart } from "@/registry/plainspoken/blocks/budget/month-chart";

const meta: Meta<typeof BudgetMonthChart> = {
  title: "Blocks/Budget/Spend per month",
  component: BudgetMonthChart,
  decorators: [(S) => <div className="max-w-2xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof BudgetMonthChart>;

/** Approved lines beside those still waiting, per month. Tab to the chart and use the arrow keys to read it. */
export const Default: Story = {};

/** Nothing approved yet: every bar is in the second series. */
export const NothingApproved: Story = { args: { lines: BUDGET_LINES.map((l) => ({ ...l, approved: false })) } };
