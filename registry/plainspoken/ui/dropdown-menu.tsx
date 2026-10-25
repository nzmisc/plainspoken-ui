"use client";

import { useEffect, useId, useRef } from "react";
import { controlSize } from "@/registry/plainspoken/lib/controls";
import type { Side } from "@/registry/plainspoken/lib/position";
import { Button } from "@/registry/plainspoken/ui/button";
import { Floating, TriggerSlot, triggerButton, useOpenState, useReturnFocus, type TriggerProps, type TriggerRenderProps } from "@/registry/plainspoken/ui/floating";
import { MenuList, itemsOf, type MenuItem } from "@/registry/plainspoken/ui/menu-list";
import { cn } from "@/lib/utils";

export type { MenuItem } from "@/registry/plainspoken/ui/menu-list";

export interface DropdownMenuProps extends TriggerProps {
  /** Accessible name of an icon-only trigger */
  label?: string;
  items: MenuItem[];
  /** Line the menu up with the trigger's start (default) or end edge: end for a ⋯ at the end of a row */
  align?: "start" | "end";
  /** Below the trigger (default), or above it, as from a status bar. It flips by itself when there's no room. */
  side?: Extract<Side, "top" | "bottom">;
  /** Controlled open state; leave out to let the menu keep its own */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Classes for the menu layer: a width (`w-56`) */
  className?: string;
}

/**
 * A menu button: a button that opens a list of actions and options. ↓, Enter or Space open it
 * with the first item highlighted, ↑ opens it on the last; a click opens it with nothing
 * highlighted. Escape closes it and puts focus back on the button. Items are data (see MenuItem):
 * actions with icons, shortcuts and hints, links, checkboxes, radio groups, headings, separators
 * and submenus. The menu takes the trigger's size. With `disabled` the button is disabled and the
 * menu never opens.
 */
export function DropdownMenu({
  label,
  items,
  align = "start",
  side = "bottom",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  ...triggerProps
}: DropdownMenuProps) {
  const id = useId();
  const buttonId = `${id}-button`;
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange, triggerProps.disabled);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  /** What gets focus when the menu opens: an item for keyboard opens, the list itself for mouse. */
  const focusOnOpen = useRef<"first" | "last" | "list">("list");
  const { decide, ...returnFocus } = useReturnFocus(menu, () => button.current);
  // A menu that starts open (a story, a screenshot) leaves focus where it is.
  const skipFocus = useRef(defaultOpen && !triggerProps.disabled);

  useEffect(() => {
    if (!open) return;
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    const list = menu.current?.querySelector<HTMLElement>("[role=menu]");
    const els = itemsOf(list);
    (focusOnOpen.current === "first" ? els[0] : focusOnOpen.current === "last" ? els.at(-1) : list)?.focus();
    focusOnOpen.current = "list";
  }, [open]);

  const closeAll = (back: boolean) => {
    decide(back);
    setOpen(false);
  };

  const { trigger } = triggerProps;
  const invoker: TriggerRenderProps = {
    ref: (node) => {
      button.current = node;
    },
    id: buttonId,
    type: "button",
    popoverTarget: triggerProps.disabled ? undefined : id,
    disabled: triggerProps.disabled,
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": id,
    onClick: (e) => {
      // Keyboard "clicks" (Enter, Space) have detail 0: highlight the first item.
      focusOnOpen.current = e.detail === 0 ? "first" : "list";
    },
    onKeyDown: (e) => {
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open && !triggerProps.disabled) {
        e.preventDefault();
        focusOnOpen.current = e.key === "ArrowDown" ? "first" : "last";
        setOpen(true);
      }
    },
  };

  return (
    <>
      {typeof trigger === "function" ? <TriggerSlot render={trigger} {...invoker} /> : <Button {...invoker} {...triggerButton({ ...triggerProps, trigger }, label)} />}
      <Floating
        id={id}
        ref={menu}
        data-slot="dropdown-menu"
        open={open}
        onOpenChange={setOpen}
        {...returnFocus}
        anchor={() => button.current}
        side={side}
        align={align}
        className={cn("min-w-44", controlSize(triggerProps.size), className)}
      >
        <MenuList items={items} closeAll={closeAll} labelledBy={buttonId} />
      </Floating>
    </>
  );
}
