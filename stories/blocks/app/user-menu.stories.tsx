import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppUserMenu } from "@/registry/plainspoken/blocks/app/user-menu";

const meta: Meta<typeof AppUserMenu> = {
  title: "Blocks/App skeleton/Account menu",
  component: AppUserMenu,
  decorators: [(S) => <div className="flex min-h-[320px] justify-end">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppUserMenu>;

/** Open. Keyboard: ↓ or Enter on the avatar opens it with the first item highlighted. */
export const Open: Story = { args: { defaultOpen: true } };

/** Closed. */
export const Closed: Story = {};
