import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Explore } from "@/registry/plainspoken/blocks/social/explore";

const meta: Meta<typeof Explore> = {
  title: "Blocks/Social/Explore",
  component: Explore,
  parameters: { nextjs: { navigation: { pathname: "/demos/social/explore" } } },
  decorators: [(S) => <div className="max-w-[600px] border-x border-border">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof Explore>;

/** Trending, popular posts, who to follow. */
export const Trending: Story = {};

/** A search for a tag. */
export const Search: Story = { parameters: { nextjs: { navigation: { pathname: "/demos/social/explore", query: { q: "#a11y" } } } } };

/** Nothing found. */
export const NoResults: Story = { parameters: { nextjs: { navigation: { pathname: "/demos/social/explore", query: { q: "zeppelin" } } } } };
