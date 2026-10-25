"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type Ref } from "react";
import { Calendar as CalendarIcon } from "@/registry/plainspoken/lib/icons";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { parseISODate, type ISODate } from "@/registry/plainspoken/lib/dates";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Calendar } from "@/registry/plainspoken/ui/calendar";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { useFieldProps } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { cn } from "@/lib/utils";

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "onError" | "size" | "min" | "max" | "type" | "prefix"> {
  /** The chosen date, or null for none. Controlled; pair with onChange. */
  value?: ISODate | null;
  /** Uncontrolled starting date */
  defaultValue?: ISODate | null;
  /** Called with a valid date (or null when the field is cleared), never with half-typed text */
  onChange?: (d: ISODate | null) => void;
  /**
   * Called with what is wrong with the typed text when it is checked (on leaving the field or
   * pressing Enter), and with null once it is fine again. Put it in the surrounding Field's
   * `error` so it shows under the control and is read out with it.
   */
  onError?: (message: string | null) => void;
  min?: ISODate;
  max?: ISODate;
  /** Days that can't be chosen, in the calendar and when typed */
  isDisabled?: (d: ISODate) => boolean;
  weekStartsOn?: 0 | 1;
  showWeekNumbers?: boolean;
  /** The date to treat as today in the calendar; the viewer's today when left out */
  today?: ISODate;
  /** Locale for the calendar's month and weekday names */
  locale?: string;
  /** Height from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  invalid?: boolean;
  /**
   * What the date is, for the calendar button and popup ("Delivery date: choose from calendar").
   * Read from the field's <label> when left out.
   */
  label?: string;
  /** Classes for the outer box */
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A text field for an ISO date (YYYY-MM-DD) with a calendar in a popover. Typing works on its own
 * (the text is checked when you leave the field or press Enter); the button, or Alt+Down in the
 * field, opens the calendar, which takes focus. Escape closes it and puts focus back on the button;
 * clicking elsewhere closes it too; choosing a day closes it and puts focus back in the field.
 *
 * Inside a Field it takes the field's id, hint, error and required flag, like Input. Its own
 * checks (not a date, before `min`, after `max`, not available, required but empty) come out
 * through `onError`, so the form can show them as the Field's error; the text box is marked
 * invalid and the message is set as the input's validity, so a form won't submit meanwhile.
 *
 * The popover is a native `popover` (Floating: top layer, light dismiss and Escape for free),
 * placed under the field, or above it when there's no room below, by lib/position.
 */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  onError,
  min,
  max,
  isDisabled,
  weekStartsOn,
  showWeekNumbers,
  today,
  locale,
  size,
  invalid,
  label,
  className,
  id,
  required,
  disabled,
  placeholder = "YYYY-MM-DD",
  onBlur,
  onKeyDown,
  ref,
  ...rest
}: DatePickerProps) {
  const popId = useId();
  const f = useFieldProps({ id, invalid, required });
  const [own, setOwn] = useState<ISODate | null>(defaultValue ?? null);
  const current = value !== undefined ? value : own;
  const [text, setText] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [fieldLabel, setFieldLabel] = useState<string | undefined>(undefined);
  const box = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // A new value from outside replaces whatever is typed.
  const [shownValue, setShownValue] = useState(current);
  if (shownValue !== current) {
    setShownValue(current);
    setText(current ?? "");
    if (error) setError(null);
  }

  // The words for the button: our label prop, an aria-label, or the text of the field's <label>.
  useEffect(() => {
    const words = input.current?.labels?.[0]?.textContent?.replace(/\s*\*\s*$/, "").trim();
    setFieldLabel(words || undefined);
  }, [f.id]);
  const name = label ?? rest["aria-label"] ?? fieldLabel ?? "Date";

  function report(message: string | null) {
    // Set at once (not in an effect) so pressing Enter in a form already finds the field invalid.
    input.current?.setCustomValidity(message ?? "");
    setError(message);
  }

  // Tell the form whenever the message changes, including when a new value from outside clears it.
  const reported = useRef<string | null>(null);
  useEffect(() => {
    input.current?.setCustomValidity(error ?? "");
    if (reported.current === error) return;
    reported.current = error;
    onError?.(error);
  }, [error, onError]);

  function check(s: string): { ok: ISODate | null } | { error: string } {
    if (!s.trim()) return f.required ? { error: "Enter a date" } : { ok: null };
    const d = parseISODate(s);
    if (!d) return { error: "Not a date. Use YYYY-MM-DD, e.g. 2026-10-19" };
    if (min && d < min) return { error: `Must be ${min} or later` };
    if (max && d > max) return { error: `Must be ${max} or earlier` };
    if (isDisabled?.(d)) return { error: `${d} isn't available` };
    return { ok: d };
  }

  function choose(d: ISODate | null) {
    setOwn(d);
    setShownValue(d);
    setText(d ?? "");
    if (d !== current) onChange?.(d);
  }

  function commit() {
    const r = check(text);
    if ("error" in r) return report(r.error);
    report(null);
    choose(r.ok);
  }

  return (
    <span data-slot="date-picker" ref={box} className={cn("inline-flex max-w-full align-baseline [&>*+*]:-ml-px", controlSize(size), className)}>
      <Input
        ref={(el) => {
          input.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        id={f.id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        required={f.required}
        disabled={disabled}
        invalid={f.invalid || !!error}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => {
          commit();
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "ArrowDown" && e.altKey && !disabled) {
            e.preventDefault();
            pop.current?.showPopover();
          }
          onKeyDown?.(e);
        }}
        className="w-[calc(11ch+var(--ctl-inset)*2+2px)] focus-within:z-10"
        inputClassName="tabular-nums"
        {...rest}
      />
      <IconButton icon={CalendarIcon} label={`${name}: choose from calendar`} disabled={disabled} popoverTarget={popId} aria-expanded={open} className="focus-visible:z-10" />
      {/* Open/closed follows the popover itself, whatever opened or closed it (the button, Alt+Down, Escape, a click outside). */}
      <Floating
        ref={pop}
        id={popId}
        role="dialog"
        aria-label={`${name}: calendar`}
        open={open}
        onOpenChange={setOpen}
        anchor={() => box.current}
        side="bottom"
        align="start"
        offset={2}
        className="p-2"
      >
        {open && (
          <Calendar
            value={current}
            min={min}
            max={max}
            isDisabled={isDisabled}
            weekStartsOn={weekStartsOn}
            showWeekNumbers={showWeekNumbers}
            today={today}
            locale={locale}
            autoFocus
            onChange={(d) => {
              report(null);
              choose(d);
              pop.current?.hidePopover();
              input.current?.focus();
            }}
          />
        )}
      </Floating>
    </span>
  );
}
