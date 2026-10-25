import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingCheckList, LandingPageHeader, LandingSection } from "@/registry/plainspoken/blocks/landing/section";

const meta: Meta<typeof LandingSection> = {
  title: "Blocks/Landing page/Section",
  component: LandingSection,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Security",
    title: "Your data stays in the EU",
    lead: "Check results are stored in Frankfurt, with a copy in Amsterdam, and deleted when your plan's history runs out.",
    children: <LandingCheckList items={["Encrypted at rest and in transit", "Single sign-on on the Business plan", "A data processing agreement on request"]} />,
  },
};
export default meta;
type Story = StoryObj<typeof LandingSection>;

export const Plain: Story = {};

/** The gray band that alternates with plain ones. */
export const Muted: Story = { args: { tone: "muted" } };

/** Heading and lead centred (left-aligned again on phones). */
export const Centered: Story = { args: { centered: true } };

/** The h1 header of an inner page. */
export const PageHeader: Story = {
  render: () => (
    <div className="p-6">
      <LandingPageHeader title="Pricing" lead="Start free and stay free for a personal site. Pay when you need faster checks and a team on call." />
    </div>
  ),
};
