import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DocHistory } from "@/registry/plainspoken/blocks/conflicts/doc-history";

const meta: Meta<typeof DocHistory> = {
  title: "Blocks/Edit conflicts/Document: version history",
  component: DocHistory,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof DocHistory>;

/** Press a Simulate button, then open a version in History and compare it with now. */
export const Default: Story = { args: {} };

/** Both typed the start time: both landed. The version from before is in History, ready to restore. */
export const AfterAClash: Story = { args: { autoplay: "same" } };
