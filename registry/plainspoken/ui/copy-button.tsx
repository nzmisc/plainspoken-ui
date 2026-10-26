"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "@/registry/plainspoken/lib/icons";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { Button, IconButton, type ButtonVariant } from "@/registry/plainspoken/ui/button";

async function copy(text: string) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  // Fallback for plain-http origins, where the Clipboard API is missing
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("copy failed");
}

const STATE = {
  idle: { icon: Copy, word: "Copy", cls: "" },
  done: { icon: Check, word: "Copied", cls: "text-success" },
  fail: { icon: X, word: "Couldn't copy", cls: "text-destructive" },
} as const;

export interface CopyButtonProps {
  /** What goes on the clipboard */
  text: string;
  /** Visible words ("Copy URL"); leave out for an icon-only button */
  label?: string;
  /**
   * What is being copied, for the accessible name of an icon-only button ("Copy IP address").
   * Defaults to the text itself when it is short.
   */
  name?: string;
  /** xs by default: it fits a plain table row */
  size?: ControlSize;
  /** ghost by default: no border of its own to double up with a table cell's */
  variant?: ButtonVariant;
  className?: string;
}

/**
 * Copies `text` to the clipboard. For 1.2 s after a click the icon shows how it went (a check or
 * an ×), and a live region says it in words for screen readers.
 */
export function CopyButton({ text, label, name, size = "xs", variant = "ghost", className }: CopyButtonProps) {
  const [state, setState] = useState<keyof typeof STATE>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const st = STATE[state];
  const onClick = () =>
    copy(text)
      .then(
        () => setState("done"),
        () => setState("fail"),
      )
      .finally(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 1200);
      });
  const common = { size, variant, icon: st.icon, onClick, className: [st.cls, className].filter(Boolean).join(" ") };
  // An icon-only button is named after what it copies; a long text (a CSS block) isn't read out whole
  const what = name ?? (text.length <= 60 ? text : "to clipboard");
  return (
    <>
      {label ? (
        <Button {...common}>{label}</Button>
      ) : (
        <IconButton {...common} label={`${st.word} ${what}`} />
      )}
      <span className="sr-only" aria-live="polite">
        {state === "idle" ? "" : st.word}
      </span>
    </>
  );
}
