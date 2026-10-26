"use client";

import { usePathname } from "next/navigation";
import { BookOpen } from "@/registry/plainspoken/lib/icons";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Navbar } from "@/registry/plainspoken/ui/navbar";
import { BibleSearchForm } from "@/registry/plainspoken/blocks/bible/search-form";

export interface BibleHeaderProps {
  /** Where the reader lives: the books at basePath, search at basePath/search */
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  brand?: string;
  /** The current pathname; read from next/navigation when left out */
  pathname?: string;
}

/**
 * The reader's top bar: its name, links to the books and to search (the current one marked), and
 * a search box on the right, except on the search page, which has its own. On phones the links
 * and the search box fold into the Menu button.
 */
export function BibleHeader({ basePath = "/bible", linkAs, brand = "King James Bible", pathname }: BibleHeaderProps) {
  const routerPath = usePathname();
  const here = pathname ?? routerPath ?? basePath;
  const searchPath = `${basePath}/search`;
  return (
    <Navbar
      brand={
        <span className="inline-flex items-center gap-1.5">
          <Icon icon={BookOpen} />
          {brand}
        </span>
      }
      brandHref={basePath}
      linkAs={linkAs}
      currentHref={here}
      label="Bible"
      links={[
        { key: "books", label: "Books", href: basePath },
        { key: "search", label: "Search", href: searchPath },
      ]}
      actions={here.startsWith(searchPath) ? undefined : <BibleSearchForm action={searchPath} size="sm" placeholder="Search the KJV" className="w-64" />}
    />
  );
}
