import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingProductShot } from "@/registry/plainspoken/blocks/landing/product-shot";

const meta: Meta<typeof LandingProductShot> = {
  title: "Blocks/Landing page/Product screenshot",
  component: LandingProductShot,
  decorators: [(S) => <div className="max-w-6xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof LandingProductShot>;

/** Navbar, StatGroup, Panel, LineChart, Table, Status and Sparkline, made inert. Tab skips straight past it. */
export const Default: Story = {};

/** It reflows like the real components: stats stack, a column hides. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
