"use client";

import { useId } from "react";
import { DialogBody, DialogFooter, DialogHeader, MODAL_BOX, useModal, type DialogProps } from "@/registry/plainspoken/ui/dialog";
import { cn } from "@/lib/utils";

export type DrawerSide = "top" | "right" | "bottom" | "left";

/** Where it sits and where it slides in from */
const SIDE: Record<DrawerSide, string> = {
  right: "my-0 mr-0 ml-auto h-dvh max-h-none w-[26rem] max-w-full border-y-0 border-r-0 starting:open:translate-x-full",
  left: "my-0 mr-auto ml-0 h-dvh max-h-none w-[26rem] max-w-full border-y-0 border-l-0 starting:open:-translate-x-full",
  bottom: "mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none border-x-0 border-b-0 starting:open:translate-y-full",
  top: "mx-0 mt-0 mb-auto max-h-[85dvh] w-full max-w-none border-x-0 border-t-0 starting:open:-translate-y-full",
};

/** Below 640px: a sheet from the bottom, full width, at most 85% of the screen tall (overrides SIDE) */
const PHONE_SHEET =
  "max-sm:mx-0 max-sm:mt-auto max-sm:mb-0 max-sm:h-auto max-sm:max-h-[85dvh] max-sm:w-full max-sm:max-w-none max-sm:border-x-0 max-sm:border-t max-sm:border-b-0 max-sm:starting:open:translate-x-0 max-sm:starting:open:translate-y-full";

export interface DrawerProps extends Omit<DialogProps, "size" | "role"> {
  /** The edge it slides in from. Default right. */
  side?: DrawerSide;
  /**
   * On phones (below 640px), come up from the bottom as a sheet whatever the side. Default true;
   * turn it off for a navigation drawer that should stay on its side.
   */
  sheetOnPhone?: boolean;
}

/**
 * A modal panel that slides in from an edge: the details of a row, filters, settings, or a bottom
 * sheet of actions on a phone. It behaves like Dialog (focus, Escape, backdrop, busy, nothing
 * rendered while closed) and slides in unless reduced motion is asked for. Side drawers are 26rem
 * wide; set another width with `className`. The footer keeps clear of a phone's home bar.
 */
export function Drawer({
  side = "right",
  sheetOnPhone = true,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  busy = false,
  dismissOnBackdrop = true,
  className,
  bodyClassName,
}: DrawerProps) {
  const id = useId();
  const modal = useModal({ open, onClose, busy, dismissOnBackdrop });
  const sheet = sheetOnPhone && side !== "bottom";
  return (
    <dialog
      {...modal}
      data-slot="drawer"
      data-side={side}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      aria-busy={busy || undefined}
      className={cn(
        MODAL_BOX,
        "transition-[translate] duration-150 ease-out motion-reduce:transition-none",
        SIDE[side],
        sheet && PHONE_SHEET,
        className,
      )}
    >
      {open && (
        <>
          <DialogHeader id={id} title={title} description={description} busy={busy} onClose={() => onClose("close-button")} />
          {children != null && <DialogBody className={bodyClassName}>{children}</DialogBody>}
          {footer && <DialogFooter className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">{footer}</DialogFooter>}
        </>
      )}
    </dialog>
  );
}
