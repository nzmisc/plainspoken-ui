import { LandingCheckList, LandingSection } from "@/registry/plainspoken/blocks/landing/section";

/** A band of the page: eyebrow, h2, lead and content. tone="muted" makes the gray band that alternates with plain ones. */
export default function LandingSectionDemo() {
  return (
    <LandingSection
      id="demo-security"
      tone="muted"
      eyebrow="Security"
      title="Your data stays in the EU"
      lead="Check results are stored in Frankfurt, with a copy in Amsterdam, and deleted when your plan's history runs out."
    >
      <LandingCheckList items={["Encrypted at rest and in transit", "Single sign-on on the Business plan", "A data processing agreement on request"]} />
    </LandingSection>
  );
}
