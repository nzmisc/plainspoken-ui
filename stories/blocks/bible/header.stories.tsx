import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleHeader } from "@/registry/plainspoken/blocks/bible/header";
import { BASE } from "./fixtures";

const meta: Meta<typeof BibleHeader> = {
  title: "Blocks/Bible/Bible header",
  component: BibleHeader,
  parameters: { layout: "fullscreen" },
  args: { basePath: BASE, pathname: `${BASE}/john/3` },
};
export default meta;
type Story = StoryObj<typeof BibleHeader>;

/** On a chapter: Books is the current section, and the search box is in the bar. */
export const Reading: Story = {};

/** On the search page the bar has no search box of its own. */
export const OnSearch: Story = { args: { pathname: `${BASE}/search` } };

/** On a phone the links and the search box fold into the Menu button. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
