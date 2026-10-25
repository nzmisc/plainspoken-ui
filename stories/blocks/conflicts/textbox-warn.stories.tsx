import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextboxWarn } from "@/registry/plainspoken/blocks/conflicts/textbox-warn";

const meta: Meta<typeof TextboxWarn> = {
  title: "Blocks/Edit conflicts/Text box: warn while typing",
  component: TextboxWarn,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof TextboxWarn>;

/** Type, then press Jonas edits the same sentence. */
export const Default: Story = { args: {} };

/** Your edit and Jonas's meet: the notice under the field, your text untouched. */
export const ChangedWhileTyping: Story = { args: { autoplay: "same" } };

/** You save without having seen his change: the save is refused and the notice says so. */
export const SaveRefused: Story = { args: { autoplay: "stale" } };
