import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingFooter } from "@/registry/plainspoken/blocks/landing/footer";
import { FOOTER, PRODUCT } from "@/content/landing/content";

const meta: Meta<typeof LandingFooter> = {
  title: "Blocks/Landing page/Landing footer",
  component: LandingFooter,
  parameters: { layout: "fullscreen" },
  args: { brand: PRODUCT.name, tagline: PRODUCT.tagline, columns: FOOTER.columns, smallPrint: FOOTER.smallPrint },
};
export default meta;
type Story = StoryObj<typeof LandingFooter>;

export const Default: Story = {};

export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
