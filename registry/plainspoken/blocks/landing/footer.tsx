import Link from "next/link";
import type { ReactNode } from "react";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface LandingFooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface LandingFooterProps {
  /** The product's name or logo */
  brand: ReactNode;
  /** A line under the brand */
  tagline?: ReactNode;
  columns: LandingFooterColumn[];
  /** Copyright and legal lines */
  smallPrint?: ReactNode;
  className?: string;
}

/**
 * The bottom of a marketing site: brand and tagline, then columns of links under small headings
 * (two columns on phones), then the small print. Links are gray and underlined: they are the
 * site's map, not part of a sentence.
 */
export function LandingFooter({ brand, tagline, columns, smallPrint, className }: LandingFooterProps) {
  const cls = linkVariants({ variant: "muted" });
  return (
    <footer data-slot="landing-footer" className={cn("bg-background", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
          <div className="flex flex-col gap-1">
            <p className="text-[16px] font-bold">{brand}</p>
            {tagline != null && <p className="max-w-[36ch] text-muted-foreground">{tagline}</p>}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((c) => (
              <div key={c.title} className="flex flex-col gap-2">
                <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{c.title}</h2>
                <ul className="flex flex-col gap-1.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      {l.href.startsWith("/") ? (
                        <Link href={l.href} className={cls}>
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className={cls}>
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        {smallPrint != null && <p className="border-t border-border pt-4 text-[12px] text-muted-foreground">{smallPrint}</p>}
      </div>
    </footer>
  );
}
