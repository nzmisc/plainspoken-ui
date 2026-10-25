import type { AnchorHTMLAttributes } from "react";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";

// Stands in for your router's link component (next/link's Link, React Router's Link)
function RouterLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} />;
}

/** linkVariants() gives your router's link the same look: <Link href="/pricing" className={linkVariants()}>. */
export default function TextLinkRouter() {
  return (
    <p>
      Compare the plans on the{" "}
      <RouterLink href="#pricing" className={linkVariants()}>
        pricing page
      </RouterLink>
      , or{" "}
      <RouterLink href="#sales" className={linkVariants({ variant: "muted" })}>
        talk to sales
      </RouterLink>
      .
    </p>
  );
}
