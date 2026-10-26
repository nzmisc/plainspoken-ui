import Link from "next/link";
import type { ReactNode } from "react";
import type { Glyph } from "@/registry/plainspoken/lib/icons";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface BlogIntroLink {
  label: string;
  href: string;
  icon?: Glyph;
}

export interface BlogIntroProps {
  /** The page's one h1: "Hi, I'm Ines." */
  greeting: ReactNode;
  /** A paragraph or two about who you are and what you write about */
  children: ReactNode;
  /** A picture beside the text on wide screens, above it on phones: BlogPortrait or an <img> */
  portrait?: ReactNode;
  /** A few ways in: email, feed, code. Drawn as small outline buttons. */
  links?: BlogIntroLink[];
  className?: string;
}

/**
 * The top of a personal site's home page: a short greeting as the page's heading, a paragraph or
 * two in a slightly larger size, a portrait, and a row of links for getting in touch. Paragraph
 * links inside `children` are ordinary blue links.
 */
export function BlogIntro({ greeting, children, portrait, links, className }: BlogIntroProps) {
  return (
    <section data-slot="blog-intro" aria-label="Introduction" className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6", className)}>
      {portrait != null && <div className="shrink-0 sm:order-2">{portrait}</div>}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h1 className="text-[28px] leading-tight font-bold text-balance">{greeting}</h1>
        <div className="flex flex-col gap-2 text-[16px] leading-relaxed [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2 [&_a:visited]:text-link-visited">
          {children}
        </div>
        {links && links.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {links.map((l) => {
              const cls = buttonVariants({ variant: "outline", size: "sm" });
              const inner = (
                <>
                  {l.icon && <Icon icon={l.icon} />}
                  {l.label}
                </>
              );
              return (
                <li key={l.href}>
                  {l.href.startsWith("/") && !l.href.endsWith(".xml") ? (
                    <Link href={l.href} className={cls}>
                      {inner}
                    </Link>
                  ) : (
                    <a href={l.href} className={cls}>
                      {inner}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
