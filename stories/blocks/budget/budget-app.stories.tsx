import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BudgetApp } from "@/registry/plainspoken/blocks/budget/budget-app";

const meta: Meta<typeof BudgetApp> = {
  title: "Blocks/Budget/Budget app",
  component: BudgetApp,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof BudgetApp>;

/** The design team's 2027 plan: figures, the sheet, the chart and the category summary, all from the same lines. */
export const Default: Story = {};

/** On a phone: the sheet scrolls sideways with only the row numbers kept in view; the panels stack. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
