import Link from "next/link";
import { useId, type ReactNode } from "react";
import { ArrowRight } from "@/registry/plainspoken/lib/icons";
import { LandingCheckList } from "@/registry/plainspoken/blocks/landing/section";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface LandingFeatureSplitProps {
  /** A short line above the heading */
  eyebrow?: ReactNode;
  /** The feature's heading (h3 by default: these sit inside a section) */
  title: ReactNode;
  as?: "h2" | "h3";
  /** A paragraph on what it does and why it matters */
  text: ReactNode;
  /** Three or so short claims, each with a check mark */
  points?: string[];
  /** A link to more: "See the status page docs" */
  more?: { label: string; href: string };
  /** The picture: a piece of the product built from components */
  visual: ReactNode;
  /** Picture on the left, text on the right. Alternate it down the page. */
  reverse?: boolean;
  className?: string;
}

/**
 * One feature told at length: heading, paragraph and checked points on one side, a picture of
 * that part of the product on the other. Alternate `reverse` down the page for the zigzag
 * marketing pages are known for; on phones the text always comes first.
 */
export function LandingFeatureSplit({ eyebrow, title, as: H = "h3", text, points, more, visual, reverse = false, className }: LandingFeatureSplitProps) {
  const id = useId();
  return (
    <article
      data-slot="landing-feature-split"
      aria-labelledby={id}
      className={cn("grid items-center gap-x-12 gap-y-6 lg:grid-cols-2", className)}
    >
      <div className={cn("flex min-w-0 flex-col gap-3", reverse && "lg:order-2")}>
        {eyebrow != null && <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>}
        <H id={id} className="text-[22px] leading-tight font-bold text-balance sm:text-[24px]">
          {title}
        </H>
        <p className="text-[16px] leading-relaxed text-muted-foreground">{text}</p>
        {points && points.length > 0 && (
          <LandingCheckList items={points} className="text-[15px]" />
        )}
        {more && (
          <p>
            <Link href={more.href} className={cn(linkVariants(), "inline-flex items-baseline gap-1")}>
              {more.label}
              <Icon icon={ArrowRight} />
            </Link>
          </p>
        )}
      </div>
      <div className={cn("min-w-0", reverse && "lg:order-1")}>{visual}</div>
    </article>
  );
}
