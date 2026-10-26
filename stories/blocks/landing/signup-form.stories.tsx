import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingSignupForm } from "@/registry/plainspoken/blocks/landing/signup-form";
import { PLANS } from "@/content/landing/content";

const meta: Meta<typeof LandingSignupForm> = {
  title: "Blocks/Landing page/Sign-up form",
  component: LandingSignupForm,
  decorators: [(S) => <div className="max-w-2xl">{S()}</div>],
  args: { plans: PLANS.map((p) => ({ ...p, summary: p.features[0] })), defaultPlan: "team" },
};
export default meta;
type Story = StoryObj<typeof LandingSignupForm>;

/** Switching Monthly / Yearly changes the plan prices; the footer line follows the chosen plan. */
export const Empty: Story = {};

/** After a failed submission: a summary at the top links to each field, and each error sits under its field. */
export const Errors: Story = {
  args: {
    state: "error",
    values: { name: "Marta Kos", email: "marta@northwind" },
    errors: { email: "Enter an address like you@company.com", password: "Use at least 12 characters", terms: "Tick the box to agree to the terms" },
  },
};

/** After a successful one. */
export const Success: Story = { args: { state: "success", values: { email: "marta@northwind.example" } } };

/** The free plan chosen, billed monthly. */
export const FreePlan: Story = { args: { defaultPlan: "hobby", defaultBilling: "monthly" } };

export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
