"use client";

import { useState, type ReactNode } from "react";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

/** "#ABC", "abc" or "#aabbcc" → "#aabbcc"; null when it isn't a hex colour */
export function normaliseHex(text: string): string | null {
  const t = text.trim();
  if (!HEX.test(t)) return null;
  let h = t.replace(/^#/, "").toLowerCase();
  if (h.length === 3) h = [...h].map((x) => x + x).join("");
  return `#${h}`;
}

/**
 * A colour as hex text, with the browser's colour picker in the box before it. The text can be
 * half-typed: only a whole hex colour is passed on, and a wrong one shows an error once the field
 * is left.
 */
export function ColourField({
  label,
  hint,
  value,
  onChange,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  /** "#rrggbb" */
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  // What is being typed, while it differs from the value; null shows the value
  const [draft, setDraft] = useState<string | null>(null);
  const [left, setLeft] = useState(false);
  // A new value from outside (a swatch, reset) replaces whatever was being typed
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(null);
  }
  const text = draft ?? value;
  const invalid = draft != null && normaliseHex(draft) == null;
  return (
    <Field label={label} hint={hint} error={invalid && left ? "Write it as six hex digits, like #2a78d6." : undefined} className={className}>
      <Input
        value={text}
        spellCheck={false}
        autoComplete="off"
        maxLength={7}
        inputClassName="font-mono"
        onChange={(e) => {
          setDraft(e.target.value);
          setLeft(false);
          const hex = normaliseHex(e.target.value);
          if (hex) {
            // Our own change: keep what is typed ("#2a7" is a whole colour, but may be the start of "#2a78d6")
            setSeen(hex);
            onChange(hex);
          }
        }}
        onBlur={() => {
          setLeft(true);
          if (draft != null && normaliseHex(draft)) setDraft(null);
        }}
        prefix={
          <input
            type="color"
            aria-label={`${typeof label === "string" ? label : "Colour"}: picker`}
            value={normaliseHex(text) ?? value}
            onChange={(e) => {
              setDraft(null);
              onChange(e.target.value);
            }}
            className="ml-0.5 block size-[calc(var(--ctl-h)-8px)] cursor-pointer border border-border bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
          />
        }
      />
    </Field>
  );
}
