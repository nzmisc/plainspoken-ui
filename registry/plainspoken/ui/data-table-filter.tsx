"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowDown01, ArrowDown10, ArrowDownAZ, ArrowDownZA, CalendarArrowDown, CalendarArrowUp, Search, type Glyph } from "@/registry/plainspoken/lib/icons";
import {
  conditionOps,
  DATE_PERIODS,
  distinctValues,
  filterTest,
  isConditionComplete,
  normalizeFilter,
  regexError,
  setSortLevel,
  type ColumnFilter,
  type DataColumn,
  type DatePeriod,
  type FilterCondition,
  type FilterOp,
  type SortDir,
  valueKey,
  type SortKey,
} from "@/registry/plainspoken/lib/data-table";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Input } from "@/registry/plainspoken/ui/input";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

/** At most this many values are drawn in the checklist; searching finds the rest. */
const LIST_LIMIT = 500;

const SORT_WORDS: Record<"text" | "number" | "date", { asc: [string, Glyph]; desc: [string, Glyph] }> = {
  text: { asc: ["Sort A to Z", ArrowDownAZ], desc: ["Sort Z to A", ArrowDownZA] },
  number: { asc: ["Sort smallest to largest", ArrowDown01], desc: ["Sort largest to smallest", ArrowDown10] },
  date: { asc: ["Sort oldest to newest", CalendarArrowDown], desc: ["Sort newest to oldest", CalendarArrowUp] },
};

const FILTERS_WORD = { text: "Text filters", enum: "Text filters", number: "Number filters", date: "Date filters" } as const;

export interface ColumnFilterPanelProps<T> {
  column: DataColumn<T>;
  /** The column's filter as it is now; the panel edits a copy and hands it over on OK */
  filter: ColumnFilter | undefined;
  /** What the other filters leave: the checklist's values and their counts */
  rows: T[];
  /** Every row, which top, bottom and average conditions are worked out over */
  allRows: T[];
  /** The time date periods count from */
  now?: number;
  sort: SortKey[];
  /** Leave out when the column doesn't sort: the sort buttons go */
  onSort?: (sort: SortKey[]) => void;
  /** OK, or "Clear filter": the new filter, undefined for none */
  onApply: (filter: ColumnFilter | undefined) => void;
  onCancel: () => void;
  className?: string;
}

const defaultOp = (type: DataColumn<unknown>["type"]): FilterOp => (type === "number" ? "gt" : type === "date" ? "gte" : "contains");

/**
 * A column's filter, the way Excel's AutoFilter does it: sort buttons, then either a checklist of
 * the column's values (searchable, with counts, "(Select all)" and "(Blanks)") or up to two
 * conditions joined by and/or ("contains", "> 1,000", "top 10", "this month"). Like Excel it edits
 * a draft: OK applies it, Cancel or Escape drops it. Sorting applies at once.
 *
 * Keyboard: Tab between the parts; the checklist is one stop, with ↑ ↓ Home End to move and Space
 * to tick; Enter in a text box is OK. While searching, OK keeps only the ticked results, unless
 * "Add current selection to filter" is ticked.
 */
export function ColumnFilterPanel<T>({ column: c, filter, rows, allRows, now, sort, onSort, onApply, onCancel, className }: ColumnFilterPanelProps<T>) {
  const current = normalizeFilter(filter);
  const [tab, setTab] = useState<"values" | "conditions">(current?.kind === "conditions" ? "conditions" : "values");
  const items = useMemo(() => distinctValues(c, rows), [c, rows]);
  const listed = useMemo(() => items.map((i) => i.key), [items]);

  // The checklist's ticks: the filter's values, or what its conditions let through, or everything
  const [ticks, setTicks] = useState<Set<string>>(() => {
    if (current?.kind === "values") return new Set(current.values);
    const test = current ? filterTest(c, filter, allRows, now) : null;
    return new Set(test ? rows.filter(test).map((r) => valueKey(c, r)) : listed);
  });
  const [search, setSearch] = useState("");
  const [searchTicks, setSearchTicks] = useState<Set<string>>(new Set());
  const [addToFilter, setAddToFilter] = useState(false);
  const q = search.trim().toLowerCase();
  const matches = useMemo(() => (q ? items.filter((i) => (i.key === "" ? "(blanks)" : i.label.toLowerCase()).includes(q)) : items), [items, q]);

  const [conds, setConds] = useState<[FilterCondition, FilterCondition | null]>(() =>
    current?.kind === "conditions" ? [current.conditions[0], current.conditions[1] ?? null] : [{ op: defaultOp(c.type), value: "" }, null],
  );
  const [join, setJoin] = useState<"and" | "or">(current?.kind === "conditions" ? current.join : "and");
  const [thenBy, setThenBy] = useState(false);

  // What OK would apply, and whether it can
  const chosen = (() => {
    if (!q) return listed.filter((k) => ticks.has(k));
    const picked = matches.map((i) => i.key).filter((k) => searchTicks.has(k));
    return addToFilter ? listed.filter((k) => ticks.has(k) || picked.includes(k)) : picked;
  })();
  const draftConditions = [conds[0], conds[1]].filter(isConditionComplete);
  const canApply = tab === "values" ? chosen.length > 0 : draftConditions.length > 0;

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canApply) return;
    if (tab === "values") onApply(chosen.length === listed.length ? undefined : { kind: "values", values: chosen });
    else onApply({ kind: "conditions", conditions: draftConditions, join });
  };

  // Focus the search box (or the first condition's value) on opening
  const root = useRef<HTMLFormElement>(null);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>("[data-autofocus] input, [data-autofocus] select, input[data-autofocus]")?.focus();
  }, [tab]);

  const type = c.type === "enum" ? "text" : c.type;
  const sortWords = SORT_WORDS[type];
  const otherLevels = sort.some((s) => s.key !== c.key);
  const sortBy = (dir: SortDir, e: MouseEvent) => onSort?.(setSortLevel(sort, c.key, dir, e.shiftKey || thenBy));
  const isSorted = (dir: SortDir) => sort.some((s) => s.key === c.key && s.dir === dir);

  const shown = matches.slice(0, LIST_LIMIT);
  const box = q ? searchTicks : ticks;
  const setBox = q ? setSearchTicks : setTicks;
  const allOn = shown.length > 0 && matches.every((i) => box.has(i.key));
  const someOn = matches.some((i) => box.has(i.key));
  const toggleAll = () => {
    const next = new Set(box);
    for (const i of matches) {
      if (allOn) next.delete(i.key);
      else next.add(i.key);
    }
    setBox(next);
  };
  const toggle = (key: string, on: boolean) => {
    const next = new Set(box);
    if (on) next.add(key);
    else next.delete(key);
    setBox(next);
  };

  return (
    <form ref={root} onSubmit={apply} data-slot="column-filter-panel" aria-label={`Filter and sort ${c.header}`} className={cn("flex flex-col gap-2 text-[13px]", className)}>
      {onSort && (
        <div role="group" aria-label={`Sort by ${c.header}`} className="flex flex-col items-stretch gap-0.5">
          {(["asc", "desc"] as const).map((dir) => (
            <Button
              key={dir}
              variant="ghost"
              icon={sortWords[dir][1]}
              aria-pressed={isSorted(dir)}
              onClick={(e) => sortBy(dir, e)}
              title={otherLevels ? "Shift-click to add it as another sort level" : undefined}
              className={cn("justify-start", isSorted(dir) && "font-bold")}
            >
              {sortWords[dir][0]}
            </Button>
          ))}
          {otherLevels && <Checkbox label="Add as another sort level (then by)" checked={thenBy} onChange={(e) => setThenBy(e.target.checked)} className="pl-(--ctl-px)" />}
        </div>
      )}

      <div className={cn("flex flex-col gap-2", onSort && "border-t border-border pt-2")}>
        <SegmentedControl
          label={`Filter ${c.header} by`}
          value={tab}
          onChange={setTab}
          options={[
            { value: "values", label: "Values" },
            { value: "conditions", label: FILTERS_WORD[c.type] },
          ]}
          className="self-start"
        />

        {tab === "values" ? (
          <>
            <Input
              type="search"
              data-autofocus
              prefix={Search}
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                // Like Excel: a new search starts with all of its results ticked
                const nq = v.trim().toLowerCase();
                setSearchTicks(new Set(items.filter((i) => (i.key === "" ? "(blanks)" : i.label.toLowerCase()).includes(nq)).map((i) => i.key)));
              }}
              placeholder="Search"
              aria-label={`Search ${c.header} values`}
              className="w-full"
            />
            <CheckList
              label={`${c.header} values`}
              allLabel={q ? "(Select all search results)" : "(Select all)"}
              allOn={allOn}
              someOn={someOn}
              onAll={toggleAll}
              items={shown.map((i) => ({ key: i.key, label: i.key === "" ? "(Blanks)" : i.label || i.key, count: i.count, on: box.has(i.key) }))}
              onToggle={toggle}
            />
            {matches.length > shown.length && (
              <p className="text-muted-foreground">
                Showing {shown.length} of {matches.length} values. Search to find the others.
              </p>
            )}
            {q && matches.length === 0 && <p className="text-muted-foreground">No values match.</p>}
            {q && <Checkbox label="Add current selection to filter" checked={addToFilter} onChange={(e) => setAddToFilter(e.target.checked)} />}
          </>
        ) : (
          <ConditionEditor column={c} conds={conds} onConds={setConds} join={join} onJoin={setJoin} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
        <Button variant="link" disabled={!current} onClick={() => onApply(undefined)} className="mr-auto">
          Clear filter from “{c.header}”
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!canApply} title={canApply ? undefined : tab === "values" ? "Tick at least one value" : "Fill in a condition"}>
          OK
        </Button>
      </div>
    </form>
  );
}

/** A list of real checkboxes that is one Tab stop: ↑ ↓ Home End move between them, Space ticks. */
function CheckList({
  label,
  allLabel,
  allOn,
  someOn,
  onAll,
  items,
  onToggle,
}: {
  label: string;
  allLabel: string;
  allOn: boolean;
  someOn: boolean;
  onAll: () => void;
  items: { key: string; label: string; count: number; on: boolean }[];
  onToggle: (key: string, on: boolean) => void;
}) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const count = items.length + 1;
  const at = Math.min(active, count - 1);
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const next = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? count - 1 : null;
    if (next == null) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(count - 1, next));
    setActive(i);
    list.current?.querySelectorAll<HTMLInputElement>("input[type=checkbox]")[i]?.focus();
  };
  const row = "flex w-full items-center gap-(--ctl-gap) pr-1";
  return (
    <ul ref={list} aria-label={label} onKeyDown={onKeyDown} className="max-h-56 min-h-16 overflow-auto border border-input bg-background px-1.5 py-0.5">
      <li>
        <Checkbox label={allLabel} checked={allOn} indeterminate={someOn && !allOn} onChange={onAll} tabIndex={at === 0 ? 0 : -1} onFocus={() => setActive(0)} className={row} />
      </li>
      {items.map((it, i) => (
        <li key={it.key}>
          <Checkbox
            label={
              <span className="flex min-w-0 justify-between gap-3">
                <span className={cn("truncate", it.key === "" && "text-muted-foreground")}>{it.label}</span>
                <span className="text-muted-foreground tabular-nums">{it.count.toLocaleString("en-US")}</span>
              </span>
            }
            checked={it.on}
            onChange={(e) => onToggle(it.key, e.target.checked)}
            tabIndex={at === i + 1 ? 0 : -1}
            onFocus={() => setActive(i + 1)}
            className={cn(row, "[&>span:last-child]:grow")}
          />
        </li>
      ))}
    </ul>
  );
}

/** Excel's Custom AutoFilter: "Show rows where Total", a condition, And or Or, another. */
function ConditionEditor<T>({
  column: c,
  conds,
  onConds,
  join,
  onJoin,
}: {
  column: DataColumn<T>;
  conds: [FilterCondition, FilterCondition | null];
  onConds: (c: [FilterCondition, FilterCondition | null]) => void;
  join: "and" | "or";
  onJoin: (j: "and" | "or") => void;
}) {
  const ops = conditionOps(c.type);
  const err = regexError({ kind: "conditions", conditions: conds.filter((x) => x != null) });
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-muted-foreground">
        Show rows where <b className="text-foreground">{c.header}</b>
      </legend>
      <ConditionRow column={c} ops={ops} cond={conds[0]} onChange={(x) => onConds([x!, conds[1]])} index={1} autoFocus />
      <SegmentedControl
        label="Join the two conditions with"
        value={join}
        onChange={onJoin}
        options={[
          { value: "and", label: "And" },
          { value: "or", label: "Or" },
        ]}
        className="self-start"
      />
      <ConditionRow column={c} ops={ops} cond={conds[1]} onChange={(x) => onConds([conds[0], x])} index={2} optional />
      {err && <p className="text-destructive">Regular expression: {err}</p>}
    </fieldset>
  );
}

function ConditionRow<T>({
  column: c,
  ops,
  cond,
  onChange,
  index,
  optional = false,
  autoFocus = false,
}: {
  column: DataColumn<T>;
  ops: { op: FilterOp; label: string }[];
  cond: FilterCondition | null;
  onChange: (c: FilterCondition | null) => void;
  index: number;
  optional?: boolean;
  autoFocus?: boolean;
}) {
  const op = cond?.op;
  const set = (patch: Partial<FilterCondition>) => onChange({ ...(cond ?? { op: ops[0].op }), ...patch });
  const inputType = c.type === "number" ? "number" : c.type === "date" ? "date" : "text";
  const name = `Condition ${index}`;
  const valueBox = (key: "value" | "to", label: string) => (
    <Input
      type={inputType}
      value={cond?.[key] ?? ""}
      onChange={(e) => set({ [key]: e.target.value })}
      aria-label={`${name}: ${label}`}
      data-autofocus={autoFocus && key === "value" ? "" : undefined}
      className={cn("min-w-0 flex-1", c.type === "text" || c.type === "enum" ? "basis-32" : "basis-24")}
      inputClassName={op === "regex" ? "font-mono" : undefined}
    />
  );
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Select
        aria-label={`${name}: comparison`}
        value={op ?? ""}
        placeholder={optional ? "(no second condition)" : undefined}
        onChange={(e) => {
          const next = e.target.value as FilterOp | "";
          if (!next) return onChange(null);
          onChange({
            op: next,
            value: next === "period" || next === "top" || next === "bottom" ? undefined : (cond?.value ?? ""),
            to: next === "between" ? (cond?.to ?? "") : undefined,
            count: next === "top" || next === "bottom" ? (cond?.count ?? 10) : undefined,
            percent: next === "top" || next === "bottom" ? (cond?.percent ?? false) : undefined,
            period: next === "period" ? (cond?.period ?? "thisMonth") : undefined,
          });
        }}
        options={ops.map((o) => ({ value: o.op, label: o.label }))}
        className="max-w-full"
      />
      {op === "between" ? (
        <span className="flex w-full items-center gap-1">
          {valueBox("value", "from")}
          <span className="text-muted-foreground">and</span>
          {valueBox("to", "to")}
        </span>
      ) : op === "top" || op === "bottom" ? (
        <span className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            value={cond?.count ?? 10}
            onChange={(e) => set({ count: Math.max(0, Math.floor(Number(e.target.value))) })}
            aria-label={`${name}: how many`}
            className="w-16"
          />
          <Select
            aria-label={`${name}: items or percent`}
            value={cond?.percent ? "percent" : "items"}
            onChange={(e) => set({ percent: e.target.value === "percent" })}
            options={[
              { value: "items", label: "rows" },
              { value: "percent", label: "percent" },
            ]}
          />
        </span>
      ) : op === "period" ? (
        <Select
          aria-label={`${name}: period`}
          value={cond?.period ?? "thisMonth"}
          onChange={(e) => set({ period: e.target.value as DatePeriod })}
          options={DATE_PERIODS.map((p) => ({ value: p.period, label: p.label }))}
        />
      ) : op === "aboveAverage" || op === "belowAverage" || op == null ? null : (
        valueBox("value", "value")
      )}
    </div>
  );
}
