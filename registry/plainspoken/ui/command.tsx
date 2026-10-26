"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { LoaderCircle, Search, X, type Glyph } from "@/registry/plainspoken/lib/icons";
import { FOCUS_WITHIN_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { useModal } from "@/registry/plainspoken/ui/dialog";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { cn } from "@/lib/utils";

export interface CommandItem {
  /** Unique in the palette. Defaults to the label. */
  id?: string;
  label: string;
  /** Muted text after the label: where it goes, what it does */
  hint?: string;
  icon?: Glyph;
  /** More words it can be found by: "preferences" for Settings */
  keywords?: string[];
  /** Keys shown on the right, one per key: `["⌘", "N"]`. Display only; binding them is up to you. */
  shortcut?: string[];
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandGroup {
  /** Shown over the group and read out as its name */
  heading?: string;
  items: CommandItem[];
}

/**
 * How well an item matches the typed words, 0 for not at all. Every word must be found somewhere
 * (label, hint or keywords); a label that starts with it scores highest, then a word in the label
 * that starts with it, then anywhere in the label, then only in the hint or keywords.
 */
export function scoreCommand(item: CommandItem, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  const label = item.label.toLowerCase();
  const starts = label.split(/[\s\-_/.:]+/);
  const rest = [item.hint ?? "", ...(item.keywords ?? [])].join(" ").toLowerCase();
  let score = 0;
  for (const w of words) {
    if (label.startsWith(w)) score += 8;
    else if (starts.some((s) => s.startsWith(w))) score += 4;
    else if (label.includes(w)) score += 2;
    else if (rest.includes(w)) score += 1;
    else return 0;
  }
  return score;
}

/** The label with the typed words in bold and underlined */
function Highlight({ text, query }: { text: string; query: string }) {
  const lower = text.toLowerCase();
  const marks: [number, number][] = [];
  for (const w of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    const i = lower.indexOf(w);
    if (i >= 0) marks.push([i, i + w.length]);
  }
  if (!marks.length) return <>{text}</>;
  marks.sort((a, b) => a[0] - b[0]);
  const out: ReactNode[] = [];
  let at = 0;
  for (const [s, e] of marks) {
    if (e <= at) continue;
    const from = Math.max(s, at);
    if (from > at) out.push(text.slice(at, from));
    out.push(
      <mark key={from} className="bg-transparent font-bold text-inherit underline underline-offset-2">
        {text.slice(from, e)}
      </mark>,
    );
    at = e;
  }
  out.push(text.slice(at));
  return <>{out}</>;
}

const keyOf = (item: CommandItem) => item.id ?? item.label;

export interface CommandProps {
  groups: CommandGroup[];
  /** Accessible name of the search box and the list. Default "Commands". */
  label?: string;
  placeholder?: string;
  /** The typed text, controlled; leave out to let the palette keep its own */
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  /** Filter and sort the items by the typed text. Turn off when you search yourself (on a server) and pass the results. */
  filter?: boolean;
  /** Results are on their way: a spinner in the search box and a "Searching…" line */
  loading?: boolean;
  /** What to say when nothing matches. Default: No results for “…”. */
  empty?: ReactNode;
  /** Escape with nothing typed. CommandDialog closes; an inline palette might blur or reset. */
  onEscape?: () => void;
  /** Called with the chosen item before its onSelect runs (CommandDialog closes itself here) */
  onRun?: (item: CommandItem) => void;
  /** Put focus in the search box on mount */
  autoFocus?: boolean;
  /** Row height from the shared scale. Leave out to take the surrounding size. */
  size?: ControlSize;
  /** Something at the end of the search row: a close button */
  searchEnd?: ReactNode;
  className?: string;
  /** Classes for the scrolling list: its max height */
  listClassName?: string;
  /** Draw without a border of its own (inside a dialog or a panel) */
  bare?: boolean;
}

/**
 * A command palette: a search box over a filtered, grouped list of commands. It follows the ARIA
 * combobox pattern with a listbox: focus stays in the search box, ↑ and ↓ move the highlight (and
 * wrap), Enter runs the highlighted command, Escape clears the text (and, with nothing typed,
 * calls `onEscape`). The pointer highlights too, and a click runs. Matching words are bold and
 * underlined; the best matches come first within each group, and a live region tells screen
 * readers how many there are. Inline, it sits in the page (a "Go to…" box in a sidebar); in a
 * modal, use CommandDialog.
 */
export function Command({
  groups,
  label = "Commands",
  placeholder = "Type a command or search…",
  search: searchProp,
  defaultSearch = "",
  onSearchChange,
  filter = true,
  loading = false,
  empty,
  onEscape,
  onRun,
  autoFocus = false,
  size,
  searchEnd,
  className,
  listClassName,
  bare = false,
}: CommandProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [own, setOwn] = useState(defaultSearch);
  const search = searchProp ?? own;
  const setSearch = (s: string) => {
    if (searchProp === undefined) setOwn(s);
    onSearchChange?.(s);
  };
  const query = search.trim();

  const shown = groups
    .map((g) => {
      if (!filter || !query) return g;
      const scored = g.items.map((item) => ({ item, s: scoreCommand(item, query) })).filter((x) => x.s > 0);
      // Stable: equal scores keep their order
      scored.sort((a, b) => b.s - a.s);
      return { ...g, items: scored.map((x) => x.item) };
    })
    .filter((g) => g.items.length > 0);
  const flat = shown.flatMap((g) => g.items);
  const enabled = flat.filter((i) => !i.disabled);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  // The highlight follows its item through filtering; when that item is gone, the first one takes it.
  const active = enabled.find((i) => keyOf(i) === activeKey) ?? enabled[0] ?? null;
  const activeIndex = active ? flat.indexOf(active) : -1;
  const optionId = (i: number) => `${id}-option-${i}`;

  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const fromKeys = useRef(false);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (!fromKeys.current || activeIndex < 0) return;
    fromKeys.current = false;
    list.current?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)?.scrollIntoView({ block: "nearest" });
  });

  const run = (item: CommandItem) => {
    if (item.disabled) return;
    onRun?.(item);
    item.onSelect();
  };
  const move = (by: 1 | -1) => {
    if (!enabled.length) return;
    const i = active ? enabled.indexOf(active) : -1;
    const next = enabled[(i + by + enabled.length) % enabled.length];
    fromKeys.current = true;
    setActiveKey(keyOf(next));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (active) run(active);
    } else if (e.key === "Escape") {
      if (search) {
        // Clearing comes first; the second Escape closes. Stops a surrounding dialog closing too.
        e.preventDefault();
        e.stopPropagation();
        setSearch("");
      } else onEscape?.();
    }
  };

  return (
    <div
      data-slot="command"
      className={cn(
        "flex min-h-0 flex-col bg-background text-(length:--ctl-text) [&_svg]:size-(--ctl-icon) [&_svg]:shrink-0",
        !bare && cn("border border-input", FOCUS_WITHIN_RING),
        controlSize(size),
        className,
      )}
    >
      <div className="flex h-(--ctl-h) shrink-0 items-center gap-(--ctl-gap) border-b border-border px-(--ctl-inset)">
        <Icon icon={loading ? LoaderCircle : Search} className={cn("text-muted-foreground", loading && "animate-spin motion-reduce:animate-none")} />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveKey(null);
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent placeholder:text-muted-foreground focus-visible:outline-none"
        />
        {searchEnd}
      </div>
      <div
        ref={list}
        id={listId}
        role="listbox"
        aria-label={label}
        aria-busy={loading || undefined}
        className={cn("max-h-80 min-h-0 overflow-y-auto overscroll-contain", flat.length > 0 && "py-1", listClassName)}
      >
        {shown.map((g, gi) => {
          const headingId = `${id}-group-${gi}`;
          const options = g.items.map((item) => {
            const i = flat.indexOf(item);
            const isActive = i === activeIndex;
            return (
              <div
                key={keyOf(item)}
                id={optionId(i)}
                role="option"
                aria-selected={isActive}
                aria-disabled={item.disabled || undefined}
                data-active={isActive || undefined}
                onPointerMove={() => !item.disabled && keyOf(item) !== activeKey && setActiveKey(keyOf(item))}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(item)}
                className={cn(
                  "group/option flex min-h-(--ctl-h) cursor-default items-center gap-(--ctl-gap) px-(--ctl-inset) py-0.5 leading-snug select-none",
                  isActive && "bg-primary text-primary-foreground",
                  item.disabled && "text-muted-foreground",
                )}
              >
                <span aria-hidden className="flex w-(--ctl-icon) shrink-0 justify-center">
                  {item.icon && <Icon icon={item.icon} className={isActive ? undefined : "text-muted-foreground"} />}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={item.label} query={query} />
                  {item.hint && <span className={cn("ml-2 text-[0.9em]", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>{item.hint}</span>}
                </span>
                {item.shortcut && <Kbd keys={item.shortcut} className="shrink-0 text-[12px]" />}
              </div>
            );
          });
          return g.heading ? (
            <div key={g.heading} role="group" aria-labelledby={headingId} className="[&+&]:mt-1 [&+&]:border-t [&+&]:border-border [&+&]:pt-1">
              <div id={headingId} role="presentation" className="px-(--ctl-inset) pt-1 pb-0.5 text-[12px] font-bold text-muted-foreground">
                {g.heading}
              </div>
              {options}
            </div>
          ) : (
            <Fragment key={`group-${gi}`}>{options}</Fragment>
          );
        })}
      </div>
      {loading && flat.length === 0 && <p className="px-3 py-4 text-center text-muted-foreground">Searching…</p>}
      {!loading && flat.length === 0 && (
        <p className="px-3 py-6 text-center text-muted-foreground">{empty ?? (query ? <>No results for “{query}”.</> : "Nothing here yet.")}</p>
      )}
      <span className="sr-only" aria-live="polite">
        {loading ? "Searching" : query ? (flat.length ? `${flat.length} ${flat.length === 1 ? "result" : "results"}` : "No results") : ""}
      </span>
    </div>
  );
}

export interface CommandDialogProps extends Omit<CommandProps, "onEscape" | "onRun" | "autoFocus" | "bare" | "searchEnd"> {
  open: boolean;
  onClose: () => void;
  /** Hints under the list (↑↓, Enter, Esc) on wide screens. Default true. */
  hints?: boolean;
}

/**
 * The command palette in a modal <dialog>, near the top of the window: open it from a button and
 * with ⌘K or Ctrl+K (see useCommandShortcut). It opens with an empty search box focused, closes on
 * Escape (after clearing the text), a click outside, or running a command, and puts focus back
 * where it was. On phones it fills the screen, with a close button in the search row.
 */
export function CommandDialog({ open, onClose, hints = true, label = "Command palette", className, listClassName, ...props }: CommandDialogProps) {
  const modal = useModal({ open, onClose });
  return (
    <dialog
      {...modal}
      data-slot="command-dialog"
      aria-label={label}
      className={cn(
        "mx-auto mt-[12vh] mb-auto max-h-[76vh] w-[36rem] max-w-[calc(100vw-1.5rem)] overflow-hidden border border-border bg-background p-0 text-[14px] text-foreground shadow-md backdrop:bg-background/70 open:flex open:flex-col",
        "max-sm:m-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-screen max-sm:max-w-none max-sm:border-0",
        className,
      )}
    >
      {open && (
        <>
          <Command
            {...props}
            label={label}
            bare
            autoFocus
            onRun={onClose}
            className="min-h-0 flex-1 ctl-lg sm:ctl-md [&>div:first-child]:ctl-lg"
            listClassName={cn("max-h-[min(24rem,60vh)] max-sm:max-h-none max-sm:flex-1", listClassName)}
            searchEnd={<IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose} className="sm:hidden" />}
          />
          {hints && (
            <p aria-hidden className="flex shrink-0 gap-4 border-t border-border bg-muted px-3 py-1 text-[12px] text-muted-foreground max-sm:hidden">
              <span>
                <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
              </span>
              <span>
                <Kbd>Enter</Kbd> to run
              </span>
              <span>
                <Kbd>Esc</Kbd> to close
              </span>
            </p>
          )}
        </>
      )}
    </dialog>
  );
}

/**
 * Calls `onTrigger` on ⌘K (Mac) or Ctrl+K (elsewhere), anywhere on the page, and stops the
 * browser's own use of it (Firefox focuses its search bar). Pass another letter for another key.
 * Typically `useCommandShortcut(() => setOpen((o) => !o))`.
 */
export function useCommandShortcut(onTrigger: () => void, key = "k") {
  const latest = useRef(onTrigger);
  useLayoutEffect(() => {
    latest.current = onTrigger;
  });
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key.toLowerCase() !== key || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.repeat) return;
      e.preventDefault();
      latest.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);
}

const noSubscribe = () => () => {};
const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * "⌘" on Apple devices and "Ctrl" elsewhere, for showing the shortcut: `<Kbd keys={[mod, "K"]} />`.
 * The server and the first render say "Ctrl"; on a Mac it changes to "⌘" straight after.
 */
export function useModifierKey(): "⌘" | "Ctrl" {
  return useSyncExternalStore(
    noSubscribe,
    () => (isApple() ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}
