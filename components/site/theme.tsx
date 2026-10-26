"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";

export type ThemeChoice = "system" | "light" | "dark";
const KEY = "theme";

/**
 * Runs before the first paint (it is inline in <head>): puts .dark on <html> when the saved choice,
 * or the system setting when there is none, is dark. shadcn/ui's dark mode keys off that class.
 */
const SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

// The saved choice lives in localStorage; this keeps every toggle on the page (and other tabs) in step.
const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
function savedChoice(): ThemeChoice {
  const saved = localStorage.getItem(KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

/** System / light / dark, saved in localStorage. Follows the OS live while on "system". */
export function ThemeToggle({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const choice = useSyncExternalStore(subscribe, savedChoice, () => "system" as ThemeChoice);
  useEffect(() => {
    if (choice !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);
  const set = (c: ThemeChoice) => {
    if (c === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, c);
    apply(c);
    listeners.forEach((l) => l());
  };
  const option = (value: ThemeChoice, icon: typeof Sun, words: string) => ({
    value,
    label: (
      <span title={words} className="inline-flex items-center">
        <Icon icon={icon} />
        <span className="sr-only">{words}</span>
      </span>
    ),
  });
  return (
    <SegmentedControl
      label="Colour theme"
      size={size}
      value={choice}
      onChange={set}
      options={[option("system", Monitor, "System"), option("light", Sun, "Light"), option("dark", Moon, "Dark")]}
    />
  );
}
