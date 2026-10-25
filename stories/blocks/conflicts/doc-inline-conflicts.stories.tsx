import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DocInlineConflicts } from "@/registry/plainspoken/blocks/conflicts/doc-inline-conflicts";

const meta: Meta<typeof DocInlineConflicts> = {
  title: "Blocks/Edit conflicts/Document: inline conflict blocks",
  component: DocInlineConflicts,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof DocInlineConflicts>;

/** Press Jonas edits a different paragraph, then Jonas edits the same sentence. */
export const Default: Story = { args: {} };

/** The paragraph you both changed, both versions stacked in place, tagged by author. */
export const Clash: Story = { args: { autoplay: "same" } };
