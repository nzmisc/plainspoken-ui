import Link from "next/link";
import type { ReactNode } from "react";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface BlogFooterLink {
  label: string;
  href: string;
}

export interface BlogFooterProps {
  name: string;
  /** A line under the name: what the site is about */
  tagline?: ReactNode;
  links: BlogFooterLink[];
  /** The last line: copyright, licence, "no tracking" */
  smallPrint?: ReactNode;
  className?: string;
}

/** Internal paths go through next/link; mailto:, feeds and other sites stay plain links. */
function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const cls = linkVariants({ variant: "muted" });
  return href.startsWith("/") && !href.endsWith(".xml") ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

/**
 * The bottom of a personal site: the name and a line about it, a row of links (writing, about,
 * feed, email) and the small print. Gray links, since they are site navigation and not part of
 * the text.
 */
export function BlogFooter({ name, tagline, links, smallPrint, className }: BlogFooterProps) {
  return (
    <footer data-slot="blog-footer" className={cn("border-t border-border bg-muted", className)}>
      <div className="mx-auto grid max-w-5xl gap-x-8 gap-y-3 px-4 py-5 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-[14px] font-semibold">{name}</p>
          {tagline != null && <p className="text-muted-foreground">{tagline}</p>}
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
            {links.map((l) => (
              <li key={l.href}>
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>
        {smallPrint != null && <p className="text-[12px] text-muted-foreground sm:col-span-2">{smallPrint}</p>}
      </div>
    </footer>
  );
}
