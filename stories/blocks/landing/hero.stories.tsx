import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingHero } from "@/registry/plainspoken/blocks/landing/hero";
import { LandingProductShot } from "@/registry/plainspoken/blocks/landing/product-shot";
import { HERO, href } from "@/content/landing/content";

const meta: Meta<typeof LandingHero> = {
  title: "Blocks/Landing page/Hero",
  component: LandingHero,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: HERO.eyebrow,
    title: HERO.title,
    lead: HERO.lead,
    primary: { label: "Start monitoring free", href: href.signup },
    secondary: { label: "See pricing", href: href.pricing },
    note: HERO.note,
  },
};
export default meta;
type Story = StoryObj<typeof LandingHero>;

/** With the product under the text, as on the page. */
export const WithProduct: Story = { args: { visual: <LandingProductShot /> } };

export const TextOnly: Story = {};

/** One call to action, no badge. */
export const Minimal: Story = { args: { eyebrow: undefined, secondary: undefined, note: undefined } };

export const Phone: Story = { args: { visual: <LandingProductShot /> }, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
