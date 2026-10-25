import { LandingHero } from "@/registry/plainspoken/blocks/landing/hero";

/** Without a visual. Pass LandingProductShot (or any picture) as `visual` to show the product under the text. */
export default function LandingHeroDemo() {
  return (
    <LandingHero
      eyebrow="New: phone-call escalation on every paid plan"
      title="Uptime monitoring that only wakes you for real outages"
      lead="Keepwatch checks your sites, APIs and cron jobs every 30 seconds from six regions, and confirms every failure before it pages anyone."
      primary={{ label: "Start monitoring free", href: "/signup" }}
      secondary={{ label: "See pricing", href: "/pricing" }}
      note="Free for 10 checks. No card, no trial clock."
    />
  );
}
