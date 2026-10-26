"use client";

import { useId, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { FOCUS_WITHIN_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import type { Person } from "@/registry/plainspoken/blocks/mail/data";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { cn } from "@/lib/utils";

const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

/** Is this a usable address? Chips that aren't are drawn in red and block sending. */
export const isValidRecipient = (p: Person) => EMAIL.test(p.email);

/** "Marta Kowalska <marta@…>", "marta@…" or a contact's name, as a recipient */
export function parseRecipient(text: string, contacts: Person[] = []): Person | null {
  const t = text.trim().replace(/[,;]+$/, "").trim();
  if (!t) return null;
  const angle = /^(.*)<([^>]+)>$/.exec(t);
  if (angle) {
    const email = angle[2].trim();
    return { name: angle[1].trim().replace(/^"|"$/g, "") || email, email };
  }
  const known = contacts.find((c) => c.email.toLowerCase() === t.toLowerCase() || c.name.toLowerCase() === t.toLowerCase());
  if (known) return known;
  return { name: t, email: t };
}

export interface RecipientInputProps {
  /** The recipients so far, as chips */
  value: Person[];
  onChange: (value: Person[]) => void;
  /** People to suggest while typing */
  contacts?: Person[];
  /** Accessible name: "To", "Cc" */
  label: string;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  invalid?: boolean;
  /** Ids of the elements that describe it (an error message) */
  describedBy?: string;
  /** Leave out to take the surrounding size */
  size?: ControlSize;
  /** Classes for the box */
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * The To and Cc fields of a mail form: recipients as removable chips, with a text box after them.
 * Typing suggests contacts (↑/↓ to move, Enter or Tab to take one); Enter, a comma or leaving the
 * box turns what was typed into a chip ("Name <address>" works too), and Backspace in an empty box
 * removes the last chip. Addresses that don't look like addresses are drawn in red. Follows the
 * combobox pattern: focus stays in the text box while the suggestions are highlighted.
 */
export function RecipientInput({
  value,
  onChange,
  contacts = [],
  label,
  id: ownId,
  placeholder,
  autoFocus,
  invalid,
  describedBy,
  size,
  className,
  ref,
}: RecipientInputProps) {
  const autoId = useId();
  const id = ownId ?? autoId;
  const listId = `${id}-list`;
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);

  const q = text.trim().toLowerCase();
  const taken = new Set(value.map((p) => p.email.toLowerCase()));
  const suggestions = q
    ? contacts.filter((c) => !taken.has(c.email.toLowerCase()) && (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))).slice(0, 6)
    : [];
  const shown = open && suggestions.length > 0;

  const add = (p: Person | null) => {
    setText("");
    setActive(0);
    if (!p || taken.has(p.email.toLowerCase())) return;
    onChange([...value, p]);
  };
  const commitText = () => add(parseRecipient(text, contacts));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && shown) {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && shown) {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if ((e.key === "Enter" || e.key === "Tab") && shown) {
      e.preventDefault();
      add(suggestions[active]);
    } else if ((e.key === "Enter" || e.key === "," || e.key === ";") && text.trim()) {
      e.preventDefault();
      commitText();
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape" && shown) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div data-slot="recipient-input" className={cn("relative min-w-0", controlSize(size), className)}>
      <div
        data-measure
        onClick={(e) => {
          if (e.target === e.currentTarget) input.current?.focus();
        }}
        className={cn(
          "flex min-h-(--ctl-h) cursor-text flex-wrap items-center gap-0.5 border bg-background p-px text-(length:--ctl-text)",
          invalid ? "border-destructive" : "border-input",
          FOCUS_WITHIN_RING,
        )}
      >
        {value.map((p, i) => {
          const ok = isValidRecipient(p);
          return (
            <Chip
              key={p.email + i}
              name={p.name}
              onRemove={() => {
                onChange(value.filter((_, j) => j !== i));
                input.current?.focus();
              }}
              className={cn("ctl-xs h-[calc(var(--ctl-h)+0px)] max-w-full", !ok && "border-destructive text-destructive")}
            >
              <span title={p.email} className="truncate">
                {p.name}
                {!ok && <span className="sr-only"> (not a valid address)</span>}
              </span>
            </Chip>
          );
        })}
        <input
          ref={(el) => {
            input.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          id={id}
          role="combobox"
          aria-label={label}
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown ? `${id}-opt-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          placeholder={value.length ? undefined : placeholder}
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            // A pasted list ("a@x.se, b@y.se") becomes chips at once
            if (/[,;]/.test(v) && v.trim().length > 1) {
              const parts = v.split(/[,;]/);
              const last = parts.pop() ?? "";
              const added = parts.map((s) => parseRecipient(s, contacts)).filter((p): p is Person => !!p && !taken.has(p.email.toLowerCase()));
              if (added.length) onChange([...value, ...added]);
              setText(last);
            } else setText(v);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setOpen(false);
            if (text.trim()) commitText();
          }}
          className="h-[calc(var(--ctl-h)-4px)] min-w-[10ch] flex-1 bg-transparent px-(--ctl-inset) placeholder:text-muted-foreground focus-visible:outline-none"
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label={`${label} suggestions`}
        hidden={!shown}
        className="absolute inset-x-0 top-full z-20 mt-px max-h-60 overflow-auto border border-border bg-popover py-0.5 text-(length:--ctl-text) text-popover-foreground shadow-md"
      >
        {suggestions.map((c, i) => (
          <li
            key={c.email}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onMouseMove={() => setActive(i)}
            onClick={() => {
              add(c);
              input.current?.focus();
            }}
            className={cn("flex cursor-pointer items-baseline justify-between gap-3 px-(--ctl-inset) py-1", i === active && "bg-accent")}
          >
            <span className="truncate">{c.name}</span>
            <span className="truncate text-[0.9em] text-muted-foreground">{c.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
