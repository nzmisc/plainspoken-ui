import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ConflictsPlaygroundDemo from "@/registry/plainspoken/examples/conflicts-playground-demo";

const meta: Meta = {
  title: "Blocks/Edit conflicts/Conflict playground",
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

/**
 * The frame around a naive text box that merges everything: name, fit and trade-offs, the Simulate
 * buttons, your screen (and Jonas's with the switch), and the log of saves, refusals and merges.
 */
export const NaiveTextBox: Story = { render: () => <ConflictsPlaygroundDemo /> };
