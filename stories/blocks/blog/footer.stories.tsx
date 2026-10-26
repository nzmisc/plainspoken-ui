import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogFooter } from "@/registry/plainspoken/blocks/blog/footer";
import { AUTHOR, FOOTER_LINKS } from "@/content/blog/site";

const meta: Meta<typeof BlogFooter> = {
  title: "Blocks/Blog/Blog footer",
  component: BlogFooter,
  parameters: { layout: "fullscreen" },
  args: {
    name: AUTHOR.name,
    tagline: AUTHOR.tagline,
    links: FOOTER_LINKS,
    smallPrint: "© 2026 Ines Varga. Words under CC BY 4.0. No tracking, no cookies.",
  },
};
export default meta;
type Story = StoryObj<typeof BlogFooter>;

export const Default: Story = {};

/** Only the name and the links. */
export const Minimal: Story = { args: { tagline: undefined, smallPrint: undefined } };
