import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextboxAutoMerge } from "@/registry/plainspoken/blocks/conflicts/textbox-auto-merge";

const meta: Meta<typeof TextboxAutoMerge> = {
  title: "Blocks/Edit conflicts/Text box: automatic merge",
  component: TextboxAutoMerge,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof TextboxAutoMerge>;

/** Type anywhere, then press Jonas edits a different sentence: it merges, says so, and offers Undo. */
export const Default: Story = { args: {} };

/** Both changed “Friday”: only that word is marked, with both versions and a button each. */
export const SameWords: Story = { args: { autoplay: "same" } };

/** Your offline edit meets two of Jonas's: one merges, one clashes. */
export const Offline: Story = { args: { autoplay: "offline" } };

/** Both screens: type in either box and watch the copies merge. */
export const BothScreens: Story = { args: { defaultSplit: true } };
