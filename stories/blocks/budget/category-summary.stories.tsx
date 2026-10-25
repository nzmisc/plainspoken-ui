import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BudgetCategorySummary } from "@/registry/plainspoken/blocks/budget/category-summary";
import { BUDGET_LINES } from "@/registry/plainspoken/blocks/budget/data";

const meta: Meta<typeof BudgetCategorySummary> = {
  title: "Blocks/Budget/Category summary",
  component: BudgetCategorySummary,
  decorators: [(S) => <div className="max-w-2xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof BudgetCategorySummary>;

/** Each category against last year, with its months as a sparkline. */
export const Default: Story = {};

/** A line without a category goes under "Other", after the fixed ones. */
export const WithUncategorised: Story = {
  args: { lines: [...BUDGET_LINES, { ...BUDGET_LINES[4], id: "misc", item: "Misc", category: null, lastYear: null }] },
};
