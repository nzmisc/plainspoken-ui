"use client";

import { createContext, use, useState } from "react";
import type { NavLinkProps } from "@/registry/plainspoken/lib/nav";
import { Navbar } from "@/registry/plainspoken/ui/navbar";

const LINKS = [
  { key: "home", label: "Home", href: "/" },
  { key: "blog", label: "Writing", href: "/blog" },
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "about", label: "About", href: "/about" },
];

const Navigate = createContext<(href: string) => void>(() => {});

/** Stands in for next/link's Link: the same props, but it only changes the pathname in state. */
function FakeLink({ href, onClick, ...rest }: NavLinkProps) {
  const navigate = use(Navigate);
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}

/**
 * With a router: pass its link component as linkAs and the pathname as currentHref (in Next.js,
 * linkAs={NextLink} from the next-link item and currentHref={usePathname()}). The link with the longest matching path is
 * marked, so "/blog/plain-html-in-2026" marks Writing.
 */
export default function NavbarRouter() {
  const [pathname, setPathname] = useState("/blog/plain-html-in-2026");
  return (
    <Navigate value={setPathname}>
      <div className="flex flex-col gap-2">
        <Navbar brand="Ines Moreau" brandHref="/" links={LINKS} linkAs={FakeLink} currentHref={pathname} />
        <p className="text-[13px] text-muted-foreground">
          pathname: <code className="font-mono">{pathname}</code>
        </p>
      </div>
    </Navigate>
  );
}
