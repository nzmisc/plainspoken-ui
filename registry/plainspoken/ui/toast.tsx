"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert, X, type Glyph } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "info" | "success" | "warning" | "destructive";

export interface ToastInput {
  title: ReactNode;
  /** A line under the title, in muted text */
  description?: ReactNode;
  variant?: ToastVariant;
  /** One button, such as Undo. Clicking it runs `onClick` and closes the toast. */
  action?: { label: string; onClick: () => void };
  /**
   * Milliseconds before it closes by itself; 0 keeps it until dismissed. Default 5 s, 8 s with an
   * action (time to reach it), and 0 for destructive (an error waits to be read).
   */
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

// The stack lives outside React, so toast() works from anywhere: an event handler, a server
// action's result, a fetch callback. <Toaster /> draws it.
interface Store {
  items: ToastItem[];
  /** The newest toast of each kind, for the live regions: kept after it closes, so closing never re-announces an older one */
  polite?: ToastItem;
  assertive?: ToastItem;
}

let store: Store = { items: [] };
let nextId = 1;
const listeners = new Set<() => void>();
const set = (next: Partial<Store>) => {
  store = { ...store, ...next };
  listeners.forEach((l) => l());
};

function dismiss(id: number) {
  set({ items: store.items.filter((t) => t.id !== id) });
}

function show(input: ToastInput | string): number {
  const item = { ...(typeof input === "string" ? { title: input } : input), id: nextId++ };
  set({ items: [...store.items, item], [item.variant === "destructive" ? "assertive" : "polite"]: item });
  return item.id;
}

/**
 * Shows a toast and returns its id: `toast("Saved")`, or `toast({ title: "Archived",
 * action: { label: "Undo", onClick: restore } })`. `toast.dismiss(id)` closes one early. Needs one
 * <Toaster /> somewhere on the page.
 */
export const toast = Object.assign(show, { dismiss });

const VARIANT: Record<ToastVariant, { border: string; text: string; mark: Glyph | null }> = {
  default: { border: "border-border border-l-foreground", text: "", mark: null },
  info: { border: "border-primary", text: "text-primary", mark: Info },
  success: { border: "border-success", text: "text-success", mark: CircleCheck },
  warning: { border: "border-warning", text: "text-warning", mark: TriangleAlert },
  destructive: { border: "border-destructive", text: "text-destructive", mark: CircleX },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export interface ToasterProps {
  /** At most this many on screen; older ones close as new ones arrive. Default 4. */
  max?: number;
  /** Accessible name of the region. Default "Notifications". */
  label?: string;
}

/**
 * Where toasts appear: bottom right, or along the bottom edge on phones, newest at the bottom.
 * Put one in your root layout. Toasts pause their timers while the pointer or keyboard focus is
 * on the stack, so one never vanishes while you read it or reach for its button. Alt+T moves focus
 * to the newest toast's button; Escape there closes it and puts focus back where it was. Screen
 * readers hear each new toast once, through a live region (an assertive one for destructive).
 */
export function Toaster({ max = 4, label = "Notifications" }: ToasterProps) {
  const { items: all, polite, assertive } = useSyncExternalStore(subscribe, () => store, () => store);
  const shown = all.slice(-max);
  const [paused, setPaused] = useState(false);
  const region = useRef<HTMLElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.code !== "KeyT") return;
      const last = region.current?.querySelector("li:last-child button");
      if (last instanceof HTMLElement) {
        e.preventDefault();
        if (!region.current!.contains(document.activeElement)) returnTo.current = document.activeElement as HTMLElement | null;
        last.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Toasts pushed out of the stack by newer ones are gone for good, not waiting out of sight
  useEffect(() => {
    if (all.length > max) set({ items: store.items.slice(-max) });
  }, [all.length, max]);

  const close = (id: number) => {
    const hadFocus = region.current?.contains(document.activeElement);
    dismiss(id);
    if (hadFocus) {
      if (returnTo.current?.isConnected) returnTo.current.focus();
      returnTo.current = null;
      setPaused(false);
    }
  };

  const say = (t: ToastItem | undefined) =>
    t && (
      <span key={t.id}>
        {t.title}
        {t.description != null && <>. {t.description}</>}
        {t.action && <>. Alt+T for {t.action.label}.</>}
      </span>
    );

  return (
    <section
      ref={region}
      aria-label={label}
      data-slot="toaster"
      className="pointer-events-none fixed inset-x-2 bottom-2 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <ol className="flex flex-col gap-2">
        {shown.map((t) => (
          <Toast key={t.id} item={t} paused={paused} onClose={() => close(t.id)} />
        ))}
      </ol>
      {/* The visible toasts aren't live regions: these are, and always present, so every new toast is read once */}
      <div aria-live="polite" className="sr-only">
        {say(polite)}
      </div>
      <div aria-live="assertive" className="sr-only">
        {say(assertive)}
      </div>
    </section>
  );
}

function Toast({ item, paused, onClose }: { item: ToastItem; paused: boolean; onClose: () => void }) {
  const variant = item.variant ?? "default";
  const duration = item.duration ?? (variant === "destructive" ? 0 : item.action ? 8000 : 5000);
  const left = useRef(duration);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!duration || paused) return;
    const start = Date.now();
    const timer = setTimeout(() => close.current(), left.current);
    return () => {
      clearTimeout(timer);
      left.current -= Date.now() - start;
    };
  }, [duration, paused]);
  const v = VARIANT[variant];
  return (
    <li
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      className={cn(
        "pointer-events-auto flex items-start gap-2 border border-l-4 bg-popover py-2 pr-2 pl-3 text-[14px] text-popover-foreground shadow-md",
        v.border,
      )}
    >
      {v.mark && <Icon icon={v.mark} className={cn("mt-[0.2em]", v.text)} />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        {item.description != null && <p className="text-[13px] text-muted-foreground">{item.description}</p>}
      </div>
      <div className="ctl-sm -my-px flex shrink-0 items-center gap-1">
        {item.action && (
          <Button
            onClick={() => {
              item.action!.onClick();
              onClose();
            }}
          >
            {item.action.label}
          </Button>
        )}
        <IconButton variant="ghost" icon={X} label="Dismiss notification" onClick={onClose} className="text-muted-foreground hover:text-foreground" />
      </div>
    </li>
  );
}
