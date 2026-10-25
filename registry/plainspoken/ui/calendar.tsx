"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/registry/plainspoken/lib/icons";
import {
  addDays,
  addMonths,
  clampDate,
  day,
  endOfMonth,
  formatDate,
  isoWeek,
  month,
  monthNames,
  sameMonth,
  startOfMonth,
  startOfWeek,
  weekdayNames,
  year,
  type ISODate,
} from "@/registry/plainspoken/lib/dates";
import { useDateLocale, useToday } from "@/registry/plainspoken/hooks/use-today";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

export interface DateRange {
  start: ISODate;
  /** null while the second click is pending */
  end: ISODate | null;
}

interface CalendarBase {
  /** First month shown (any day in it). Controlled; pair with onMonthChange. */
  month?: ISODate;
  /** Uncontrolled starting month. Defaults to the selection, else today's month. */
  defaultMonth?: ISODate;
  onMonthChange?: (month: ISODate) => void;
  /** Months side by side (they wrap on narrow screens) */
  numberOfMonths?: number;
  /** 1 = Monday (ISO, the default), 0 = Sunday */
  weekStartsOn?: 0 | 1;
  /** ISO 8601 week numbers in a first column */
  showWeekNumbers?: boolean;
  /** Days from the neighbouring months that fill the first and last rows. Defaults to on for one month, off for several. */
  showOutsideDays?: boolean;
  /**
   * The date to treat as today (outlined, the "Today" button, where the calendar opens). Leave out
   * to use the viewer's today, which is only known in the browser: see the note on Calendar.
   */
  today?: ISODate;
  min?: ISODate;
  max?: ISODate;
  /** Days that can't be chosen: weekends, booked days */
  isDisabled?: (d: ISODate) => boolean;
  /** BCP 47 locale for month and weekday names; the browser's by default */
  locale?: string;
  /** "compact" for pickers and sidebars; "large" fills the width and gives each day room for content (see renderDay) */
  size?: "compact" | "large";
  /** Extra content inside a day cell: event dots or labels */
  renderDay?: (d: ISODate) => ReactNode;
  /** Extra words for a day's accessible name: "2 events: Release 4.2, Retro" */
  describeDay?: (d: ISODate) => string | undefined;
  /** Move focus into the grid on mount (the date picker's popover uses this) */
  autoFocus?: boolean;
  className?: string;
}

export interface SingleCalendarProps extends CalendarBase {
  mode?: "single";
  value?: ISODate | null;
  defaultValue?: ISODate | null;
  onChange?: (d: ISODate) => void;
}

export interface RangeCalendarProps extends CalendarBase {
  mode: "range";
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (r: DateRange) => void;
}

export type CalendarProps = SingleCalendarProps | RangeCalendarProps;

/** Laid out, invisibly, while the month to show isn't known yet, so the real one takes exactly its place */
const PLACEHOLDER_MONTH = "2026-03-01";

/**
 * Month grid calendar for picking a day or a range, or for showing what happens on which day.
 * Dates are ISO strings ("2026-10-19", see lib/dates), so there is no time zone to get wrong.
 *
 * Keyboard (the WAI-ARIA date grid pattern): arrows move by day and week, Home/End go to the
 * start/end of the week, PageUp/PageDown change month, Shift+PageUp/PageDown change year, Enter or
 * Space selects. Only one day is in the tab order at a time. Disabled days can still be focused (so
 * arrowing skips nothing) but can't be selected.
 *
 * Range mode: the first click sets the start, the second the end (in either order); the pending
 * range is previewed under the pointer or keyboard focus.
 *
 * Server rendering: the viewer's today is only known in the browser. Without a `today` prop it is
 * filled in after hydration, so the "today" outline appears a moment later; and a calendar with no
 * value, month, defaultMonth or today renders invisibly (at its full size) until then, rather than
 * guess a month. Pass `today` when you know it, and a `locale` so month names match on both sides.
 */
export function Calendar(props: CalendarProps) {
  const {
    numberOfMonths = 1,
    weekStartsOn = 1,
    showWeekNumbers = false,
    showOutsideDays = numberOfMonths === 1,
    min,
    max,
    isDisabled,
    size = "compact",
    renderDay,
    describeDay,
    autoFocus,
    className,
  } = props;
  const isRange = props.mode === "range";
  const locale = useDateLocale(props.locale);
  const clientToday = useToday();
  const today = props.today ?? clientToday;

  const [ownValue, setOwnValue] = useState<ISODate | DateRange | null>(props.defaultValue ?? null);
  const value = props.value !== undefined ? props.value : ownValue;
  const range = isRange ? (value as DateRange | null) : null;
  const anchor = isRange ? (range?.start ?? null) : (value as ISODate | null);

  const [ownMonth, setOwnMonth] = useState<ISODate | null>(() => {
    const m = props.defaultMonth ?? anchor;
    return m ? startOfMonth(m) : null;
  });
  const known = props.month ?? ownMonth ?? (today ? clampDate(today, min, max) : null);
  const placeholder = known == null;
  const shown = startOfMonth(known ?? PLACEHOLDER_MONTH);
  const lastShown = endOfMonth(addMonths(shown, numberOfMonths - 1));
  const setShown = (m: ISODate) => {
    const first = startOfMonth(m);
    if (props.month === undefined) setOwnMonth(first);
    props.onMonthChange?.(first);
  };

  const [ownFocus, setFocused] = useState<ISODate | null>(null);
  const focused = ownFocus ?? anchor ?? (today ? clampDate(today, min, max) : null);
  const [hover, setHover] = useState<ISODate | null>(null);
  const focusNext = useRef(!!autoFocus);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  // The one tabbable day: the focused day if it's on screen, else the first of the first month.
  const tabbable = focused && focused >= shown && focused <= lastShown ? focused : shown;

  useEffect(() => {
    if (!focusNext.current || placeholder) return;
    const el = root.current?.querySelector<HTMLElement>(`[data-day="${tabbable}"]`);
    if (!el) return;
    focusNext.current = false;
    el.focus();
  });

  const disabled = (d: ISODate) => (min != null && d < min) || (max != null && d > max) || !!isDisabled?.(d);
  /** The first month to show so that d is on screen: d's month, or d's month last when moving forward */
  const monthFor = (d: ISODate) => (d < shown ? startOfMonth(d) : addMonths(startOfMonth(d), -(numberOfMonths - 1)));

  function moveFocus(d: ISODate) {
    const next = clampDate(d, min, max);
    if (next < shown || next > lastShown) setShown(monthFor(next));
    setFocused(next);
    if (range && range.end === null) setHover(next);
    focusNext.current = true;
  }

  function select(d: ISODate) {
    if (disabled(d)) return;
    setFocused(d);
    if (d < shown || d > lastShown) {
      setShown(monthFor(d));
      focusNext.current = true;
    }
    if (props.mode === "range") {
      const v = range;
      const next: DateRange = !v || v.end !== null ? { start: d, end: null } : d < v.start ? { start: d, end: v.start } : { start: v.start, end: d };
      setOwnValue(next);
      setHover(null);
      props.onChange?.(next);
    } else {
      setOwnValue(d);
      props.onChange?.(d);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    const from = tabbable;
    const moves: Record<string, () => ISODate> = {
      ArrowLeft: () => addDays(from, -1),
      ArrowRight: () => addDays(from, 1),
      ArrowUp: () => addDays(from, -7),
      ArrowDown: () => addDays(from, 7),
      Home: () => startOfWeek(from, weekStartsOn),
      End: () => addDays(startOfWeek(from, weekStartsOn), 6),
      PageUp: () => addMonths(from, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(from, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (!move || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    moveFocus(move());
  }

  // Range state for drawing: a finished range, or start..hover while picking the end.
  let lo: ISODate | null = null;
  let hi: ISODate | null = null;
  if (range) {
    const other = range.end ?? hover ?? range.start;
    [lo, hi] = range.start <= other ? [range.start, other] : [other, range.start];
  }
  const pending = !!range && range.end === null;
  const isSelected = (d: ISODate) => (isRange ? lo != null && hi != null && d >= lo && d <= hi : d === anchor);

  const names = monthNames(locale);
  const prevDisabled = min != null && addDays(shown, -1) < min;
  const nextDisabled = max != null && addDays(lastShown, 1) > max;
  const base = today ?? shown;
  const firstYear = Math.min(year(min ?? addMonths(base, -12 * 10)), year(shown));
  const lastYear = Math.max(year(max ?? addMonths(base, 12 * 10)), year(shown));

  const months = Array.from({ length: numberOfMonths }, (_, i) => addMonths(shown, i));
  const titleOf = (m: ISODate) => formatDate(m, { month: "long", year: "numeric" }, locale);

  return (
    <div
      ref={root}
      data-slot="calendar"
      aria-hidden={placeholder || undefined}
      inert={placeholder || undefined}
      className={cn("grid max-w-full gap-1.5 text-[13px]", size === "large" ? "w-full" : "w-fit", placeholder && "invisible", className)}
    >
      <div className="ctl-sm flex flex-wrap items-center gap-1">
        <IconButton icon={ChevronLeft} label="Previous month" disabled={prevDisabled} onClick={() => setShown(addMonths(shown, -1))} />
        <Select
          aria-label="Month"
          value={String(month(shown))}
          onChange={(e) => setShown(`${shown.slice(0, 5)}${e.target.value.padStart(2, "0")}-01`)}
          options={names.map((n, i) => ({ value: String(i + 1), label: n }))}
        />
        <Select
          aria-label="Year"
          value={String(year(shown))}
          onChange={(e) => setShown(`${e.target.value}${shown.slice(4)}`)}
          options={Array.from({ length: lastYear - firstYear + 1 }, (_, i) => String(firstYear + i))}
        />
        <IconButton icon={ChevronRight} label="Next month" disabled={nextDisabled} onClick={() => setShown(addMonths(shown, 1))} />
        <Button
          className="ml-auto"
          disabled={!today || disabled(today)}
          onClick={() => {
            if (!today) return;
            setShown(today);
            setFocused(today);
          }}
        >
          Today
        </Button>
      </div>
      {/* Announces the month when it changes from the buttons, the selects or the keyboard */}
      <p className="sr-only" aria-live="polite">
        {placeholder ? "" : numberOfMonths === 1 ? titleOf(shown) : `${titleOf(shown)} to ${titleOf(months.at(-1)!)}`}
      </p>
      <div className={cn(numberOfMonths === 1 ? "grid" : "flex flex-wrap items-start gap-3")} onMouseLeave={() => setHover(null)}>
        {months.map((m) => (
          <MonthGrid
            key={m}
            month={m}
            title={numberOfMonths > 1 ? titleOf(m) : undefined}
            titleId={`${id}-${m}`}
            ariaLabel={titleOf(m)}
            weekStartsOn={weekStartsOn}
            showWeekNumbers={showWeekNumbers}
            showOutsideDays={showOutsideDays}
            size={size}
            fill={size === "large"}
            locale={locale}
            today={today}
            tabbable={tabbable}
            disabled={disabled}
            isSelected={isSelected}
            rangeEnds={isRange ? [lo, hi] : null}
            renderDay={renderDay}
            describeDay={describeDay}
            onSelect={select}
            onHover={pending ? setHover : undefined}
            onFocusDay={setFocused}
            onKeyDown={onKeyDown}
          />
        ))}
      </div>
    </div>
  );
}

interface MonthGridProps {
  month: ISODate;
  title?: string;
  titleId: string;
  ariaLabel: string;
  weekStartsOn: 0 | 1;
  showWeekNumbers: boolean;
  showOutsideDays: boolean;
  size: "compact" | "large";
  /** As wide as the calendar (large size) */
  fill: boolean;
  locale?: string;
  today: ISODate | null;
  tabbable: ISODate;
  disabled: (d: ISODate) => boolean;
  isSelected: (d: ISODate) => boolean;
  rangeEnds: [ISODate | null, ISODate | null] | null;
  renderDay?: (d: ISODate) => ReactNode;
  describeDay?: (d: ISODate) => string | undefined;
  onSelect: (d: ISODate) => void;
  onHover?: (d: ISODate) => void;
  onFocusDay: (d: ISODate) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

const CELL = "border border-border";

function MonthGrid(p: MonthGridProps) {
  const first = startOfWeek(p.month, p.weekStartsOn);
  // Always six rows, so the grid doesn't change height from month to month.
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(first, w * 7 + i)));
  const long = weekdayNames(p.weekStartsOn, p.locale, "long");
  const short = weekdayNames(p.weekStartsOn, p.locale, "short");
  const large = p.size === "large";
  const [lo, hi] = p.rangeEnds ?? [null, null];
  const height = large ? "h-16 sm:h-20" : "h-7";

  return (
    <table
      role="grid"
      aria-labelledby={p.title ? p.titleId : undefined}
      aria-label={p.title ? undefined : p.ariaLabel}
      aria-multiselectable={p.rangeEnds ? true : undefined}
      className={cn("table-fixed border-collapse", p.fill && "w-full")}
      onKeyDown={p.onKeyDown}
    >
      {p.title && (
        <caption id={p.titleId} className="pb-1 text-left text-[14px] font-semibold">
          {p.title}
        </caption>
      )}
      <thead>
        <tr>
          {p.showWeekNumbers && (
            <th scope="col" className={cn(CELL, "h-6 w-8 bg-muted px-1 text-left text-[12px] font-normal text-muted-foreground")}>
              <abbr title="ISO week number" className="no-underline">
                Wk
              </abbr>
            </th>
          )}
          {short.map((s, i) => (
            <th key={s + i} scope="col" className={cn(CELL, "h-6 bg-muted px-1 text-left text-[12px] font-semibold", !large && "w-9")}>
              <abbr title={long[i]} className="no-underline">
                {s}
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => {
          const inMonth = week.some((d) => sameMonth(d, p.month));
          return (
            <tr key={week[0]} className={cn(!inMonth && !p.showOutsideDays && "invisible")}>
              {p.showWeekNumbers && (
                <th scope="row" className={cn(CELL, "px-1 text-left text-[12px] font-normal text-muted-foreground tabular-nums", large ? "pt-0.5 align-top" : "align-middle")}>
                  {isoWeek(addDays(week[0], p.weekStartsOn === 0 ? 1 : 0))}
                </th>
              )}
              {week.map((d) => {
                const outside = !sameMonth(d, p.month);
                if (outside && !p.showOutsideDays)
                  return (
                    <td key={d} aria-hidden className={cn(CELL, "bg-muted/50 p-0")}>
                      <span className={cn("block", height)} />
                    </td>
                  );
                const off = p.disabled(d);
                const sel = p.isSelected(d);
                const edge = !p.rangeEnds || d === lo || d === hi;
                const filled = sel && edge;
                const isToday = d === p.today;
                const extra = p.describeDay?.(d);
                const name = [formatDate(d, { dateStyle: "full" }, p.locale), isToday && "today", extra].filter(Boolean).join(", ");
                return (
                  <td
                    key={d}
                    aria-selected={sel}
                    aria-disabled={off || undefined}
                    className={cn(CELL, "p-0", filled ? "bg-primary text-primary-foreground" : sel ? "bg-accent" : outside && "text-muted-foreground")}
                  >
                    <button
                      type="button"
                      data-day={d}
                      tabIndex={d === p.tabbable ? 0 : -1}
                      aria-label={name}
                      aria-current={isToday ? "date" : undefined}
                      aria-disabled={off || undefined}
                      onClick={() => p.onSelect(d)}
                      onFocus={() => p.onFocusDay(d)}
                      onMouseEnter={() => p.onHover?.(d)}
                      className={cn(
                        "block w-full cursor-pointer text-left tabular-nums select-none",
                        height,
                        large
                          ? "flex flex-col justify-start gap-0.5 overflow-hidden px-1 py-0.5"
                          : p.renderDay
                            ? // Room for a line of dots under the number, at the same place in every day
                              "flex flex-col items-start gap-0.5 overflow-hidden px-1.5 pt-1 leading-none"
                            : "px-1.5",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2",
                        filled ? "focus-visible:outline-primary-foreground" : "focus-visible:outline-ring",
                        !sel && !off && "hover:bg-secondary",
                        off && "cursor-not-allowed text-muted-foreground line-through decoration-muted-foreground",
                        isToday && "font-bold inset-ring",
                      )}
                    >
                      <span className={cn(large && "block")}>{day(d)}</span>
                      {p.renderDay?.(d)}
                    </button>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
