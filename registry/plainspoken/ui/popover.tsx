"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "@/registry/plainspoken/lib/icons";
import { controlSize } from "@/registry/plainspoken/lib/controls";
import type { Align, Side } from "@/registry/plainspoken/lib/position";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Floating, TriggerSlot, triggerButton, useOpenState, useReturnFocus, type TriggerProps, type TriggerRenderProps } from "@/registry/plainspoken/ui/floating";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface PopoverProps extends TriggerProps {
  /** Optional header line; also names the popover for screen readers */
  title?: ReactNode;
  /** Accessible name when there is no title, and the name of an icon-only trigger */
  label?: string;
  /** Body. Pass a function to get a `close` callback, e.g. for an Apply button. */
  children: ReactNode | ((close: () => void) => ReactNode);
  side?: Side;
  align?: Align;
  arrow?: boolean;
  /** Controlled open state; leave out to let the popover keep its own */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Classes for the panel: a width (`w-72`), or `p-0` on the body via `bodyClassName` */
  className?: string;
  bodyClassName?: string;
}

/**
 * A click-to-open panel attached to a button: settings, filters, a short form, details. Not
 * modal. The button is the popover's native invoker (`popovertarget`), so Enter and Space work
 * and clicking it again closes it. Escape or a click outside closes it. Opening moves focus to
 * the first control inside (or the one with `autoFocus`); closing from inside puts focus back on
 * the button. The panel takes the trigger's size, so a popover from a small toolbar button has
 * small controls in it.
 */
export function Popover({
  title,
  label,
  children,
  side = "bottom",
  align = "start",
  arrow = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  bodyClassName,
  ...triggerProps
}: PopoverProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useReturnFocus(panel, () => button.current);
  // A popover that starts open (a story, a screenshot) leaves focus where it is.
  const skipFocus = useRef(defaultOpen);

  useEffect(() => {
    if (!open) return;
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    const p = panel.current;
    (p?.querySelector<HTMLElement>("[autofocus],[data-autofocus]") ?? p?.querySelector<HTMLElement>(FOCUSABLE) ?? p)?.focus();
  }, [open]);

  const close = () => setOpen(false);
  const { trigger } = triggerProps;
  const invoker: TriggerRenderProps = {
    ref: (node) => {
      button.current = node;
    },
    type: "button",
    popoverTarget: id,
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": id,
  };

  return (
    <>
      {typeof trigger === "function" ? <TriggerSlot render={trigger} {...invoker} /> : <Button {...invoker} {...triggerButton({ ...triggerProps, trigger }, label)} />}
      <Floating
        id={id}
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        data-slot="popover"
        open={open}
        onOpenChange={setOpen}
        onBeforeToggle={returnFocus.onBeforeToggle}
        onToggle={returnFocus.onToggle}
        anchor={() => button.current}
        side={side}
        align={align}
        arrow={arrow}
        className={cn("min-w-48 focus-visible:outline-none", controlSize(triggerProps.size), className)}
      >
        {title && (
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted pl-3">
            <span id={titleId} className="font-bold">
              {title}
            </span>
            <IconButton size="sm" variant="ghost" icon={X} label="Close" onClick={close} className="m-0.5 hover:bg-accent" />
          </div>
        )}
        <div className={cn("p-3", bodyClassName)}>{typeof children === "function" ? children(close) : children}</div>
      </Floating>
    </>
  );
}
