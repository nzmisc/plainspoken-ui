import { LandingFeatureSplit } from "@/registry/plainspoken/blocks/landing/feature-split";
import { LandingAlertTimeline } from "@/registry/plainspoken/blocks/landing/visuals";

/** Text on one side, a picture of that part of the product on the other. Set `reverse` on every other one. */
export default function LandingFeatureSplitDemo() {
  return (
    <LandingFeatureSplit
      eyebrow="Alerting"
      title="Checks twice before it wakes anyone"
      text="Keepwatch retries every failure from two other regions within seconds and only pages when the problem is real."
      points={["Confirmed from three regions, or it doesn't count", "SMS, then a phone call, then the next person"]}
      more={{ label: "How alerts work", href: "/docs/alerts" }}
      visual={<LandingAlertTimeline />}
    />
  );
}
