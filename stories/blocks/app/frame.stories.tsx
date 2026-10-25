import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppFrame } from "@/registry/plainspoken/blocks/app/frame";
import { AppStats } from "@/registry/plainspoken/blocks/app/stats";

const meta: Meta<typeof AppFrame> = {
  title: "Blocks/App skeleton/App frame",
  component: AppFrame,
  args: { className: "h-[640px]", children: <div className="p-4"><h1 className="mb-3 text-[22px] font-bold">Dashboard</h1><AppStats /></div> },
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/demos/app" } } },
};
export default meta;
type Story = StoryObj<typeof AppFrame>;

/**
 * The frame on the dashboard. Ctrl+K (⌘K on a Mac) or the search button opens the palette; the
 * bell the notifications; the avatar the account menu. The menu button hides the sidebar,
 * Collapse narrows it to a rail.
 */
export const Dashboard: Story = {};

/** Another page: the sidebar marks it from the URL. */
export const OnCustomers: Story = { parameters: { nextjs: { navigation: { pathname: "/demos/app/customers/fjord-outdoor" } } } };

/** A phone: the sidebar becomes a drawer behind the menu button, and search shrinks to an icon. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };
