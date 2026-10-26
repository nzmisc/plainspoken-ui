import { LandingSignupForm } from "@/registry/plainspoken/blocks/landing/signup-form";

const PLANS = [
  { key: "hobby", name: "Hobby", monthly: 0, yearly: 0, summary: "10 checks, every 5 minutes" },
  { key: "team", name: "Team", monthly: 24, yearly: 240, summary: "100 checks, every 30 seconds" },
  { key: "business", name: "Business", monthly: 79, yearly: 790, summary: "500 checks, every 10 seconds" },
];

export default function LandingSignupFormDemo() {
  return <LandingSignupForm plans={PLANS} defaultPlan="team" className="max-w-2xl" />;
}
