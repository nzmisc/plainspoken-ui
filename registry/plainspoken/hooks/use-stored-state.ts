import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

// Every hook instance listens here, so two components using one key stay in step within a tab;
// the "storage" event does the same across tabs.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * useState that is remembered in localStorage under `key` (as JSON). Without a key it is plain
 * state. Hydration-safe: the server and the first client render use `initial`, and the saved value
 * takes over straight after, before the browser paints. When storage is unavailable (private mode,
 * quota) it still works as state, it just isn't remembered.
 */
export function useStoredState<T>(key: string | undefined, initial: T) {
  const [own, setOwn] = useState(initial);
  const raw = useSyncExternalStore(
    subscribe,
    () => (key ? read(key) : null),
    () => null,
  );
  const value = useMemo<T>(() => {
    if (raw == null) return own;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return own;
    }
  }, [raw, own]);
  // For functional updates: the value as last rendered, or as last set if that was since.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const v = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      latest.current = v;
      setOwn(v);
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        // Not remembered, but `own` still holds it.
      }
      for (const l of listeners) l();
    },
    [key],
  );
  return [value, set] as const;
}
