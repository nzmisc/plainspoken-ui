import { LandingCta } from "@/registry/plainspoken/blocks/landing/cta";

export default function LandingCtaDemo() {
  return (
    <LandingCta
      title="Start with ten free checks"
      text="Add your first site in about a minute."
      action="/signup"
      note="No card needed. Delete your account and data at any time."
    />
  );
}
