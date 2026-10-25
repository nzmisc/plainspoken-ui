import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingCta } from "@/registry/plainspoken/blocks/landing/cta";
import { CTA, href } from "@/content/landing/content";

const meta: Meta<typeof LandingCta> = {
  title: "Blocks/Landing page/Call to action",
  component: LandingCta,
  parameters: { layout: "fullscreen" },
  args: { title: CTA.title, text: CTA.text, action: href.signup, note: "No card needed. You can delete your account and data at any time." },
};
export default meta;
type Story = StoryObj<typeof LandingCta>;

export const Idle: Story = {};

/** After a bad address: the field is marked and the error read out with it. */
export const WithError: Story = { args: { state: "error", email: "marta@northwind", error: "That address is missing its ending, like .com" } };

/** After signing up, a message replaces the form (announced to screen readers). */
export const Success: Story = { args: { state: "success", email: "marta@northwind.example" } };

export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
