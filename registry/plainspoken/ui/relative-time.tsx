"use client";

import { useSyncExternalStore, type TimeHTMLAttributes } from "react";
import {
  formatLocal,
  formatRelativeLong,
  formatRelativeShort,
  formatUtc,
  toMs,
  type DateInput,
} from "@/registry/plainspoken/lib/relative-time";
import { cn } from "@/lib/utils";

// One clock for every RelativeTime on the page: it ticks once a second while any are mounted
// and stops when the last one goes. Each component re-renders only when its own text changes.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  // A clock that was stopped is stale: catch up at once rather than on the next tick
  listener();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const clock = () => now || Date.now();

export interface RelativeTimeProps extends Omit<TimeHTMLAttributes<HTMLTimeElement>, "dateTime" | "children"> {
  /** The moment: a Date, epoch milliseconds or an ISO string */
  date: DateInput;
  /** short: "12s ago", "3h 20m ago" (compact, for tables). long: "3 minutes ago", "yesterday", in the reader's language. */
  format?: "short" | "long";
  /** Language for the long format and the hover text. Default: the browser's. */
  locale?: string;
  /**
   * A fixed "now": renders the relative text straight away, on the server too, and never ticks.
   * For stories, tests and pages that know the time they were made. With the long format, also
   * set `locale`, so the server and the browser word it the same way.
   */
  now?: DateInput;
}

/**
 * "3 min ago" that keeps itself current, in a <time> element with the exact moment for machines
 * and the full local date on hover. Hydration-safe: the server, and the browser's first render,
 * show a fixed UTC date ("2026-10-25 14:03 UTC"), so the two always match; the relative text
 * takes over as soon as the page is interactive, and updates every second from one shared clock.
 */
export function RelativeTime({ date, format = "short", locale, now: fixedNow, className, title, ...rest }: RelativeTimeProps) {
  const t = toMs(date);
  const fixed = fixedNow != null ? toMs(fixedNow) : null;
  const relative = (n: number) => (format === "long" ? formatRelativeLong(t, n, locale) : formatRelativeShort(t, n));
  // The snapshot is the text itself, so a tick that doesn't change it doesn't re-render
  const text = useSyncExternalStore(
    fixed != null ? noopSubscribe : subscribe,
    () => relative(fixed ?? clock()),
    () => (fixed != null ? relative(fixed) : null),
  );
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <time
      data-slot="relative-time"
      dateTime={new Date(t).toISOString()}
      title={title ?? (mounted ? formatLocal(t, locale) : formatUtc(t))}
      className={cn("tabular-nums", className)}
      {...rest}
    >
      {text ?? formatUtc(t)}
    </time>
  );
}

function noopSubscribe() {
  return () => {};
}
