import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RightRail, SearchBox, SocialApp } from "@/registry/plainspoken/blocks/social/app-shell";
import { Timeline } from "@/registry/plainspoken/blocks/social/timeline";

const meta: Meta<typeof SocialApp> = {
  title: "Blocks/Social/Social app frame",
  component: SocialApp,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/demos/social" } } },
  args: { children: <Timeline /> },
};
export default meta;
type Story = StoryObj<typeof SocialApp>;

/** Three columns: nav, timeline, and search with trends and suggestions. */
export const Frame: Story = {};

/** The right column on its own. */
export const Rail: Story = { parameters: { layout: "padded" }, render: () => <RightRail className="max-w-[350px]" /> };

/** The search box, which goes to Explore. */
export const Search: Story = { parameters: { layout: "padded" }, render: () => <SearchBox className="max-w-sm" /> };

/** On a phone: one column, the bottom bar and the post button. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
