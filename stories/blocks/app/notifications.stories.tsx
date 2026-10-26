import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NOTIFICATIONS } from "@/registry/plainspoken/blocks/app/data";
import { AppNotifications } from "@/registry/plainspoken/blocks/app/notifications";

const meta: Meta<typeof AppNotifications> = {
  title: "Blocks/App skeleton/Notifications",
  component: AppNotifications,
  decorators: [(S) => <div className="flex min-h-[520px] justify-end">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppNotifications>;

/** Open: unread ones bold on gray, with how long ago. */
export const Open: Story = { args: { defaultOpen: true } };

/** Closed: the bell's mark says there is something unread (and its name says how many). */
export const Closed: Story = {};

/** All read: no mark. */
export const AllRead: Story = { args: { items: NOTIFICATIONS.map((n) => ({ ...n, unread: false })) } };
