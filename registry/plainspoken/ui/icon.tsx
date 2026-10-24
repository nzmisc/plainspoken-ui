import { createElement, isValidElement, type ReactElement, type ReactNode, type SVGProps } from "react";
import { isGlyph, type Glyph } from "@/registry/plainspoken/lib/icons";
import { cn } from "@/lib/utils";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "width" | "height"> {
  /** An icon from lib/icons, e.g. `import { Check } from "@/lib/icons"` */
  icon: Glyph;
  /** Accessible name. Leave it out when text next to the icon already says the same thing. */
  label?: string;
  /** Width and height. Default 1.1em, so the icon scales with the text around it. Inside a control the control sets it. */
  size?: number | string;
}

/**
 * Draws an icon the house way: square, 2px stroke on the 24px grid, round caps and joins, in the
 * current text colour, sitting on the text baseline. Decorative (aria-hidden) unless it has a
 * `label`. Every component draws its icons through this, so size and stroke change in one place.
 */
export function Icon({ icon, label, size = "1.1em", strokeWidth = 2, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-icon={icon.name}
      className={cn("inline-block shrink-0 align-[-0.15em]", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...rest}
    >
      {icon.nodes.map(([shape, attrs], i) => createElement(shape, { key: i, ...attrs }))}
    </svg>
  );
}

/** What components accept where an icon goes: a glyph, or an element when it needs its own classes (a spinning loader) */
export type IconLike = Glyph | ReactElement;

/** Draws an IconLike: a glyph through <Icon>, an element as it is */
export function renderIcon(icon: IconLike): ReactNode {
  if (isGlyph(icon)) return <Icon icon={icon} />;
  return isValidElement(icon) ? icon : null;
}

/**
 * Wraps an icon so it lines up on the text baseline like a word would. The zero-width space gives
 * the span a text baseline at the same height as a label's; without it a row that starts with an
 * icon (or is only an icon) takes its baseline from the icon's bottom edge and sits about 3px high
 * next to running text or a baseline-aligned label.
 */
export function IconSlot({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center", className)}>
      {"​"}
      {children}
    </span>
  );
}
