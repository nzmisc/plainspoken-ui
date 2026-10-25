import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BudgetSheet } from "@/registry/plainspoken/blocks/budget/budget-sheet";
import { BUDGET_LINES, type BudgetLine } from "@/registry/plainspoken/blocks/budget/data";

/** The plan after a morning's work: two months changed, a line approved, one added, one gone */
const EDITED: BudgetLine[] = [
  ...BUDGET_LINES.filter((l) => l.id !== "books").map((l) =>
    l.id === "offsite" ? { ...l, jun: 8200, approved: true } : l.id === "devices" ? { ...l, may: 2400 } : l,
  ),
  { ...BUDGET_LINES[0], id: "whiteboard", item: "Online whiteboard, 10 seats", owner: "Yuki Moreau", lastYear: null, approved: false, notes: "Replaces the free plan", ...Object.fromEntries(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map((m) => [m, 80])) },
];

const meta: Meta<typeof BudgetSheet> = {
  title: "Blocks/Budget/Budget sheet",
  component: BudgetSheet,
  args: { defaultValue: BUDGET_LINES, onSave: () => {} },
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof BudgetSheet>;

/** The plan as saved. Type into a month ("1.2k" works), paste a column from a spreadsheet, tick Approved with Space. */
export const Default: Story = {};

/**
 * Unsaved changes against the saved plan: marked cells, a new line (the bar by its number), and
 * the bar counting them, including the deleted line.
 */
export const WithChanges: Story = { args: { defaultValue: EDITED, baseline: BUDGET_LINES } };

/** For reading only: cells can be selected and copied, nothing edited, no save bar. */
export const ReadOnly: Story = { args: { readOnly: true, onSave: undefined } };
