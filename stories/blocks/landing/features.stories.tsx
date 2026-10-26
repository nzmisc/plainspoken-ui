import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingFeatures } from "@/registry/plainspoken/blocks/landing/features";
import { FEATURES } from "@/content/landing/content";

const meta: Meta<typeof LandingFeatures> = {
  title: "Blocks/Landing page/Features grid",
  component: LandingFeatures,
  decorators: [(S) => <div className="max-w-6xl">{S()}</div>],
  args: { features: FEATURES },
};
export default meta;
type Story = StoryObj<typeof LandingFeatures>;

export const ThreeColumns: Story = {};

export const TwoColumns: Story = { args: { columns: 2, features: FEATURES.slice(0, 4) } };
