import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ConflictsDocFieldDemo from "@/registry/plainspoken/examples/conflicts-doc-field-demo";

const meta: Meta = {
  title: "Blocks/Edit conflicts/Synced editor",
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

/**
 * The rich text editor bound to the pretend server from the outside. Click into a paragraph and
 * press the button: Jonas types elsewhere, his caret and mark move, and yours stays put.
 */
export const WithPresence: Story = { render: () => <ConflictsDocFieldDemo /> };
