import { LandingSignupForm } from "@/registry/plainspoken/blocks/landing/signup-form";

const PLANS = [
  { key: "hobby", name: "Hobby", monthly: 0, yearly: 0, summary: "10 checks, every 5 minutes" },
  { key: "team", name: "Team", monthly: 24, yearly: 240, summary: "100 checks, every 30 seconds" },
];

/** After a failed submission (a summary linking to each field, and the errors under them) and after a successful one. */
export default function LandingSignupFormStates() {
  return (
    <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
      <LandingSignupForm
        plans={PLANS}
        state="error"
        values={{ name: "Marta Kos", email: "marta@northwind" }}
        errors={{ email: "Enter an address like you@company.com", password: "Use at least 12 characters", terms: "Tick the box to agree to the terms" }}
      />
      <LandingSignupForm plans={PLANS} state="success" values={{ email: "marta@northwind.example" }} />
    </div>
  );
}
