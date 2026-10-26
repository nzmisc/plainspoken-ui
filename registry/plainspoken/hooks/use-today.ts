"use client";

import { useSyncExternalStore } from "react";
import { todayISO, type ISODate } from "@/registry/plainspoken/lib/dates";

// Two things a server can't know: the viewer's date and the viewer's language. Both hooks give the
// server's render (and the first render while hydrating) a fixed answer, then the browser's, so a
// server-rendered calendar hydrates without a mismatch and fills in the rest a moment later.

/** Wakes subscribers just after the viewer's midnight, and when the tab comes back after a while. */
function subscribeToday(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const arm = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    timer = setTimeout(() => {
      onChange();
      arm();
    }, next.getTime() - now.getTime());
  };
  arm();
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/**
 * Today in the viewer's time zone, kept current across midnight. null on the server and during
 * hydration, so whatever depends on it (a "today" outline, the month a calendar opens on) appears
 * once the page is running in the browser instead of mismatching.
 */
export function useToday(): ISODate | null {
  return useSyncExternalStore(subscribeToday, todayISO, () => null);
}

const subscribeNever = () => () => {};

/**
 * The locale to format dates in: `locale` when given; otherwise "en-US" on the server and while
 * hydrating, then the browser's own (undefined, which Intl reads as the browser's default).
 */
export function useDateLocale(locale?: string): string | undefined {
  const fallback = useSyncExternalStore<string | undefined>(
    subscribeNever,
    () => undefined,
    () => "en-US",
  );
  return locale ?? fallback;
}
