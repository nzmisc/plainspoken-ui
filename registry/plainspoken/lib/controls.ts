/**
 * The height scale every control shares. Heights are fixed, border included, and never come from
 * the content, so a Button, an IconButton, an Input and a Select of one size are the same height
 * to the pixel, whatever the font or icon inside, and line up in a row.
 *
 *   xs 20px  inside running text and dense table rows
 *   sm 24px  toolbars, panel title bars, table row actions
 *   md 28px  the default: forms, dialogs, page headers
 *   lg 36px  touch screens, and a page's one big call to action
 *
 * A size is a set of CSS variables (--ctl-h, --ctl-px, --ctl-text...) written by the utilities
 * ctl-xs to ctl-lg, which the foundation item adds to your CSS. Variables inherit, so `ctl-sm` on a
 * toolbar makes every control inside it that has no size of its own small. No React context is
 * involved: it works in server components, and responsive variants work (`ctl-lg md:ctl-md`).
 */
export type ControlSize = "xs" | "sm" | "md" | "lg";

export const CONTROL_SIZES: readonly ControlSize[] = ["xs", "sm", "md", "lg"];

/** Pixel heights, for layout math (a toolbar's height, a virtual list's row height) */
export const CONTROL_HEIGHT: Record<ControlSize, number> = { xs: 20, sm: 24, md: 28, lg: 36 };

const SIZE_CLASS: Record<ControlSize, string> = { xs: "ctl-xs", sm: "ctl-sm", md: "ctl-md", lg: "ctl-lg" };

/** The class that sets a control size, or undefined to inherit the surrounding one (md at the root) */
export function controlSize(size?: ControlSize): string | undefined {
  return size ? SIZE_CLASS[size] : undefined;
}

/** Height, side padding, font size, gap and icon size of a text control, from the current size */
export const CONTROL_BOX =
  "h-(--ctl-h) px-(--ctl-px) gap-(--ctl-gap) text-(length:--ctl-text) leading-none [&_svg]:size-(--ctl-icon) [&_svg]:shrink-0";

/** A square control as wide as it is tall (icon buttons) */
export const CONTROL_SQUARE = "size-(--ctl-h) px-0";

/** The focus outline every control draws: 2px in the ring colour, 1px out from the edge */
export const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

/** The same outline on a wrapper whose inner <input> or <select> has keyboard-visible focus */
export const FOCUS_WITHIN_RING =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ring";
