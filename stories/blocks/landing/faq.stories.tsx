import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingFaq } from "@/registry/plainspoken/blocks/landing/faq";
import { FAQ } from "@/content/landing/content";

const meta: Meta<typeof LandingFaq> = {
  title: "Blocks/Landing page/FAQ",
  component: LandingFaq,
  args: { questions: FAQ },
};
export default meta;
type Story = StoryObj<typeof LandingFaq>;

export const Closed: Story = {};

/** The first answer open. Find-in-page opens any answer that matches. */
export const OneOpen: Story = { args: { defaultOpen: ["free"] } };
