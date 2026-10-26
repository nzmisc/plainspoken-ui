import { LandingSteps } from "@/registry/plainspoken/blocks/landing/steps";

export default function LandingStepsDemo() {
  return (
    <LandingSteps
      steps={[
        { title: "Add what to watch", text: "Paste a URL, or copy a heartbeat link into the end of a cron job.", detail: "Takes about a minute" },
        { title: "Say who to tell", text: "Email for small things, SMS and a phone call for outages.", detail: "Import your team from a CSV" },
        { title: "Get on with your day", text: "Keepwatch confirms failures, pages whoever is on call and updates your status page.", detail: "Median time to alert: 41 seconds" },
      ]}
    />
  );
}
