import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppNotificationSettings } from "@/registry/plainspoken/blocks/app/notification-settings";

const meta: Meta<typeof AppNotificationSettings> = {
  title: "Blocks/App skeleton/Notification settings",
  component: AppNotificationSettings,
};
export default meta;
type Story = StoryObj<typeof AppNotificationSettings>;

/** Switches apply at once; the reminders are saved with their button. */
export const Default: Story = {};

/** Everything off. */
export const AllOff: Story = { args: { defaultOn: [] } };
