import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DocCompareDialog } from "@/registry/plainspoken/blocks/conflicts/doc-compare-dialog";

const meta: Meta<typeof DocCompareDialog> = {
  title: "Blocks/Edit conflicts/Document: compare dialog",
  component: DocCompareDialog,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof DocCompareDialog>;

/** Change something, press Simulate buttons, then Save. */
export const Default: Story = { args: {} };

/** A refused save: the three-way compare, one block changed by each of you, and the result underneath. */
export const SaveRefused: Story = { args: { autoplay: "stale" }, parameters: { docs: { story: { inline: false, height: "640px" } } } };
