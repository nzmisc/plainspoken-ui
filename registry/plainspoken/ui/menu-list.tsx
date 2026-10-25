"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Check, ChevronRight, type Glyph } from "@/registry/plainspoken/lib/icons";
import { Floating, useReturnFocus } from "@/registry/plainspoken/ui/floating";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

/**
 * One entry of a DropdownMenu or ContextMenu. Plain items run `onSelect` (or follow `href`) and
 * close the menu; checkbox and radio items flip and leave it open; submenus open to the side.
 */
export type MenuItem =
  | {
      type?: "item";
      label: string;
      onSelect?: () => void;
      /** Makes the item a link (<a role="menuitem">): profile pages, settings, docs */
      href?: string;
      /** Shown on the right, e.g. "⌘C". Display only; binding the key is up to you. */
      shortcut?: string;
      disabled?: boolean;
      /** Red, for actions that delete or stop things */
      destructive?: boolean;
      /** Short secondary text under the label */
      hint?: string;
      /** Icon in the left column. Give every item in a menu one, or none, so the labels line up. */
      icon?: Glyph;
    }
  | { type: "checkbox"; label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; shortcut?: string; disabled?: boolean }
  | {
      type: "radio";
      /** Heading over the options, also the group's accessible name */
      label?: string;
      value: string;
      onValueChange: (value: string) => void;
      options: { value: string; label: string; disabled?: boolean }[];
    }
  | { type: "submenu"; label: string; items: MenuItem[]; disabled?: boolean; icon?: Glyph }
  | { type: "label"; label: string }
  | { type: "separator" };

const ITEM = '[role^="menuitem"]:not([aria-disabled="true"])';

/** The enabled items of one menu level (not of its submenus), in order. */
export const itemsOf = (menu: Element | null | undefined) => [
  ...(menu?.querySelectorAll<HTMLElement>(`:scope > ${ITEM}, :scope > [role=group] > ${ITEM}, :scope > [role=none] > ${ITEM}`) ?? []),
];

/**
 * The highlighted item (keyboard focus, or under the pointer, which moves focus too) is drawn in
 * the main colour, like a native menu, so it can't be missed.
 */
const ITEM_CLASS = cn(
  "group/item flex min-h-(--ctl-h) w-full cursor-default items-center gap-(--ctl-gap) px-(--ctl-inset) py-0.5 text-left text-(length:--ctl-text) leading-snug whitespace-nowrap no-underline [&_svg]:size-(--ctl-icon) [&_svg]:shrink-0",
  "text-popover-foreground visited:text-popover-foreground focus:bg-primary focus:text-primary-foreground focus-visible:outline-none",
  "aria-disabled:text-muted-foreground aria-expanded:bg-accent aria-expanded:focus:bg-primary",
);

/** Muted parts of an item (shortcut, hint, chevron) that must stay readable on the highlight */
const MUTED = "text-muted-foreground group-focus/item:text-primary-foreground/80";

const GROUP_LABEL = "px-(--ctl-inset) pt-1.5 pb-0.5 text-[12px] font-bold text-muted-foreground";

/** The icon-wide column on the left: the item's icon, a check for checked, a square dot for the chosen radio. */
const Mark = ({ children }: { children?: ReactNode }) => (
  <span aria-hidden className="flex w-(--ctl-icon) shrink-0 justify-center">
    {children}
  </span>
);

const Shortcut = ({ children }: { children: string }) => (
  <kbd className={cn("ml-auto pl-4 font-sans text-[0.92em] tracking-wide", MUTED)}>{children}</kbd>
);

export interface MenuListProps {
  items: MenuItem[];
  /** Close the whole menu tree (after an action is chosen), and put focus back where it was if `refocus` */
  closeAll: (refocus: boolean) => void;
  /** Set on submenus: close just this level */
  closeSelf?: () => void;
  /** The menu's accessible name: the id of its trigger, or a label */
  labelledBy?: string;
  label?: string;
}

/**
 * The list inside every menu (role="menu"). ↑ and ↓ move (and wrap), Home and End jump, typing
 * letters jumps to the next item starting with them, Enter and Space choose, → opens a submenu
 * and ← closes it, Tab closes everything. The pointer moves the highlight too. Actions close the
 * menu; checkboxes and radios leave it open so several can be flipped in a row.
 */
export function MenuList({ items, closeAll, closeSelf, labelledBy, label }: MenuListProps) {
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const all = () => itemsOf(list.current);
  const move = (to: number | "next" | "prev") => {
    const els = all();
    if (!els.length) return;
    const i = els.indexOf(document.activeElement as HTMLElement);
    const n =
      to === "next" ? (i + 1) % els.length : to === "prev" ? (i <= 0 ? els.length - 1 : i - 1) : to < 0 ? els.length - 1 : to;
    els[n]?.focus();
  };
  /** Is this element on this level of the menu (not in a submenu)? */
  const own = (el: Element | null) => !!el && el.closest('[role="menu"]') === list.current;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Keys from a nested submenu are handled by that submenu.
    if (!own(e.target as Element)) return;
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
      e.preventDefault();
      move(k === "ArrowDown" ? "next" : k === "ArrowUp" ? "prev" : k === "Home" ? 0 : -1);
    } else if (k === "ArrowLeft" && closeSelf) {
      e.preventDefault();
      closeSelf();
    } else if (k === "Tab") {
      closeAll(false);
    } else if (k.length === 1 && /\S/.test(k) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = performance.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + k.toLowerCase(), at: now };
      const els = all();
      const start = els.indexOf(document.activeElement as HTMLElement);
      const order = [...els.slice(start + 1), ...els.slice(0, start + 1)];
      const t = typed.current.text;
      const text = (el: HTMLElement) => (el.dataset.label ?? el.textContent ?? "").trim().toLowerCase();
      const hit = order.find((el) => text(el).startsWith(t)) ?? (t.length > 1 ? undefined : order.find((el) => text(el).startsWith(t[0])));
      hit?.focus();
    }
  };

  // The pointer moves the highlight: over an enabled item it focuses that item, over anything
  // else (a disabled item, a heading, outside) the list itself, so no stale highlight stays.
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const item = (e.target as Element).closest<HTMLElement>('[role^="menuitem"]');
    if (item && !own(item)) return;
    const next = item && item.getAttribute("aria-disabled") !== "true" ? item : list.current;
    if (next && document.activeElement !== next) next.focus({ preventScroll: true });
  };
  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch" && own(document.activeElement)) list.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={list}
      role="menu"
      tabIndex={-1}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="max-h-[calc(100dvh-14px)] overflow-y-auto py-1 focus-visible:outline-none"
    >
      {items.map((it, i) => {
        if (it.type === "separator") return <div key={i} role="separator" className="my-1 border-t border-border" />;
        if (it.type === "label")
          return (
            <div key={i} role="presentation" className={GROUP_LABEL}>
              {it.label}
            </div>
          );
        if (it.type === "checkbox")
          return (
            <button
              key={i}
              type="button"
              role="menuitemcheckbox"
              tabIndex={-1}
              data-label={it.label}
              aria-checked={it.checked}
              aria-disabled={it.disabled || undefined}
              className={ITEM_CLASS}
              onClick={() => !it.disabled && it.onCheckedChange(!it.checked)}
            >
              <Mark>{it.checked && <Icon icon={Check} />}</Mark>
              <span className="flex-1">{it.label}</span>
              {it.shortcut && <Shortcut>{it.shortcut}</Shortcut>}
            </button>
          );
        if (it.type === "radio")
          return (
            <div key={i} role="group" aria-label={it.label}>
              {it.label && (
                <div aria-hidden className={GROUP_LABEL}>
                  {it.label}
                </div>
              )}
              {it.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="menuitemradio"
                  tabIndex={-1}
                  data-label={o.label}
                  aria-checked={o.value === it.value}
                  aria-disabled={o.disabled || undefined}
                  className={ITEM_CLASS}
                  onClick={() => !o.disabled && it.onValueChange(o.value)}
                >
                  <Mark>{o.value === it.value && <span className="size-1.5 bg-current" />}</Mark>
                  <span className="flex-1">{o.label}</span>
                </button>
              ))}
            </div>
          );
        if (it.type === "submenu") return <SubmenuItem key={i} item={it} closeAll={closeAll} />;
        const body = (
          <>
            <Mark>{it.icon && <Icon icon={it.icon} />}</Mark>
            <span className="flex flex-1 flex-col">
              {it.label}
              {it.hint && <span className={cn("text-[12px]", MUTED)}>{it.hint}</span>}
            </span>
            {it.shortcut && <Shortcut>{it.shortcut}</Shortcut>}
          </>
        );
        const cls = cn(ITEM_CLASS, it.destructive && "text-destructive visited:text-destructive focus:bg-destructive focus:text-background");
        const select = () => {
          closeAll(true);
          it.onSelect?.();
        };
        if (it.href && !it.disabled)
          return (
            <a key={i} role="menuitem" tabIndex={-1} href={it.href} data-label={it.label} className={cls} onClick={select}>
              {body}
            </a>
          );
        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            tabIndex={-1}
            data-label={it.label}
            aria-disabled={it.disabled || undefined}
            className={cls}
            onClick={() => !it.disabled && select()}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

/** An item that opens a nested menu to the side: on hover, click, → or Enter. */
function SubmenuItem({ item, closeAll }: { item: Extract<MenuItem, { type: "submenu" }>; closeAll: MenuListProps["closeAll"] }) {
  const [open, setOpen] = useState(false);
  const row = useRef<HTMLButtonElement>(null);
  const sub = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const focusFirst = useRef(false);
  // Closed by Escape with focus inside: back to the row that opened it, not to the page.
  const { decide, ...returnFocus } = useReturnFocus(sub, () => row.current);

  useEffect(() => {
    if (open && focusFirst.current) {
      focusFirst.current = false;
      itemsOf(sub.current?.querySelector("[role=menu]"))[0]?.focus();
    }
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const openNow = (focus: boolean) => {
    if (item.disabled) return;
    focusFirst.current = focus;
    setOpen(true);
  };

  return (
    <div
      role="none"
      onPointerEnter={(e) => {
        if (e.pointerType === "touch") return;
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => openNow(false), 120);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") return;
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOpen(false), 250);
      }}
    >
      <button
        ref={row}
        type="button"
        role="menuitem"
        tabIndex={-1}
        data-label={item.label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-disabled={item.disabled || undefined}
        className={ITEM_CLASS}
        onClick={() => openNow(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            openNow(true);
          }
        }}
      >
        <Mark>{item.icon && <Icon icon={item.icon} />}</Mark>
        <span className="flex-1">{item.label}</span>
        <Icon icon={ChevronRight} className={cn("ml-auto", MUTED)} />
      </button>
      {/* Nested in the parent popover's DOM, so opening it keeps the parent open. */}
      <Floating
        ref={sub}
        open={open}
        onOpenChange={setOpen}
        {...returnFocus}
        anchor={() => row.current}
        side="right"
        align="start"
        offset={0}
        className="-mt-1 min-w-40"
      >
        <MenuList
          items={item.items}
          label={item.label}
          closeAll={closeAll}
          closeSelf={() => {
            decide(true);
            setOpen(false);
          }}
        />
      </Floating>
    </div>
  );
}
