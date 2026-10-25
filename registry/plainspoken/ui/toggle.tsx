"use client";

import { createContext, useContext, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { IconSlot, renderIcon, type IconLike } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type ToggleVariant = "default" | "outline" | "ghost";

/**
 * Pressed is more than a colour change: default and outline toggles fill with the main colour
 * (like the chosen segment of a SegmentedControl); a ghost toggle, which has no edge until
 * hovered, gains its border and a gray fill, so its outline changes as well as its shade.
 */
const PRESSED: Record<ToggleVariant, string> = {
  default: "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/88",
  outline: "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/88",
  ghost: "aria-pressed:border-input aria-pressed:bg-accent aria-pressed:hover:bg-accent",
};

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: ToggleVariant;
  /** Height from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  icon?: IconLike;
  /** Another icon while pressed: Repeat1 for "repeat one", BellOff for "muted" */
  iconPressed?: IconLike;
  /**
   * The accessible name, for an icon-only toggle (which is then square). It names the thing
   * switched on and off, "Shuffle", and stays the same pressed or not: aria-pressed says the state.
   */
  label?: string;
  /** Inside a ToggleGroup: this item's value */
  value?: string;
  ref?: Ref<HTMLButtonElement>;
}

interface GroupState {
  isOn: (value: string) => boolean;
  toggle: (value: string) => void;
  variant?: ToggleVariant;
}

const GroupContext = createContext<GroupState | null>(null);

/**
 * A button that stays pressed or not (aria-pressed): bold, mute, shuffle, like. On the shared
 * height scale with Button's variants (default, outline, ghost), so it lines up with buttons. Give
 * it words, or an icon and a `label`. Controlled (`pressed` + `onPressedChange`) or not
 * (`defaultPressed`). Space and Enter toggle it, as on any button.
 */
export function Toggle({
  pressed: ownPressed,
  defaultPressed = false,
  onPressedChange,
  variant: ownVariant,
  size,
  icon,
  iconPressed,
  label,
  value,
  className,
  children,
  onClick,
  type = "button",
  ...rest
}: ToggleProps) {
  const group = useContext(GroupContext);
  const [own, setOwn] = useState(defaultPressed);
  const inGroup = group != null && value != null;
  const pressed = inGroup ? group.isOn(value) : (ownPressed ?? own);
  const variant = ownVariant ?? group?.variant ?? "default";
  const iconOnly = children == null || children === false;
  const shown = pressed && iconPressed ? iconPressed : icon;
  return (
    <button
      type={type}
      data-slot="toggle"
      data-variant={variant}
      aria-pressed={pressed}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (inGroup) group.toggle(value);
        else {
          setOwn(!pressed);
          onPressedChange?.(!pressed);
        }
      }}
      className={cn(buttonVariants({ variant, size, square: iconOnly }), PRESSED[variant], className)}
      {...rest}
    >
      {shown && <IconSlot>{renderIcon(shown)}</IconSlot>}
      {!iconOnly && <span>{children}</span>}
    </button>
  );
}

interface ToggleGroupBase {
  /** Accessible name of the group: "Text style", "Playback" */
  label: string;
  variant?: ToggleVariant;
  /** Size for every toggle inside that doesn't set its own */
  size?: ControlSize;
  /** Butted together into one strip (default), or apart with a small gap */
  attached?: boolean;
  className?: string;
  children: ReactNode;
}

export interface ToggleGroupSingleProps extends ToggleGroupBase {
  /** single: at most one pressed at a time (pressing it again unpresses it); multiple: any number */
  type: "single";
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export interface ToggleGroupMultipleProps extends ToggleGroupBase {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

/** ←/→ (and ↑/↓, Home, End) move focus between the toggles of a group; Tab still stops at each one. */
function onArrow(e: KeyboardEvent<HTMLDivElement>) {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-slot=toggle]:not(:disabled)")];
  const i = items.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  e.preventDefault();
  const next =
    e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
  items[next].focus();
}

/**
 * Toggles that belong together, each with a `value`: text styles (multiple), alignment (single).
 * A group with a name, each item a toggle button with aria-pressed. For a required choice of one
 * where something is always chosen, a SegmentedControl (radios) says it better.
 */
export function ToggleGroup(props: ToggleGroupProps) {
  const { label, variant, size, attached = true, className, children } = props;
  const [ownSingle, setOwnSingle] = useState<string | null>(props.type === "single" ? (props.defaultValue ?? null) : null);
  const [ownMulti, setOwnMulti] = useState<string[]>(props.type === "multiple" ? (props.defaultValue ?? []) : []);
  let state: GroupState;
  if (props.type === "single") {
    const current = props.value !== undefined ? props.value : ownSingle;
    state = {
      variant,
      isOn: (v) => current === v,
      toggle: (v) => {
        const next = current === v ? null : v;
        setOwnSingle(next);
        props.onValueChange?.(next);
      },
    };
  } else {
    const current = props.value ?? ownMulti;
    state = {
      variant,
      isOn: (v) => current.includes(v),
      toggle: (v) => {
        const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
        setOwnMulti(next);
        props.onValueChange?.(next);
      },
    };
  }
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="toggle-group"
      onKeyDown={onArrow}
      className={cn(
        "inline-flex align-baseline",
        attached ? "[&>*+*]:-ml-px [&>*:focus-visible]:z-10 [&>*:hover]:z-[1] [&>[aria-pressed=true]]:z-[2]" : "gap-1",
        controlSize(size),
        className,
      )}
    >
      <GroupContext value={state}>{children}</GroupContext>
    </div>
  );
}
