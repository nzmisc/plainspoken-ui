"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Navbar, type NavbarLink } from "@/registry/plainspoken/ui/navbar";
import { cn } from "@/lib/utils";

export interface LandingNavProps {
  /** The product's name or logo */
  brand: ReactNode;
  homeHref: string;
  /** Section anchors and pages: Features, Pricing, FAQ */
  links: NavbarLink[];
  /** The secondary action, e.g. "Sign in" */
  signIn?: { label: string; href: string };
  /** The main action, e.g. "Start free" */
  signUp: { label: string; href: string };
  /** The current pathname. Leave out to read it from the router. */
  currentHref?: string;
  className?: string;
}

/**
 * The top bar of a marketing site, stuck to the top of the window as you scroll: the product
 * name, links to the page's sections and to other pages (the one you are on in bold), and the
 * sign-in and sign-up buttons. On phones the links and buttons fold into a Menu panel. A skip link
 * comes first, for an element with id="main".
 */
export function LandingNav({ brand, homeHref, links, signIn, signUp, currentHref, className }: LandingNavProps) {
  const pathname = usePathname();
  const path = currentHref ?? pathname ?? "";
  // Only whole pages are marked as current, not anchors on the page you are reading
  const current = links.find((l) => !l.href.includes("#") && l.href === path)?.key;
  return (
    <>
      <a
        href="#main"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-3 focus:py-1 focus:text-foreground",
          FOCUS_RING,
        )}
      >
        Skip to content
      </a>
      <Navbar
        brand={brand}
        brandHref={homeHref}
        links={links}
        current={current}
        linkAs={Link}
        label="Main"
        className={cn("sticky top-0 z-30 [&>div]:mx-auto [&>div]:max-w-6xl [&>div]:px-2 sm:[&>div]:px-4", className)}
        actions={
          <>
            {signIn && (
              <Link href={signIn.href} className={buttonVariants({ variant: "ghost" })}>
                {signIn.label}
              </Link>
            )}
            <Link href={signUp.href} className={buttonVariants({ variant: "primary" })}>
              {signUp.label}
            </Link>
          </>
        }
      />
    </>
  );
}
