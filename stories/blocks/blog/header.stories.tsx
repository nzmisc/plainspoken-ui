import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogHeader } from "@/registry/plainspoken/blocks/blog/header";
import { AUTHOR, NAV, href } from "@/content/blog/site";

const meta: Meta<typeof BlogHeader> = {
  title: "Blocks/Blog/Blog header",
  component: BlogHeader,
  parameters: { layout: "fullscreen" },
  args: { name: AUTHOR.name, homeHref: href.home, links: NAV, feedHref: href.feed, currentHref: href.home },
};
export default meta;
type Story = StoryObj<typeof BlogHeader>;

export const Home: Story = {};

/** On a post, Writing is the current section. */
export const OnAPost: Story = { args: { currentHref: href.post("parenzana") } };

/** Tag pages count as Writing too, through the link's `also` prefixes. */
export const OnATag: Story = { args: { currentHref: href.tag("ops") } };

/** Without a feed. */
export const NoFeed: Story = { args: { feedHref: undefined, currentHref: href.about } };

/** On a phone the links fold into a Menu button; the RSS link goes into the panel. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
