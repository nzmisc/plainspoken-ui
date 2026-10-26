import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DocLivePresence } from "@/registry/plainspoken/blocks/conflicts/doc-live-presence";

const meta: Meta<typeof DocLivePresence> = {
  title: "Blocks/Edit conflicts/Document: live presence",
  component: DocLivePresence,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof DocLivePresence>;

/** Click into a paragraph, then press a Simulate button: his caret, his “is editing” mark and his words arrive; yours stay put. */
export const Default: Story = { args: {} };

/** Jonas typing into the last paragraph, his caret and mark following him; Priya reading. */
export const JonasTyping: Story = { args: { autoplay: "other" } };

/** Both screens: type in Jonas's editor too. */
export const BothScreens: Story = { args: { defaultSplit: true } };
