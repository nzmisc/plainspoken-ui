import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingSteps } from "@/registry/plainspoken/blocks/landing/steps";
import { STEPS } from "@/content/landing/content";

const meta: Meta<typeof LandingSteps> = {
  title: "Blocks/Landing page/Steps",
  component: LandingSteps,
  decorators: [(S) => <div className="max-w-6xl">{S()}</div>],
  args: { steps: STEPS },
};
export default meta;
type Story = StoryObj<typeof LandingSteps>;

export const Default: Story = {};

/** Stacked on phones, without the rule. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
