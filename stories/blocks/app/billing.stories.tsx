import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppBilling } from "@/registry/plainspoken/blocks/app/billing";

const meta: Meta<typeof AppBilling> = {
  title: "Blocks/App skeleton/Billing",
  component: AppBilling,
};
export default meta;
type Story = StoryObj<typeof AppBilling>;

/** The current plan marked in words and with a heavier border; storage past 70% warns. */
export const Default: Story = {};

/** On the smallest plan: both others offered as upgrades. */
export const OnSolo: Story = { args: { current: "solo" } };
