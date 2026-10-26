"use client";

import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import type { Side } from "@/registry/plainspoken/lib/position";
import { Floating } from "@/registry/plainspoken/ui/floating";

/** Once one tooltip has shown, the next opens at once if the pointer moves on within this window. */
const SKIP_DELAY_MS = 400;
let lastClosed = 0;

type TriggerElement = ReactElement<{ "aria-describedby"?: string; "aria-label"?: string; label?: string; title?: string }>;

export interface TooltipProps {
  /** Short plain text. Anything interactive belongs in a HoverCard or Popover instead. */
  content: ReactNode;
  /** One focusable element; it gets aria-describedby pointing at the tooltip. */
  children: TriggerElement;
  side?: Side;
  /** Hover delay before opening, ms. Keyboard focus opens at once. */
  delay?: number;
  /** Start open (for stories and screenshots) */
  defaultOpen?: boolean;
}

/**
 * A label-sized hint on hover or keyboard focus, like a styled `title` attribute. Opens after a
 * delay (none when moving from one tooltip to the next), closes on leave, blur or Escape, and the
 * pointer can move onto it without it closing (WCAG 1.4.13). Never opens from touch: phones have
 * no hover, so the hint must not be the only place the information lives.
 *
 * The child's own `title` is dropped so the browser's tooltip doesn't show as well. When the
 * tooltip only repeats the child's name (an IconButton's `label`), it isn't wired up as a
 * description, so screen readers don't say it twice. A disabled button gets no pointer or focus
 * events: wrap it in a `<span tabIndex={0}>` and put the tooltip on that.
 */
export function Tooltip({ content, children, side = "top", delay = 500, defaultOpen = false }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const wrap = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);

  const show = (wait: number) => {
    clearTimeout(timer.current);
    if (wait <= 0 || performance.now() - lastClosed < SKIP_DELAY_MS) setOpen(true);
    else timer.current = window.setTimeout(() => setOpen(true), wait);
  };
  const hide = (wait = 80) => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      lastClosed = performance.now();
    }, wait);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      clearTimeout(timer.current);
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const name = children.props["aria-label"] ?? children.props.label;
  const repeatsName = typeof content === "string" && content === name;

  return (
    <span
      ref={wrap}
      data-slot="tooltip-trigger"
      className="contents"
      onPointerEnter={(e) => e.pointerType === "mouse" && show(delay)}
      onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
      onPointerDown={() => hide(0)}
      onFocus={(e) => e.target.matches(":focus-visible") && show(0)}
      onBlur={() => hide(0)}
    >
      {cloneElement(children, { "aria-describedby": repeatsName ? children.props["aria-describedby"] : id, title: undefined })}
      <Floating
        id={id}
        as="span"
        role="tooltip"
        mode="manual"
        data-slot="tooltip"
        open={open}
        anchor={() => wrap.current?.firstElementChild ?? null}
        side={side}
        align="center"
        className="max-w-64 px-1.5 py-0.5 text-[12px] leading-snug"
        onPointerEnter={() => clearTimeout(timer.current)}
        onPointerLeave={() => hide()}
      >
        {content}
      </Floating>
    </span>
  );
}
