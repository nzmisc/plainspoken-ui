import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingFeatureSplit } from "@/registry/plainspoken/blocks/landing/feature-split";
import { LandingAlertTimeline, LandingStatusPagePreview } from "@/registry/plainspoken/blocks/landing/visuals";
import { SPLITS } from "@/content/landing/content";

const meta: Meta<typeof LandingFeatureSplit> = {
  title: "Blocks/Landing page/Feature split",
  component: LandingFeatureSplit,
  decorators: [(S) => <div className="max-w-6xl">{S()}</div>],
  args: { ...SPLITS.alerts, visual: <LandingAlertTimeline /> },
};
export default meta;
type Story = StoryObj<typeof LandingFeatureSplit>;

export const TextFirst: Story = {};

/** Picture on the left: alternate this down the page. */
export const Reversed: Story = { args: { ...SPLITS.status, visual: <LandingStatusPagePreview />, reverse: true } };

/** With a link to more. */
export const WithLink: Story = { args: { more: { label: "How alerts work", href: "#alerts" } } };
