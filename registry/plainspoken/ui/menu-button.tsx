"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { ChevronDown } from "@/registry/plainspoken/lib/icons";
import { Button, type ButtonProps } from "@/registry/plainspoken/ui/button";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { cn } from "@/lib/utils";

export interface MenuButtonProps extends Omit<ButtonProps, "children" | "iconEnd" | "popoverTarget" | "ref"> {
  /** What the button says: "Columns 5/7", "Status: all" */
  label: ReactNode;
  /** The panel's content: checkboxes, a small form, filter fields */
  children: ReactNode;
  /**
   * Something inside is switched on (a filter is set): the button gets a dark border and bold
   * text, so it stands out without relying on colour
   */
  active?: boolean;
  /** Line the panel up with the button's left edge (start) or right edge (end) */
  align?: "start" | "end";
  /** Classes for the panel: a width, `ctl-sm` for smaller controls inside */
  panelClassName?: string;
  /** Called when the panel opens or closes, however it happened */
  onOpenChange?: (open: boolean) => void;
  ref?: Ref<HTMLButtonElement>;
}

const FOCUSABLE = "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

/**
 * A button that opens a small panel of controls under it: the column picker or the value filter
 * of a table, a few settings. It is a disclosure (a button with aria-expanded and a panel), not an
 * ARIA menu: the panel holds ordinary controls you Tab through. For a list of commands, use a
 * dropdown menu instead.
 *
 * The panel is a native popover (Floating), so it sits in the browser's top layer (a table's
 * scroll box can't clip it) and Escape or a click outside closes it. Opening moves focus to the
 * first control inside; closing with Escape puts it back on the button. It opens below the
 * button, or above when there is no room, and stays inside the window (lib/position).
 */
export function MenuButton({
  label,
  children,
  active = false,
  align = "start",
  panelClassName,
  onOpenChange,
  className,
  ref,
  ...rest
}: MenuButtonProps) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Opening moves focus to the first control inside.
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open]);

  return (
    <>
      <Button
        ref={(el) => {
          button.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        iconEnd={ChevronDown}
        popoverTarget={id}
        aria-expanded={open}
        aria-controls={id}
        data-slot="menu-button"
        data-active={active || undefined}
        className={cn(active && "border-primary font-bold", className)}
        {...rest}
      >
        {label}
      </Button>
      <Floating
        ref={panel}
        id={id}
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          onOpenChange?.(o);
        }}
        onToggle={(e) => {
          if (e.newState !== "closed") return;
          // Escape leaves focus nowhere useful (the panel is gone); a click outside has already moved it.
          const active = document.activeElement;
          if (!active || active === document.body || panel.current?.contains(active)) button.current?.focus();
        }}
        anchor={() => button.current}
        side="bottom"
        align={align}
        offset={2}
        className={cn("max-h-[60vh] max-w-[90vw] overflow-auto p-2", panelClassName)}
      >
        {children}
      </Floating>
    </>
  );
}
