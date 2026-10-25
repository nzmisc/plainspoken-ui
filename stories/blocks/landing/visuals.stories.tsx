import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingAlertTimeline, LandingHeartbeatTable, LandingStatusPagePreview } from "@/registry/plainspoken/blocks/landing/visuals";

const meta: Meta<typeof LandingAlertTimeline> = {
  title: "Blocks/Landing page/Product pictures",
  component: LandingAlertTimeline,
  decorators: [(S) => <div className="max-w-xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof LandingAlertTimeline>;

/** An incident from a false alarm that was caught to recovery, with Status for each step. */
export const AlertTimeline: Story = {};

/** A customer's public status page: an Alert for the current incident, 90 days per component. */
export const StatusPage: Story = { render: () => <LandingStatusPagePreview /> };

/** Cron jobs reporting in: the ping command with a copy button, and a compact table. */
export const Heartbeats: Story = { render: () => <LandingHeartbeatTable /> };
