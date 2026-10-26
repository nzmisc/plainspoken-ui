import { LandingFooter } from "@/registry/plainspoken/blocks/landing/footer";

export default function LandingFooterDemo() {
  return (
    <LandingFooter
      brand="Keepwatch"
      tagline="Uptime monitoring that only wakes you for real outages."
      columns={[
        { title: "Product", links: [{ label: "Features", href: "/#features" }, { label: "Pricing", href: "/pricing" }] },
        { title: "Get started", links: [{ label: "Create an account", href: "/signup" }, { label: "Questions", href: "/#faq" }] },
        { title: "Contact", links: [{ label: "Support", href: "mailto:support@keepwatch.example" }, { label: "Sales", href: "mailto:sales@keepwatch.example" }] },
      ]}
      smallPrint="© 2026 Keepwatch."
    />
  );
}
