import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "@/registry/plainspoken/lib/icons";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface LandingHeroAction {
  label: string;
  href: string;
}

export interface LandingHeroProps {
  /** A small boxed line above the headline: news, a launch */
  eyebrow?: ReactNode;
  /** The page's one h1 */
  title: ReactNode;
  /** What it is and why it matters, in two sentences */
  lead: ReactNode;
  /** The main call to action, drawn as the large primary button */
  primary: LandingHeroAction;
  /** The second one, as an outline button */
  secondary?: LandingHeroAction;
  /** Small print under the buttons: "No card needed" */
  note?: ReactNode;
  /** The picture under the text: a product screenshot, made of real components if you can */
  visual?: ReactNode;
  className?: string;
}

/**
 * The opening of a marketing page: a news badge, the headline as the page's h1, two sentences,
 * two calls to action (lg buttons, the one big control on the page) and a line of small print,
 * then the product itself underneath, as wide as the page.
 */
export function LandingHero({ eyebrow, title, lead, primary, secondary, note, visual, className }: LandingHeroProps) {
  return (
    <section data-slot="landing-hero" aria-label="Introduction" className={cn("border-b border-border bg-background", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-12 pb-12 sm:pt-20 sm:pb-16">
        <div className="flex max-w-[44rem] flex-col items-start gap-4">
          {eyebrow != null && (
            <Badge variant="info" icon={false} className="px-2 text-[13px] leading-[22px]">
              {eyebrow}
            </Badge>
          )}
          <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight text-balance sm:text-[46px]">{title}</h1>
          <p className="max-w-[60ch] text-[17px] leading-relaxed text-muted-foreground sm:text-[18px]">{lead}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={primary.href} className={buttonVariants({ variant: "primary", size: "lg" })}>
              {primary.label}
              <Icon icon={ArrowRight} />
            </Link>
            {secondary && (
              <Link href={secondary.href} className={buttonVariants({ variant: "outline", size: "lg" })}>
                {secondary.label}
              </Link>
            )}
          </div>
          {note != null && <p className="text-[13px] text-muted-foreground">{note}</p>}
        </div>
        {visual}
      </div>
    </section>
  );
}
