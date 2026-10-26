"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SiteNavItem {
  href: string;
  label: string;
  /** Not a page of the Next app (Storybook's static files, GitHub): a plain <a> */
  external?: boolean;
}

/** Top-level sections; the current one is bold and underlined so it reads without colour. */
export function SiteNav({ items }: { items: SiteNavItem[] }) {
  const path = usePathname();
  const current = (href: string) =>
    href === "/docs" ? path === "/docs" || (path.startsWith("/docs/") && !path.startsWith("/docs/components")) : path === href || path.startsWith(href + "/");
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
        {items.map((item) => {
          const on = !item.external && current(item.href);
          const cls = cn("text-foreground underline-offset-4 hover:underline", on ? "font-semibold underline decoration-2" : "no-underline");
          return (
            <li key={item.href}>
              {item.external ? (
                <a href={item.href} className={cls}>
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className={cls} aria-current={on ? "page" : undefined}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
