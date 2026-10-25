import { useCallback, useSyncExternalStore } from "react";

/** Tailwind's md breakpoint: at and above it the app shell's sidebar is inline, below it a drawer. */
export const MD_UP = "(min-width: 48rem)";

/**
 * Whether a media query matches, kept current as the window changes. The server (and the first
 * render while hydrating) gets `serverValue`, so markup never depends on it: decide what is
 * visible on first paint with CSS (`md:flex`), and use this for behaviour only.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => serverValue,
  );
}
