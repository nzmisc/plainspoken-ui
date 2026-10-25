"use client";

import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { X } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { cn } from "@/lib/utils";

/** How a dialog was asked to close: Escape (or a phone's back gesture), a click on the backdrop, or its × */
export type CloseReason = "escape" | "backdrop" | "close-button";

/** Page scroll is locked while any modal is open; a counter so stacked modals unlock once. */
let locks = 0;
let saved = { overflow: "", gutter: "" };
function lockScroll() {
  const root = document.documentElement;
  if (locks++ === 0) {
    saved = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    // Keep the scrollbar's room only when there is a scrollbar, or a short page would shift left.
    const hasBar = window.innerWidth > root.clientWidth;
    root.style.overflow = "hidden";
    if (hasBar) root.style.scrollbarGutter = "stable";
  }
  return () => {
    if (--locks === 0) {
      root.style.overflow = saved.overflow;
      root.style.scrollbarGutter = saved.gutter;
    }
  };
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

/**
 * Where focus starts: the element marked `data-autofocus` (or `autofocus`), else the first control
 * in the body, else the first in the footer. The browser's own choice would be the × in the
 * header, which is the least useful place to start.
 */
function focusInitial(d: HTMLDialogElement) {
  const el =
    d.querySelector<HTMLElement>("[data-autofocus],[autofocus]") ??
    d.querySelector<HTMLElement>(`[data-dialog-body] :is(${FOCUSABLE})`) ??
    d.querySelector<HTMLElement>(`[data-dialog-footer] :is(${FOCUSABLE})`);
  el?.focus();
}

export interface ModalOptions {
  open: boolean;
  onClose: (reason: CloseReason) => void;
  /** Refuse to close (Escape, backdrop) while true */
  busy?: boolean;
  /** Close on a click on the backdrop. Default true. */
  dismissOnBackdrop?: boolean;
}

/**
 * Drives a native <dialog> as a modal; spread the result onto it. showModal() gives the hard
 * parts for free: the top layer, an inert page behind it (a real focus trap), Escape as a "cancel"
 * event, and stacking for nested dialogs. This adds: controlled open state, scroll lock, initial
 * focus and focus return, backdrop-click closing, and refusing to close while busy. Dialog,
 * Drawer and the command palette are built on it; use it for a modal of your own shape.
 */
export function useModal({ open, onClose, busy = false, dismissOnBackdrop = true }: ModalOptions) {
  const ref = useRef<HTMLDialogElement>(null);
  const latest = useRef({ open, onClose, busy, dismissOnBackdrop });
  useLayoutEffect(() => {
    latest.current = { open, onClose, busy, dismissOnBackdrop };
  });
  const downOnBackdrop = useRef(false);

  useLayoutEffect(() => {
    const d = ref.current;
    if (!open || !d) return;
    const before = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    focusInitial(d);
    const unlock = lockScroll();
    return () => {
      unlock();
      if (d.open) d.close();
      if (before?.isConnected) before.focus();
    };
  }, [open]);

  return {
    ref,
    onCancel: (e: { preventDefault(): void }) => {
      // Escape. Always handled here, so the dialog only closes through state.
      e.preventDefault();
      if (!latest.current.busy) latest.current.onClose("escape");
    },
    onClose: () => {
      // The browser can force a close (a second Escape with no click in between, a back
      // gesture). While busy, open it again; otherwise let the state follow.
      // The close event is queued, so the dialog can be open again by the time it arrives: a
      // dialog mounted open under StrictMode is closed by the effect's cleanup and reopened at
      // once. That close is stale; ignore it.
      const l = latest.current;
      if (!l.open || ref.current?.open) return;
      if (l.busy) ref.current?.showModal();
      else l.onClose("escape");
    },
    onPointerDown: (e: { target: EventTarget }) => {
      downOnBackdrop.current = e.target === ref.current;
    },
    onClick: (e: { target: EventTarget }) => {
      // The dialog box is filled edge to edge by its content, so a click whose target is the
      // <dialog> itself landed on the backdrop. Both press and release must be there, so a text
      // selection dragged out of the box does not close it.
      const l = latest.current;
      if (e.target === ref.current && downOnBackdrop.current && l.dismissOnBackdrop && !l.busy) l.onClose("backdrop");
      downOnBackdrop.current = false;
    },
  };
}

export interface DialogHeaderProps {
  /** Base id: the title gets `${id}-title`, the description `${id}-desc` */
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Disables the × */
  busy?: boolean;
  onClose: () => void;
}

/** The title bar of a Dialog or Drawer: bold title, the ×, and an optional line of description under them. */
export function DialogHeader({ id, title, description, busy = false, onClose }: DialogHeaderProps) {
  return (
    <div data-slot="dialog-header" className="shrink-0 border-b border-border bg-muted pl-3">
      <div className="flex items-start justify-between gap-2">
        <h2 id={`${id}-title`} className="min-w-0 py-0.5 text-[14px] leading-6 font-bold">
          {title}
        </h2>
        <IconButton size="sm" variant="ghost" icon={X} label="Close" disabled={busy} onClick={onClose} className="m-0.5 shrink-0 hover:bg-accent" />
      </div>
      {description && (
        <p id={`${id}-desc`} className="-mt-0.5 pr-3 pb-1.5 text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

/** The scrolling middle of a Dialog or Drawer */
export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-slot="dialog-body" data-dialog-body className={cn("min-h-0 flex-1 overflow-auto overscroll-contain p-3", className)}>
      {children}
    </div>
  );
}

/** The button bar at the bottom of a Dialog or Drawer: right-aligned, stays put while the body scrolls */
export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="dialog-footer"
      data-dialog-footer
      className={cn("flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-muted px-3 py-2", className)}
    >
      {children}
    </div>
  );
}

const SIZE = {
  sm: "w-[24rem]",
  md: "w-[36rem]",
  lg: "w-[56rem]",
  full: "h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)]",
};

/** Below 640px, every size but sm takes the whole screen. */
const PHONE_FULL = "max-sm:m-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-screen max-sm:max-w-none max-sm:border-0";

/** The dialog box and its backdrop, shared with Drawer and the command palette */
export const MODAL_BOX = "overflow-hidden border border-border bg-background p-0 text-[14px] text-foreground shadow-md backdrop:bg-background/70 open:flex open:flex-col";

export interface DialogProps {
  open: boolean;
  onClose: (reason: CloseReason) => void;
  title: ReactNode;
  /** One line under the title; becomes aria-describedby */
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons, right-aligned in a bar that stays put while the body scrolls */
  footer?: ReactNode;
  /** sm 24rem, md 36rem, lg 56rem, full: the window less a margin. On phones all but sm fill the screen. */
  size?: keyof typeof SIZE;
  /** Blocks every way of closing (Escape, backdrop, ×) and marks the dialog aria-busy */
  busy?: boolean;
  /** Close on a click outside the box. Default on; turn it off for forms once something is typed. */
  dismissOnBackdrop?: boolean;
  role?: "dialog" | "alertdialog";
  /** Classes for the <dialog> box (a width, say) */
  className?: string;
  /** Classes for the scrolling body (`p-0` for a table edge to edge) */
  bodyClassName?: string;
}

/**
 * A modal dialog on the native <dialog>: a title bar with the ×, a body that scrolls on its own,
 * and a footer of buttons that stays put. Escape and a click on the backdrop close it (unless
 * busy); focus starts on the first control in the body (or the one marked `data-autofocus`) and
 * goes back to where it was on close; the page behind can't be scrolled or tabbed into. Dialogs
 * can open dialogs, and each Escape closes the top one. On phones it fills the screen, except
 * the sm size. The content is only rendered while open, so a form in it starts fresh each time.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  busy = false,
  dismissOnBackdrop = true,
  role = "dialog",
  className,
  bodyClassName,
}: DialogProps) {
  const id = useId();
  const modal = useModal({ open, onClose, busy, dismissOnBackdrop });
  return (
    <dialog
      {...modal}
      data-slot="dialog"
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      aria-busy={busy || undefined}
      className={cn(MODAL_BOX, "m-auto max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-1.5rem)]", SIZE[size], size !== "sm" && PHONE_FULL, className)}
    >
      {open && (
        <>
          <DialogHeader id={id} title={title} description={description} busy={busy} onClose={() => onClose("close-button")} />
          {children != null && <DialogBody className={bodyClassName}>{children}</DialogBody>}
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </>
      )}
    </dialog>
  );
}
