"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { pointAnchor, type Anchor } from "@/registry/plainspoken/lib/position";
import { Floating, useReturnFocus } from "@/registry/plainspoken/ui/floating";
import { MenuList, itemsOf, type MenuItem } from "@/registry/plainspoken/ui/menu-list";
import { cn } from "@/lib/utils";

export type { MenuItem } from "@/registry/plainspoken/ui/menu-list";

export interface ContextMenuProps {
  /** The area that gets the menu on right-click, long-press, Shift+F10 or the Menu key */
  children: ReactNode;
  /** The menu's entries. Pass a function to build them from the element that was right-clicked. */
  items: MenuItem[] | ((target: Element) => MenuItem[]);
  /** Accessible name of the menu, e.g. "Message actions" */
  label?: string;
  /** Classes for the area */
  className?: string;
  /** Classes for the menu layer */
  menuClassName?: string;
  /** Open at this point (viewport px) on load, for stories and screenshots */
  defaultPoint?: { x: number; y: number };
}

/**
 * The right-click menu of an area: a table, a message list, a canvas. Also opens from the keyboard
 * (Shift+F10 or the Menu key) at the focused element, and from a long-press on touch screens (the
 * browser fires contextmenu for both). Keyboard and choosing work as in DropdownMenu; Escape or a
 * click outside closes it and focus goes back to where it was. A right-click anywhere outside
 * the area still gets the browser's own menu.
 */
export function ContextMenu({ children, items, label, className, menuClassName, defaultPoint }: ContextMenuProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(defaultPoint ? pointAnchor(defaultPoint.x, defaultPoint.y) : null);
  const [target, setTarget] = useState<Element | null>(null);
  // A fresh layer per opening: a right-click elsewhere first light-dismisses the old one, and its
  // late "closed" event must not cancel the new one.
  const [opening, setOpening] = useState(0);
  const area = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const before = useRef<HTMLElement | null>(null);
  const { decide, ...returnFocus } = useReturnFocus(menu, () => before.current);
  const skipFocus = useRef(!!defaultPoint);
  /** Opened from the keyboard: highlight the first item. From the pointer: just the menu, as a native one does. */
  const fromKeyboard = useRef(false);

  useEffect(() => {
    if (!anchor) return;
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    const list = menu.current?.querySelector<HTMLElement>("[role=menu]");
    (fromKeyboard.current ? itemsOf(list)[0] : list)?.focus();
  }, [anchor, opening]);

  const openAt = (a: Anchor, t: Element, keyboard: boolean) => {
    before.current = document.activeElement as HTMLElement | null;
    fromKeyboard.current = keyboard;
    setTarget(t);
    setOpening((n) => n + 1);
    setAnchor(a);
  };
  const closeAll = (back: boolean) => {
    decide(back);
    setAnchor(null);
  };
  const list = typeof items === "function" ? (target ? items(target) : []) : items;

  return (
    <div
      ref={area}
      data-slot="context-menu"
      className={className}
      onContextMenu={(e) => {
        e.preventDefault();
        // From the keyboard (Shift+F10, the Menu key) the button isn't the right one: Chrome says
        // -1, Firefox 0, and some report the point 0,0. Open at the focused element then.
        const pointerType = (e.nativeEvent as Partial<PointerEvent>).pointerType;
        if ((e.button !== 2 && pointerType !== "touch") || (e.clientX === 0 && e.clientY === 0)) {
          const focused = document.activeElement && area.current?.contains(document.activeElement) ? document.activeElement : area.current!;
          openAt(focused, focused, true);
        } else openAt(pointAnchor(e.clientX, e.clientY), e.target as Element, false);
      }}
    >
      {children}
      <Floating
        key={opening}
        ref={menu}
        open={anchor != null}
        onOpenChange={(o) => !o && setAnchor(null)}
        {...returnFocus}
        anchor={() => anchor}
        side="bottom"
        align="start"
        offset={2}
        className={cn("min-w-44", menuClassName)}
      >
        <MenuList items={list} closeAll={closeAll} label={label} />
      </Floating>
    </div>
  );
}
