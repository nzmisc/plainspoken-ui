import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ORDERS } from "@/registry/plainspoken/blocks/grid/data";
import { GridApp } from "@/registry/plainspoken/blocks/grid/grid-app";

const meta: Meta<typeof GridApp> = {
  title: "Demos/Data grid",
  component: GridApp,
  // A drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  args: { className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof GridApp>;

/** The demo as it is at /demos/grid: Brindle & Moss's three thousand orders, newest first. */
export const Orders: Story = {};

/** One order open in the drawer, from the Late view. */
export const OrderOpen: Story = { args: { defaultViewId: "late", defaultOpenId: ORDERS.find((o) => (o.late ?? 0) >= 4)!.id } };

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
