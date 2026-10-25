import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BudgetApp } from "@/registry/plainspoken/blocks/budget/budget-app";

const meta: Meta<typeof BudgetApp> = {
  title: "Demos/Budget",
  component: BudgetApp,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "900px" } } },
};
export default meta;
type Story = StoryObj<typeof BudgetApp>;

/**
 * The demo as it is at /demos/budget: the design team of Kestrel Labs planning 2027 against 2026.
 * Edit a month and the figures, the chart and the category summary follow; Save keeps the version.
 */
export const Budget: Story = {};

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
