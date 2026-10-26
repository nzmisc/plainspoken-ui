import { LandingCta } from "@/registry/plainspoken/blocks/landing/cta";

/** The error and success states, which your form handler chooses with `state`. */
export default function LandingCtaStates() {
  return (
    <div className="flex flex-col gap-4">
      <LandingCta title="Start with ten free checks" action="/signup" state="error" email="marta@northwind" error="That address is missing its ending, like .com" />
      <LandingCta title="Start with ten free checks" action="/signup" state="success" email="marta@northwind.example" />
    </div>
  );
}
