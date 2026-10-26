"use client";

import { usePathname } from "next/navigation";
import { BookUser, CreditCard, Library, LogOut, Settings } from "@/registry/plainspoken/lib/icons";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Navbar } from "@/registry/plainspoken/ui/navbar";
import { LibrarySearchForm } from "@/registry/plainspoken/blocks/library/search-form";

export interface LibraryHeaderProps {
  /** Where the catalogue lives: search, book pages, account and branches are under it */
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** The library's name, in the bar */
  name?: string;
  /** The signed-in patron, for the account menu */
  patron?: string;
  /** The current pathname; read from next/navigation when left out */
  pathname?: string;
}

/**
 * The catalogue's top bar: the library's name, links to the catalogue, search, branches and the
 * patron's account (the current one marked), a small search box (not on pages that have their
 * own), and an account menu. On phones the links fold into the Menu button.
 */
export function LibraryHeader({ basePath = "/library", linkAs, name = "Public Library", patron = "Ada Okafor", pathname }: LibraryHeaderProps) {
  const routerPath = usePathname();
  const here = pathname ?? routerPath ?? basePath;
  const ownSearch = here === basePath || here.startsWith(`${basePath}/search`);
  return (
    <Navbar
      brand={
        <span className="inline-flex items-center gap-1.5">
          <Icon icon={Library} />
          {name}
        </span>
      }
      brandHref={basePath}
      linkAs={linkAs}
      currentHref={here}
      label="Catalogue"
      links={[
        { key: "home", label: "Catalogue", href: basePath },
        { key: "search", label: "Search", href: `${basePath}/search` },
        { key: "branches", label: "Branches & hours", href: `${basePath}/branches` },
        { key: "account", label: "My account", href: `${basePath}/account` },
      ]}
      actions={
        <>
          {!ownSearch && <LibrarySearchForm action={`${basePath}/search`} compact size="sm" className="w-60" />}
          <DropdownMenu
            align="end"
            size="sm"
            label={`Account: ${patron}`}
            trigger={(props) => (
              <Button {...props} size="sm" variant="ghost" className="gap-1.5 pl-0.5">
                <Avatar name={patron} size={20} />
                <span className="hidden lg:inline">{patron}</span>
              </Button>
            )}
            items={[
              { type: "label", label: patron },
              { label: "Loans and holds", icon: BookUser, href: `${basePath}/account` },
              { label: "Fines and fees", icon: CreditCard, href: `${basePath}/account#fines` },
              { label: "Settings", icon: Settings, disabled: true, hint: "Not in this demo" },
              { type: "separator" },
              { label: "Sign out", icon: LogOut, onSelect: () => {} },
            ]}
          />
        </>
      }
    />
  );
}
