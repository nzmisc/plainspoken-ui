import { LandingHeartbeatTable, LandingStatusPagePreview } from "@/registry/plainspoken/blocks/landing/visuals";

/** Two of the pictures: a customer's status page with 90 days of history, and cron jobs reporting in. LandingAlertTimeline is the third. */
export default function LandingVisualsDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LandingStatusPagePreview />
      <LandingHeartbeatTable />
    </div>
  );
}
