import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationList } from "@/registry/plainspoken/blocks/social/notifications";

const meta: Meta<typeof NotificationList> = {
  title: "Blocks/Social/Notifications",
  component: NotificationList,
  decorators: [(S) => <div className="max-w-[600px] border-x border-border">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof NotificationList>;

/** Grouped by day; the Mentions tab shows only mentions and replies. */
export const All: Story = {};

/** None. */
export const Empty: Story = { args: { notifications: [] } };
