import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BudgetStats } from "@/registry/plainspoken/blocks/budget/budget-stats";
import { BUDGET_LINES } from "@/registry/plainspoken/blocks/budget/data";

const meta: Meta<typeof BudgetStats> = {
  title: "Blocks/Budget/Budget figures",
  component: BudgetStats,
};
export default meta;
type Story = StoryObj<typeof BudgetStats>;

/** The demo plan: up on last year, said in words and an arrow rather than red or green. */
export const Default: Story = {};

/** Everything approved, and the offsite dropped: the waiting figure goes to zero. */
export const AllApproved: Story = {
  args: { lines: BUDGET_LINES.filter((l) => l.id !== "offsite").map((l) => ({ ...l, approved: true })) },
};
