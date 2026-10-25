"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { ChevronDown, isGlyph, type Glyph } from "@/registry/plainspoken/lib/icons";
import { CONTROL_SQUARE } from "@/registry/plainspoken/lib/controls";
import { autoPlace, type Align, type Anchor, type Side } from "@/registry/plainspoken/lib/position";
import type { ButtonProps, ButtonVariant } from "@/registry/plainspoken/ui/button";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

export interface FloatingProps extends Omit<HTMLAttributes<HTMLDivElement>, "popover"> {
  open: boolean;
  /** Called when the browser opens or closes the layer itself: light dismiss, Escape, an invoker button. */
  onOpenChange?: (open: boolean) => void;
  /** Read on every reposition, so it can point at a ref or a moving point. */
  anchor: () => Anchor | null;
  /**
   * "auto": the browser closes it on Escape and on a click outside, and closes other "auto" layers
   * that are not its ancestors. "manual": stays until told to close (tooltips, hover cards).
   */
  mode?: "auto" | "manual";
  side?: Side;
  align?: Align;
  /** Gap to the anchor in px. Default 4, or 9 with an arrow. */
  offset?: number;
  /** Small pointer from the layer to the anchor's centre */
  arrow?: boolean;
  /** "span" when the layer may end up inside a paragraph (tooltips, hover cards in running text) */
  as?: "div" | "span";
  ref?: Ref<HTMLDivElement>;
}

/**
 * The shared base of every floating layer: a native `popover` element (top layer, so it is never
 * clipped by overflow or z-index), placed next to its anchor by lib/position, with a 1px border
 * and a light shadow. It resets the type to body text, since it inherits from wherever it sits in
 * the DOM (a bold table header, a small toolbar), and so do the control-size variables: a menu
 * under a `ctl-sm` toolbar is small too.
 *
 * Never give it a display utility (flex, grid, block): the browser hides a closed popover with
 * `display: none`, and a utility would override that. Lay out the content in a child instead.
 */
export function Floating({
  open,
  onOpenChange,
  anchor,
  mode = "auto",
  side = "bottom",
  align = "start",
  offset,
  arrow,
  className,
  style,
  children,
  ref,
  as = "div",
  onBeforeToggle,
  onToggle,
  ...rest
}: FloatingProps) {
  // Same props either way; the cast only keeps JSX's element typing simple.
  const Tag = as as "div";
  const el = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ anchor, onOpenChange, open });
  useLayoutEffect(() => {
    latest.current = { anchor, onOpenChange, open };
  });

  useLayoutEffect(() => {
    const f = el.current;
    if (!f) return;
    if (!open) {
      if (f.matches(":popover-open")) f.hidePopover();
      return;
    }
    if (!f.matches(":popover-open")) f.showPopover();
    return autoPlace(f, () => latest.current.anchor(), { side, align, offset: offset ?? (arrow ? 9 : 4) });
  }, [open, side, align, offset, arrow]);

  return (
    <Tag
      {...rest}
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="floating"
      popover={mode}
      // React hands a nested popover's (toggle, beforetoggle) events to its ancestors' handlers
      // too; only this layer's own events count, or closing a submenu would close the whole menu.
      onBeforeToggle={(e) => {
        if (e.target === e.currentTarget) onBeforeToggle?.(e);
      }}
      onToggle={(e) => {
        if (e.target !== e.currentTarget) return;
        const isOpen = e.newState === "open";
        if (isOpen !== latest.current.open) latest.current.onOpenChange?.(isOpen);
        onToggle?.(e);
      }}
      className={cn(
        "group/floating m-0 max-w-[calc(100vw-12px)] overflow-visible border border-border bg-popover p-0 text-left text-[14px] leading-normal font-normal text-popover-foreground normal-case shadow-md [&:not([data-side])]:invisible",
        className,
      )}
      style={{ inset: "auto", ...style }}
    >
      {arrow && <FloatingArrow />}
      {children}
    </Tag>
  );
}

/** A bordered square turned 45°, half of it poking out of the layer's edge facing the anchor. */
function FloatingArrow() {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute size-3 rotate-45 border-border bg-inherit",
        "group-data-[side=bottom]/floating:-top-[7px] group-data-[side=bottom]/floating:left-(--arrow) group-data-[side=bottom]/floating:-ml-[6px] group-data-[side=bottom]/floating:border-t group-data-[side=bottom]/floating:border-l",
        "group-data-[side=top]/floating:-bottom-[7px] group-data-[side=top]/floating:left-(--arrow) group-data-[side=top]/floating:-ml-[6px] group-data-[side=top]/floating:border-r group-data-[side=top]/floating:border-b",
        "group-data-[side=right]/floating:top-(--arrow) group-data-[side=right]/floating:-left-[7px] group-data-[side=right]/floating:-mt-[6px] group-data-[side=right]/floating:border-b group-data-[side=right]/floating:border-l",
        "group-data-[side=left]/floating:top-(--arrow) group-data-[side=left]/floating:-right-[7px] group-data-[side=left]/floating:-mt-[6px] group-data-[side=left]/floating:border-t group-data-[side=left]/floating:border-r",
      )}
    />
  );
}

/**
 * Open state that is controlled when `open` is given and kept here otherwise. The setter calls
 * `onOpenChange` either way. While `disabled` it is always closed, whatever `open` says, and
 * refuses to open.
 */
export function useOpenState(open: boolean | undefined, defaultOpen: boolean, onOpenChange?: (open: boolean) => void, disabled = false) {
  const [own, setOwn] = useState(defaultOpen && !disabled);
  // Disabling closes it for good: enabling again doesn't bring back an old open state.
  if (disabled && own) setOwn(false);
  const current = !disabled && (open ?? own);
  const set = (next: boolean) => {
    if (disabled && next) return;
    if (open === undefined) setOwn(next);
    if (next !== current) onOpenChange?.(next);
  };
  return [current, set] as const;
}

/**
 * Puts focus back on `target()` when a layer closes with focus inside it (Escape, an item
 * chosen), since the focused element is about to disappear. Call `decide(false)` before closing
 * when focus should stay where it goes (Tab moves on to the next control). Spread `onBeforeToggle`
 * and `onToggle` onto the Floating.
 */
export function useReturnFocus(layer: RefObject<HTMLElement | null>, target: () => HTMLElement | null | undefined) {
  const decided = useRef<boolean | null>(null);
  return {
    decide: (back: boolean) => {
      decided.current = back;
    },
    onBeforeToggle: (e: { newState: string }) => {
      if (e.newState === "closed" && decided.current === null) decided.current = !!layer.current?.contains(document.activeElement);
    },
    onToggle: (e: { newState: string }) => {
      if (e.newState !== "closed") return;
      if (decided.current) target()?.focus();
      decided.current = null;
    },
  };
}

/** What a custom trigger must put on its button, from `trigger={(props) => <button {...props}>…</button>}` */
export interface TriggerRenderProps {
  ref: Ref<HTMLButtonElement>;
  id?: string;
  type: "button";
  popoverTarget?: string;
  "aria-haspopup": "dialog" | "menu";
  "aria-expanded": boolean;
  "aria-controls": string;
  /** The trigger is disabled: draw it so. (popoverTarget is left out then, so it can't open the layer anyway.) */
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
}

export interface TriggerProps {
  /**
   * The button that opens the layer: words; a glyph, for a square icon-only button named by
   * `label`; or a function that draws your own button (an avatar, a link-styled button) from the
   * props it must spread onto it.
   */
  trigger: ReactNode | Glyph | ((props: TriggerRenderProps) => ReactNode);
  /** Add a ⌄ after the words */
  chevron?: boolean;
  triggerVariant?: ButtonVariant;
  /** Height of the trigger and of what opens from it. Leave out to take the surrounding size. */
  size?: ControlSize;
  triggerClassName?: string;
  /**
   * Disable the trigger: the built-in button is disabled, and the layer never opens (not by click,
   * keyboard or a controlled `open`; an open one closes). A custom trigger function gets
   * `disabled` to draw its own.
   */
  disabled?: boolean;
}

/** Draws a custom trigger from `trigger={(props) => …}` (a component, so the props stay props) */
export function TriggerSlot({ render, ...props }: TriggerRenderProps & { render: (props: TriggerRenderProps) => ReactNode }) {
  return render(props);
}

/** Props for the Button that opens a popover or menu: square and labelled for a glyph, else words and an optional chevron. */
export function triggerButton(
  { trigger, chevron, triggerVariant, size, triggerClassName, disabled }: Omit<TriggerProps, "trigger"> & { trigger: ReactNode | Glyph },
  label: string | undefined,
): ButtonProps {
  if (isGlyph(trigger))
    return { variant: triggerVariant, size, disabled, icon: trigger, "aria-label": label, title: label, className: cn(CONTROL_SQUARE, triggerClassName) };
  return { variant: triggerVariant, size, disabled, iconEnd: chevron ? ChevronDown : undefined, className: triggerClassName, children: trigger };
}
