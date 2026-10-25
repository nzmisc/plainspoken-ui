import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryHeader } from "@/registry/plainspoken/blocks/library/header";
import { BASE } from "./fixtures";

const meta: Meta<typeof LibraryHeader> = {
  title: "Blocks/Library/Library header",
  component: LibraryHeader,
  parameters: { layout: "fullscreen" },
  args: { basePath: BASE, name: "Lakemont Public Library", patron: "Ada Okafor", pathname: `${BASE}/book/beloved` },
};
export default meta;
type Story = StoryObj<typeof LibraryHeader>;

/** On a title's page: the compact search box is in the bar. Open the account menu from the name. */
export const OnABook: Story = {};

/** On the home page, which has its own big search box. */
export const Home: Story = { args: { pathname: BASE } };

/** My account is the current section. */
export const Account: Story = { args: { pathname: `${BASE}/account` } };

/** On a phone the links fold into the Menu button. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
