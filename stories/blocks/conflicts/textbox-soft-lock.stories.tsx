import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextboxSoftLock } from "@/registry/plainspoken/blocks/conflicts/textbox-soft-lock";

const meta: Meta<typeof TextboxSoftLock> = {
  title: "Blocks/Edit conflicts/Text box: soft lock",
  component: TextboxSoftLock,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof TextboxSoftLock>;

/** As it starts: nobody else in the field. Type, or press a Simulate button. */
export const Default: Story = { args: {} };

/** Jonas edits the sentence you meant to change: the field locks for you, with his ring and tag, and Edit anyway. */
export const JonasTyping: Story = { args: { autoplay: "same" } };

/** Your screen and Jonas's side by side: focus his box first and yours locks. */
export const BothScreens: Story = { args: { defaultSplit: true } };
