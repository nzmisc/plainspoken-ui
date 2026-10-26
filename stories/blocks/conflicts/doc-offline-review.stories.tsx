import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DocOfflineReview } from "@/registry/plainspoken/blocks/conflicts/doc-offline-review";

const meta: Meta<typeof DocOfflineReview> = {
  title: "Blocks/Edit conflicts/Document: offline review list",
  component: DocOfflineReview,
  parameters: { layout: "padded" },
  argTypes: { autoplay: { control: "select", options: [undefined, "other", "same", "stale", "offline"] } },
};
export default meta;
type Story = StoryObj<typeof DocOfflineReview>;

/** Press Go offline, edit, reconnect. */
export const Default: Story = { args: {} };

/** Back online: the report of what synced, and the one clash to step through. */
export const BackOnline: Story = { args: { autoplay: "offline" } };
