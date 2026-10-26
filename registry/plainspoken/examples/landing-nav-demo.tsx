import { LandingNav } from "@/registry/plainspoken/blocks/landing/nav";

/** On the page it sticks to the top of the window; here it is static. Whole pages (Pricing) are marked when you are on them; anchors are not. */
export default function LandingNavDemo() {
  return (
    <LandingNav
      className="static"
      brand="Keepwatch"
      homeHref="/"
      currentHref="/pricing"
      links={[
        { key: "features", label: "Features", href: "/#features" },
        { key: "how", label: "How it works", href: "/#how-it-works" },
        { key: "pricing", label: "Pricing", href: "/pricing" },
        { key: "faq", label: "FAQ", href: "/#faq" },
      ]}
      signIn={{ label: "Sign in", href: "/sign-in" }}
      signUp={{ label: "Start free", href: "/signup" }}
    />
  );
}
