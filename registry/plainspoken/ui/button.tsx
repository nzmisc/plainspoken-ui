import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { LoaderCircle } from "@/registry/plainspoken/lib/icons";
import { CONTROL_BOX, CONTROL_SQUARE, FOCUS_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Icon, IconSlot, renderIcon, type IconLike } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";

/**
 * Every variant has a 1px border, transparent where none shows, so all of them are exactly the
 * same height and width for the same content, and swapping one for another never moves anything.
 */
const VARIANT: Record<ButtonVariant, string> = {
  default: "border-input bg-secondary text-secondary-foreground hover:bg-accent active:bg-accent",
  primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/88 active:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-accent active:bg-accent",
  outline: "border-input bg-transparent text-foreground hover:bg-secondary active:bg-accent",
  destructive: "border-destructive bg-background text-destructive hover:bg-destructive hover:text-background active:bg-destructive",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-secondary active:bg-accent",
  link: "border-transparent bg-transparent px-0 font-normal text-link underline underline-offset-2 hover:decoration-2",
};

/** When drawn on an <a>: undo a global link look (underline, visited purple) for every variant but link */
const ON_LINK: Record<ButtonVariant, string> = {
  default: "no-underline visited:text-secondary-foreground",
  primary: "no-underline visited:text-primary-foreground",
  secondary: "no-underline visited:text-secondary-foreground",
  outline: "no-underline visited:text-foreground",
  destructive: "no-underline visited:text-destructive hover:visited:text-background",
  ghost: "no-underline visited:text-foreground",
  link: "visited:text-link-visited",
};

const BASE = cn(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center border font-medium whitespace-nowrap select-none",
  CONTROL_BOX,
  FOCUS_RING,
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
);

export interface ButtonVariantsOptions {
  variant?: ButtonVariant;
  /** Leave out to take the surrounding size (md at the root) */
  size?: ControlSize;
  /** Square, for a single icon */
  square?: boolean;
  className?: string;
}

/**
 * A button's classes, for an element that must look like one but isn't a <button>: a link drawn
 * as a call to action, `<a className={buttonVariants({ variant: "primary" })}>`. Includes the
 * overrides that stop a global link style (underline, visited colour) from showing through.
 */
export function buttonVariants({ variant = "default", size, square = false, className }: ButtonVariantsOptions = {}): string {
  return cn(BASE, "gap-(--ctl-gap)", controlSize(size), VARIANT[variant], ON_LINK[variant], square && CONTROL_SQUARE, className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Height from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  /** Icon before the label: a glyph, or an <Icon> element when it needs its own classes */
  icon?: IconLike;
  /** Icon after the label: a chevron on a menu button, an arrow on "Next" */
  iconEnd?: IconLike;
  /** Spinner over the label, which stays (invisible) so the width doesn't change. Disables the button. */
  loading?: boolean;
  /** Fill the width of the container, e.g. stacked buttons on a phone */
  block?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A button on the shared height scale, so it lines up with Input, Select, SegmentedControl and
 * Checkbox of the same size. Variants:
 * - default: gray with a border, for most actions
 * - primary: the one main action in a view, in the main colour
 * - secondary: gray, no border, for actions next to a primary one or inside bordered things
 * - outline: a border and no fill, quieter than default
 * - destructive: actions that delete or can't be undone
 * - ghost: no border or fill until hovered, for toolbars and table cells (where a border would
 *   double up with the cell's)
 * - link: looks like a link, for actions inside text
 * Always type="button" unless you pass type="submit".
 */
export function Button({
  variant = "default",
  size,
  icon,
  iconEnd,
  loading = false,
  block = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, controlSize(size), VARIANT[variant], block && "flex w-full", className)}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-(--ctl-gap)", loading && "invisible")}>
        {icon && <IconSlot>{renderIcon(icon)}</IconSlot>}
        {children != null && children !== false && <span>{children}</span>}
        {iconEnd && <IconSlot>{renderIcon(iconEnd)}</IconSlot>}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Icon icon={LoaderCircle} className="animate-spin motion-reduce:animate-none" />
        </span>
      )}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, "children" | "icon" | "iconEnd" | "block"> {
  icon: IconLike;
  /** What the button does: the accessible name and the hover title. Required, since an icon alone says nothing. */
  label: string;
}

/** A square button holding one icon: as wide as it is tall, so it is exactly a text button's height. */
export function IconButton({ icon, label, className, ...rest }: IconButtonProps) {
  return <Button aria-label={label} title={label} icon={icon} className={cn(CONTROL_SQUARE, className)} {...rest} />;
}

/**
 * Buttons butted together into one strip, for related actions. Borders overlap by a pixel so the
 * seams are single lines; hovered and focused buttons come to the front so their whole edge shows.
 */
export function ButtonGroup({ children, label, size, className }: { children: ReactNode; label: string; size?: ControlSize; className?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex [&>*+*]:-ml-px [&>*:focus-visible]:z-10 [&>*:hover]:z-[1]", controlSize(size), className)}
    >
      {children}
    </div>
  );
}
