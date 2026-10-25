import { LandingPricing } from "@/registry/plainspoken/blocks/landing/pricing";

/** Switch between Monthly and Yearly: every price changes, and yearly ones show the total billed. */
export default function LandingPricingDemo() {
  return (
    <LandingPricing
      signupHref="/signup"
      plans={[
        { key: "hobby", name: "Hobby", description: "For side projects.", monthly: 0, yearly: 0, cta: "Start free", features: ["10 checks, every 5 minutes", "Email alerts"] },
        {
          key: "team",
          name: "Team",
          description: "For a product with customers.",
          monthly: 24,
          yearly: 240,
          cta: "Start a 14-day trial",
          highlight: "Most teams pick this",
          features: ["100 checks, every 30 seconds", "SMS and phone alerts", "On-call schedules"],
        },
        { key: "business", name: "Business", description: "For several teams.", monthly: 79, yearly: 790, cta: "Start a 14-day trial", features: ["500 checks, every 10 seconds", "Single sign-on", "99.95% SLA"] },
      ]}
    />
  );
}
