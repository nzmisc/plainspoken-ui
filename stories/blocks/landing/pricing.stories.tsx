import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingPricing } from "@/registry/plainspoken/blocks/landing/pricing";
import { PLANS, href } from "@/content/landing/content";

const meta: Meta<typeof LandingPricing> = {
  title: "Blocks/Landing page/Pricing plans",
  component: LandingPricing,
  decorators: [(S) => <div className="max-w-6xl">{S()}</div>],
  args: { plans: PLANS, signupHref: href.signup },
};
export default meta;
type Story = StoryObj<typeof LandingPricing>;

/** Yearly prices, per month, with the yearly total. Arrow keys switch the period. */
export const Yearly: Story = {};

export const Monthly: Story = { args: { defaultBilling: "monthly" } };

/** Two plans. */
export const TwoPlans: Story = { args: { plans: PLANS.slice(0, 2) } };

export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
