import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextboxSaveConflict } from "@/registry/plainspoken/blocks/conflicts/textbox-save-conflict";

const meta: Meta<typeof TextboxSaveConflict> = {
  title: "Blocks/Edit conflicts/Text box: conflict on save",
  component: TextboxSaveConflict,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof TextboxSaveConflict>;

/** Nothing happens while you type; Save is where you find out. */
export const Default: Story = { args: {} };

/** A save based on an old version: the dialog, with both versions marked against the one you started from. */
export const SaveRefused: Story = { args: { autoplay: "stale" }, parameters: { docs: { story: { inline: false, height: "640px" } } } };
