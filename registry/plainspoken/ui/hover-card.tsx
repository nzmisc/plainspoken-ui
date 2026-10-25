"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Side } from "@/registry/plainspoken/lib/position";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { cn } from "@/lib/utils";

export interface HoverCardProps {
  /** The thing you hover: usually a link or a button. Must be focusable. */
  children: ReactNode;
  /** The card body. May hold links and buttons; Tab moves from the trigger into it. */
  card: ReactNode;
  /** Accessible name for the card, e.g. "Ada Lovelace's profile" */
  label: string;
  side?: Side;
  openDelay?: number;
  closeDelay?: number;
  defaultOpen?: boolean;
  /** Classes for the card: a width other than w-80 */
  className?: string;
}

/**
 * A rich preview on hover: the person behind a name, the details behind an order number or a
 * host, with links and buttons inside. Opens after a short delay and stays open while the pointer
 * travels into it. Keyboard: focusing the trigger opens it, Tab continues into the card, Escape
 * closes it. Touch: the first tap opens the card instead of following the link, a second tap
 * follows it, a tap anywhere else closes it. The card is a span, so it is valid inside a
 * paragraph; it isn't clipped by a table's scroll box either.
 */
export function HoverCard({ children, card, label, side = "bottom", openDelay = 350, closeDelay = 250, defaultOpen = false, className }: HoverCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const wrap = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);
  const swallowClick = useRef(false);
  /** Set while Escape hands focus back to the trigger, so that focus does not reopen the card. */
  const quiet = useRef(false);

  const later = (next: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), ms);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const inside = wrap.current?.contains(document.activeElement);
      clearTimeout(timer.current);
      setOpen(false);
      quiet.current = true;
      if (inside) (trigger.current?.querySelector<HTMLElement>("a,button,[tabindex]") ?? trigger.current)?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span
      ref={wrap}
      data-slot="hover-card-trigger"
      className="contents"
      onPointerEnter={(e) => e.pointerType !== "touch" && later(true, open ? 0 : openDelay)}
      onPointerLeave={(e) => e.pointerType !== "touch" && later(false, closeDelay)}
      onFocus={(e) => {
        if (quiet.current) quiet.current = false;
        else if (e.target.matches(":focus-visible")) later(true, 0);
      }}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) later(false, 0);
      }}
    >
      <span
        ref={trigger}
        className="contents"
        onPointerDown={(e) => {
          if (e.pointerType === "touch" && !open) {
            swallowClick.current = true;
            later(true, 0);
          }
        }}
        onClickCapture={(e) => {
          if (swallowClick.current) {
            swallowClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {children}
      </span>
      <Floating
        as="span"
        role="dialog"
        aria-label={label}
        mode="manual"
        data-slot="hover-card"
        open={open}
        anchor={() => trigger.current?.firstElementChild ?? null}
        side={side}
        className={cn("w-80", className)}
      >
        {card}
      </Floating>
    </span>
  );
}

/** The card's title bar: a name or title, and something small on the right (a status, a badge) */
export function HoverCardHeader({ title, aside, className }: { title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-baseline justify-between gap-2 border-b border-border bg-muted px-3 py-1", className)}>
      <b className="min-w-0 break-words">{title}</b>
      {aside}
    </span>
  );
}

/** Label-value facts in two columns. Rows with an empty value are left out. */
export function HoverCardFacts({ rows, className }: { rows: [label: ReactNode, value: ReactNode][]; className?: string }) {
  return (
    <span className={cn("grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 px-3 py-2", className)}>
      {rows
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v], i) => (
          <span key={i} className="contents">
            <span className="text-muted-foreground">{k}</span>
            <span className="min-w-0 break-words">{v}</span>
          </span>
        ))}
    </span>
  );
}

/** A row of links and buttons at the bottom of the card */
export function HoverCardActions({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-3 py-1.5", className)}>{children}</span>;
}
