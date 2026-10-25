"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, X } from "@/registry/plainspoken/lib/icons";
import { FOCUS_WITHIN_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { useField, useFieldProps } from "@/registry/plainspoken/ui/field";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Muted text at the right of the option: a port, a count, a shortcut */
  hint?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** The chosen option's value, or null for none. Leave out (and use defaultValue) to let it keep its own. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Said in the list when the typed text matches nothing. Default "No matches". */
  emptyText?: ReactNode;
  /** Form field name: the value is submitted in a hidden input */
  name?: string;
  /** Height from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  /** Accessible name when it isn't inside a Field */
  "aria-label"?: string;
  id?: string;
  required?: boolean;
  /** Classes for the outer box: width */
  className?: string;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-inherit underline">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Pick one item from a long list by typing to filter it: time zones, countries, people. Follows
 * the ARIA combobox pattern: focus stays in the text box while ↑/↓ move through the list
 * (aria-activedescendant), Home/End jump while it is open, Enter picks, Escape closes it (or,
 * when closed, clears the box), Tab leaves. The matched part of each option is bold and
 * underlined, and the number of results is announced. Leaving the box puts the chosen option's
 * label back. Inside a Field it is wired like Input.
 */
export function Combobox({
  options,
  value,
  defaultValue = null,
  onChange,
  placeholder,
  invalid,
  disabled,
  emptyText = "No matches",
  name,
  size,
  "aria-label": ariaLabel,
  id: ownId,
  required,
  className,
}: ComboboxProps) {
  const f = useFieldProps({ id: ownId, invalid, required });
  const labelId = useField()?.labelId;
  const autoId = useId();
  const id = f.id ?? autoId;
  const listId = `${id}-list`;
  const [own, setOwn] = useState<string | null>(defaultValue);
  const current = value !== undefined ? value : own;
  const selected = options.find((o) => o.value === current) ?? null;
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // While closed the box shows the chosen label; while open, what the reader typed. An untouched
  // box (text still the chosen label) shows every option.
  const shownText = open ? text : (selected?.label ?? "");
  const query = !open || text === (selected?.label ?? "") ? "" : text.trim();
  const shown = useMemo(
    () => (query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options),
    [options, query],
  );

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const commit = (v: string | null) => {
    setOwn(v);
    onChange?.(v);
  };
  const openAt = (i: number) => {
    if (!open) setText(selected?.label ?? "");
    setOpen(true);
    setActive(Math.max(0, Math.min(shown.length - 1, i)));
  };
  const pick = (o: ComboboxOption) => {
    commit(o.value);
    setOpen(false);
  };
  const selectedIndex = shown.findIndex((o) => o.value === current);

  return (
    <div data-slot="combobox" className={cn("relative inline-block w-full min-w-0 align-baseline", controlSize(size), className)}>
      <div
        data-measure
        className={cn(
          "flex h-(--ctl-h) items-stretch border text-(length:--ctl-text) leading-none [&_svg]:size-(--ctl-icon)",
          f.invalid ? "border-destructive" : "border-input",
          disabled ? "bg-muted text-muted-foreground" : "bg-background",
          FOCUS_WITHIN_RING,
        )}
      >
        <input
          id={id}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${id}-opt-${active}` : undefined}
          aria-describedby={f["aria-describedby"]}
          aria-invalid={f["aria-invalid"]}
          aria-required={f.required || undefined}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          value={shownText}
          className="w-full min-w-0 flex-1 bg-transparent px-(--ctl-inset) placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed"
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={(e) => e.target.select()}
          onClick={() => !open && openAt(selectedIndex)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              openAt(open ? active + 1 : selectedIndex);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              openAt(open ? active - 1 : shown.length - 1);
            } else if (e.key === "Home" && open) {
              e.preventDefault();
              openAt(0);
            } else if (e.key === "End" && open) {
              e.preventDefault();
              openAt(shown.length - 1);
            } else if (e.key === "Enter" && open) {
              e.preventDefault();
              if (shown[active]) pick(shown[active]);
            } else if (e.key === "Escape") {
              if (open) {
                e.preventDefault();
                setOpen(false);
              } else if (current != null) {
                e.preventDefault();
                commit(null);
              }
            }
          }}
        />
        {current != null && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear"
            title="Clear"
            className="inline-flex w-(--ctl-h) shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              commit(null);
              setText("");
            }}
          >
            <Icon icon={X} />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? "Close list" : "Open list"}
          className="inline-flex w-(--ctl-h) shrink-0 cursor-pointer items-center justify-center border-l border-input text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:hover:bg-transparent"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) setOpen(false);
            else {
              openAt(selectedIndex);
              document.getElementById(id)?.focus();
            }
          }}
        >
          <Icon icon={ChevronDown} />
        </button>
      </div>
      {name != null && <input type="hidden" name={name} value={current ?? ""} />}
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : labelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 mt-px max-h-60 overflow-auto border border-border bg-popover py-0.5 text-(length:--ctl-text) text-popover-foreground shadow-md"
      >
        {shown.length === 0 ? (
          <li className="px-(--ctl-inset) py-1 text-muted-foreground">{emptyText}</li>
        ) : (
          shown.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              data-index={i}
              role="option"
              aria-selected={o.value === current}
              className={cn("flex cursor-pointer items-center justify-between gap-3 px-(--ctl-inset) py-1", i === active && "bg-accent")}
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => setActive(i)}
              onClick={() => pick(o)}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden className="inline-flex w-(--ctl-icon) shrink-0">
                  {o.value === current && <Icon icon={Check} />}
                </span>
                <span className="truncate">
                  <Highlight text={o.label} query={query} />
                </span>
              </span>
              {o.hint && <span className="shrink-0 text-muted-foreground tabular-nums">{o.hint}</span>}
            </li>
          ))
        )}
      </ul>
      <span className="sr-only" aria-live="polite">
        {open ? `${shown.length} ${shown.length === 1 ? "result" : "results"}` : ""}
      </span>
    </div>
  );
}
