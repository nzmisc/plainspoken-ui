import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingPlanComparison } from "@/registry/plainspoken/blocks/landing/plan-comparison";
import { COMPARISON, PLANS } from "@/content/landing/content";

const meta: Meta<typeof LandingPlanComparison> = {
  title: "Blocks/Landing page/Plan comparison",
  component: LandingPlanComparison,
  decorators: [(S) => <div className="max-w-6xl">{S()}</div>],
  args: {
    plans: PLANS.map((p) => p.name),
    groups: COMPARISON,
    highlight: "Team",
    caption: "Features of the Hobby, Team and Business plans. A check mark means included, a dash not included.",
  },
};
export default meta;
type Story = StoryObj<typeof LandingPlanComparison>;

export const Default: Story = {};

/** No column tinted. */
export const NoHighlight: Story = { args: { highlight: undefined } };

/** On a phone the table scrolls sideways. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
