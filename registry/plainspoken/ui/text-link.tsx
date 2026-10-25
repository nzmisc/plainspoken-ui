import type { AnchorHTMLAttributes, Ref } from "react";
import { ExternalLink } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type LinkVariant = "default" | "muted";

const VARIANT: Record<LinkVariant, string> = {
  default: "text-link visited:text-link-visited",
  muted: "text-muted-foreground visited:text-muted-foreground hover:text-foreground",
};

export interface LinkVariantsOptions {
  /** default: blue, purple once visited. muted: gray, for footers and fine print. */
  variant?: LinkVariant;
  className?: string;
}

/**
 * A text link's classes, for your router's link component: `<Link href="/pricing"
 * className={linkVariants()}>`. Underlined in the link colour, purple once visited, a thicker
 * underline on hover, and the focus outline.
 */
export function linkVariants({ variant = "default", className }: LinkVariantsOptions = {}): string {
  return cn("underline underline-offset-2 hover:decoration-2", VARIANT[variant], FOCUS_RING, className);
}

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkVariant;
  /**
   * A link to another site: adds the external-link mark, opens in a new tab (unless you set
   * `target`), with rel="noopener noreferrer", and tells screen readers it opens a new tab.
   */
  external?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * A link in running text that looks like one: underlined, in the link colour, purple once
 * visited. For links between your own pages use your router's link with `linkVariants()`; for
 * navigation (sidebars, tabs, menus) don't use this at all: those are not blue.
 */
export function TextLink({ variant, external = false, target, rel, className, children, ...rest }: TextLinkProps) {
  const newTab = (target ?? (external ? "_blank" : undefined)) === "_blank";
  return (
    <a
      data-slot="text-link"
      target={target ?? (external ? "_blank" : undefined)}
      rel={rel ?? (external ? "noopener noreferrer" : undefined)}
      className={linkVariants({ variant, className })}
      {...rest}
    >
      {children}
      {external && (
        // nowrap: the line may not break between the last word and the mark
        <span className="whitespace-nowrap">
          {" "}
          <Icon icon={ExternalLink} size="0.85em" />
        </span>
      )}
      {newTab && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
