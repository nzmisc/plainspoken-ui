import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppProfileForm } from "@/registry/plainspoken/blocks/app/profile-form";

const meta: Meta<typeof AppProfileForm> = {
  title: "Blocks/App skeleton/Profile form",
  component: AppProfileForm,
};
export default meta;
type Story = StoryObj<typeof AppProfileForm>;

/** Labels beside fields on wide screens, above them on phones. */
export const Default: Story = {};
