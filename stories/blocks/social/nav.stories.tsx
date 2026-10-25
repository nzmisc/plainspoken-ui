import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeader, SocialBottomNav, SocialSidebar } from "@/registry/plainspoken/blocks/social/nav";

const meta: Meta<typeof SocialSidebar> = {
  title: "Blocks/Social/Social navigation",
  component: SocialSidebar,
  parameters: { nextjs: { navigation: { pathname: "/demos/social/notifications" } } },
  args: { className: "h-[480px] border" },
};
export default meta;
type Story = StoryObj<typeof SocialSidebar>;

/** Full width, on Notifications. */
export const Full: Story = {};

/** The rail of icons, for medium screens. */
export const Rail: Story = { args: { rail: true } };

/** The phone's bottom bar. */
export const BottomBar: Story = { render: () => <SocialBottomNav className="w-80 border" /> };

/** A page header with a back arrow. */
export const Header: Story = { render: () => <PageHeader title="Grace Mbeki" subtitle="4 posts" backHref="#" className="static w-96 border" /> };
