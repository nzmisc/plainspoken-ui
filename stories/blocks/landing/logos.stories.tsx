import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingLogos } from "@/registry/plainspoken/blocks/landing/logos";
import { CUSTOMERS } from "@/content/landing/content";

const meta: Meta<typeof LandingLogos> = {
  title: "Blocks/Landing page/Customer names",
  component: LandingLogos,
  parameters: { layout: "fullscreen" },
  args: { title: CUSTOMERS.title, names: CUSTOMERS.names },
};
export default meta;
type Story = StoryObj<typeof LandingLogos>;

export const Default: Story = {};

/** Four names: one row on wide screens. */
export const Four: Story = { args: { names: CUSTOMERS.names.slice(0, 4) } };
