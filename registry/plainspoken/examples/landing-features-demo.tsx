import { BellRing, Globe, LayoutDashboard, Timer } from "@/registry/plainspoken/lib/icons";
import { LandingFeatures } from "@/registry/plainspoken/blocks/landing/features";

export default function LandingFeaturesDemo() {
  return (
    <LandingFeatures
      columns={2}
      features={[
        { icon: Globe, title: "HTTP, API and TCP checks", text: "Status codes, bodies, headers and timings, from six regions." },
        { icon: Timer, title: "Cron heartbeats", text: "Jobs ping a URL when they finish; a late ping is an alert." },
        { icon: BellRing, title: "Confirmed alerts", text: "A failure is retried from three regions before it counts." },
        { icon: LayoutDashboard, title: "Status pages", text: "A public page on your own domain that updates from your checks." },
      ]}
    />
  );
}
