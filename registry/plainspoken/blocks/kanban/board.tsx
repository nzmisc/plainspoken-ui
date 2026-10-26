"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowDownToLine, ArrowUpToLine, Move, Plus, SquarePen } from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { DONE_COLUMN, LABELS, PEOPLE, type BoardCard, type BoardColumn, type BoardLabel, type Person } from "@/registry/plainspoken/blocks/kanban/data";
import { columnOf, moveCard } from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanCard } from "@/registry/plainspoken/blocks/kanban/card";
import { afterMenu, KanbanColumn } from "@/registry/plainspoken/blocks/kanban/column";
import { ContextMenu } from "@/registry/plainspoken/ui/context-menu";
import type { MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** A card moved: from which column to which, and where in it (an index in the target column's list without the card) */
export interface CardMove {
  cardId: string;
  from: string;
  to: string;
  index: number;
}

/** A place on the board: a column, and a position among the cards shown in it, not counting the one being moved */
export interface BoardSpot {
  columnId: string;
  index: number;
}

/** A move in progress: from the keyboard (the card moves as you press), or carried by the pointer (a line shows where it will land) */
export interface BoardDrag {
  cardId: string;
  from: BoardSpot;
  to: BoardSpot;
  mode: "keyboard" | "pointer";
}

export interface KanbanBoardProps {
  /** The columns and which cards are in them, in order. Leave out (and use defaultColumns) to let the board keep its own. */
  columns?: BoardColumn[];
  defaultColumns?: BoardColumn[];
  cards: Record<string, BoardCard>;
  /** Called when a card is dropped somewhere new, by pointer, keyboard or the Move to menu */
  onMove?: (move: CardMove) => void;
  /** Opens a card: click, Enter, or "Open card" in its menu */
  onOpen?: (cardId: string) => void;
  /** Shows only the cards that pass. Counts, keyboard moves and drop positions work on what is shown. */
  filter?: (card: BoardCard) => boolean;
  /**
   * More items for each card's ⋯ and right-click menu, after "Open card" and "Move to". Pass it
   * (even as `() => []`) to give cards a menu at all.
   */
  cardMenu?: (card: BoardCard, column: BoardColumn) => MenuItem[];
  /** More items for each column's ⋯ and right-click menu, after "Add card" */
  columnMenu?: (column: BoardColumn) => MenuItem[];
  /** Adds a card from a column's "Add a card" box. Leave out for no box. */
  onAddCard?: (columnId: string, title: string) => void;
  /** The demo's date, for overdue and due soon */
  today: ISODate;
  /** The column whose cards are finished: their due dates aren't marked */
  doneColumn?: string;
  people?: Person[];
  labels?: BoardLabel[];
  /** Start with a card mid-move, for stories: picked up from the keyboard, or carried by the pointer to `to` */
  defaultDrag?: { cardId: string; to?: BoardSpot; mode: BoardDrag["mode"] };
  /** Accessible name of the board's region. Default "Board". */
  label?: string;
  className?: string;
}

/** Index in a column's whole list for a spot among its shown cards, leaving the moving card out */
function fullIndex(columns: BoardColumn[], cardId: string, spot: BoardSpot, shown: (id: string) => boolean): number {
  const col = columns.find((c) => c.id === spot.columnId);
  if (!col) return 0;
  const rest = col.cardIds.filter((id) => id !== cardId);
  const vis = rest.filter(shown);
  if (spot.index < vis.length) return rest.indexOf(vis[spot.index]);
  return vis.length ? rest.indexOf(vis[vis.length - 1]) + 1 : rest.length;
}

/** Where a card is, among the shown cards of its column */
function spotOf(columns: BoardColumn[], cardId: string, shown: (id: string) => boolean): BoardSpot {
  const col = columnOf(columns, cardId);
  if (!col) return { columnId: columns[0]?.id ?? "", index: 0 };
  return { columnId: col.id, index: col.cardIds.filter((id) => id === cardId || shown(id)).indexOf(cardId) };
}

const sameSpot = (a: BoardSpot, b: BoardSpot) => a.columnId === b.columnId && a.index === b.index;

const subscribeNever = () => () => {};

/** A pointer that went down on a card: a drag once it moves (mouse) or has been held still (touch, pen) */
interface Session {
  cardId: string;
  pointerId: number;
  type: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  /** Where on the card it was grabbed, so the copy stays under the finger at the same spot */
  dx: number;
  dy: number;
  width: number;
  started: boolean;
  to: BoardSpot | null;
  timer: number;
  raf: number;
  stop: () => void;
}

/**
 * The board: columns side by side (scrolling sideways when they don't fit, one column to a phone
 * screen with snapping), cards that move by drag and drop, and the menus and new-card boxes of
 * the columns. Written on pointer events, so mouse, pen and touch all work: a mouse drags once it
 * moves a few pixels; a finger touches and holds a card for a moment first, so swiping still
 * scrolls. While a card is carried, a line shows where it will land, the board scrolls when the
 * pointer nears an edge, and Escape puts it back.
 *
 * From the keyboard it follows the usual pattern for sortable lists: the arrow keys move between
 * cards (one tab stop for all of them), Space picks the focused card up, the arrow keys then move
 * it (up and down in its column, left and right to the next column), Space drops it and Escape
 * puts it back. Every step is read out through a live region. "Move to" in a card's menu does the
 * same in one go. Nothing animates, so there is nothing to turn off for reduced motion; the drop
 * is marked by an outline for a moment instead.
 */
export function KanbanBoard({
  columns,
  defaultColumns = [],
  cards,
  onMove,
  onOpen,
  filter,
  cardMenu,
  columnMenu,
  onAddCard,
  today,
  doneColumn = DONE_COLUMN,
  people = PEOPLE,
  labels = LABELS,
  defaultDrag,
  label = "Board",
  className,
}: KanbanBoardProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultColumns);
  const cols = columns ?? own;
  const shown = (cardId: string) => cards[cardId] != null && (!filter || filter(cards[cardId]));

  const [drag, setDrag] = useState<BoardDrag | null>(() => {
    if (!defaultDrag) return null;
    const from = spotOf(cols, defaultDrag.cardId, shown);
    return { cardId: defaultDrag.cardId, from, to: defaultDrag.to ?? from, mode: defaultDrag.mode };
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [landed, setLanded] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: "", n: 0 });
  const [addRequest, setAddRequest] = useState({ columnId: "", n: 0 });
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  const scroller = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const faces = useRef(new Map<string, HTMLDivElement>());
  const lists = useRef(new Map<string, HTMLOListElement>());
  const session = useRef<Session | null>(null);
  const swallowClick = useRef(false);
  const refocus = useRef<string | null>(null);
  const landedTimer = useRef(0);

  // In a keyboard move the card really moves as the keys are pressed; it is committed on drop.
  const view = drag?.mode === "keyboard" ? moveCard(cols, drag.cardId, drag.to.columnId, fullIndex(cols, drag.cardId, drag.to, shown)) : cols;
  const shownIds = view.map((c) => c.cardIds.filter(shown));
  const all = shownIds.flat();
  const tabStop = activeId && all.includes(activeId) ? activeId : all[0];

  /** Shown cards of a column, leaving out the one being moved */
  const others = (columnId: string, cardId: string) => cols.find((c) => c.id === columnId)?.cardIds.filter((x) => x !== cardId && shown(x)) ?? [];

  // What the pointer handlers (added to window) need from the latest render
  const live = useRef({ cols, shown, others, drag });
  useLayoutEffect(() => {
    live.current = { cols, shown, others, drag };
  });

  const say = (text: string) => setMessage((m) => ({ text, n: m.n + 1 }));
  const titleOf = (cardId: string) => `“${cards[cardId]?.title ?? cardId}”`;
  const where = (spot: BoardSpot, cardId: string, adding = true) => {
    const col = cols.find((c) => c.id === spot.columnId);
    const n = others(spot.columnId, cardId).length + (adding ? 1 : 0);
    return `${col?.title ?? ""}, position ${spot.index + 1} of ${n}`;
  };
  const overNote = (spot: BoardSpot, cardId: string) => {
    const col = cols.find((c) => c.id === spot.columnId);
    if (!col || col.limit == null) return "";
    const total = col.cardIds.filter((x) => x !== cardId).length + 1;
    return total > col.limit ? ` That puts ${col.title} over its limit of ${col.limit}.` : "";
  };

  /** Puts a card at an index of a column's whole list. Returns false when that is where it already was. */
  const commit = (cardId: string, columnId: string, index: number) => {
    const c = live.current.cols;
    const from = columnOf(c, cardId);
    if (!from || (from.id === columnId && from.cardIds.indexOf(cardId) === index)) return false;
    if (!columns) setOwn((o) => moveCard(o, cardId, columnId, index));
    onMove?.({ cardId, from: from.id, to: columnId, index });
    setLanded(cardId);
    clearTimeout(landedTimer.current);
    landedTimer.current = window.setTimeout(() => setLanded(null), 1200);
    return true;
  };
  const commitSpot = (cardId: string, spot: BoardSpot) => commit(cardId, spot.columnId, fullIndex(live.current.cols, cardId, spot, live.current.shown));

  // After a keyboard move the card may sit in another column, as a new element: keep focus on it.
  useLayoutEffect(() => {
    const cardId = refocus.current;
    if (!cardId) return;
    refocus.current = null;
    const el = faces.current.get(cardId);
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });

  // The copy under the pointer follows it; in a story (no pointer) it sits by the drop line.
  useLayoutEffect(() => {
    const o = overlay.current;
    if (!o || drag?.mode !== "pointer") return;
    const s = session.current;
    if (s?.started) {
      o.style.width = `${s.width}px`;
      o.style.transform = `translate(${s.x - s.dx}px, ${s.y - s.dy}px)`;
      return;
    }
    const source = faces.current.get(drag.cardId)?.getBoundingClientRect();
    const list = lists.current.get(drag.to.columnId)?.getBoundingClientRect();
    if (!source || !list) return;
    const next = others(drag.to.columnId, drag.cardId)[drag.to.index];
    const at = next ? faces.current.get(next)?.getBoundingClientRect().top : list.bottom;
    o.style.width = `${source.width}px`;
    o.style.transform = `translate(${list.left + 20}px, ${(at ?? list.top) - 24}px)`;
  });

  // Touch drags must be able to stop the page scrolling, which takes a touchmove listener that
  // isn't passive and is in place before the touch starts.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (session.current?.started) e.preventDefault();
    };
    window.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.removeEventListener("touchmove", block);
      session.current?.stop();
      clearTimeout(landedTimer.current);
    };
  }, []);

  // Pointer dragging --------------------------------------------------------------------------

  /** Where the pointer would drop the card: the column under it (or nearest), and the gap between cards it is over */
  const spotAt = (s: Session): BoardSpot | null => {
    let best: string | null = null;
    let dist = Infinity;
    for (const [colId, el] of lists.current) {
      const r = el.getBoundingClientRect();
      const d = s.x < r.left ? r.left - s.x : s.x > r.right ? s.x - r.right : 0;
      if (d < dist) {
        dist = d;
        best = colId;
      }
    }
    if (!best) return null;
    let index = 0;
    for (const other of live.current.others(best, s.cardId)) {
      const r = faces.current.get(other)?.getBoundingClientRect();
      if (r && s.y > r.top + r.height / 2) index++;
      else break;
    }
    return { columnId: best, index };
  };

  const retarget = (s: Session) => {
    const spot = spotAt(s);
    if (!spot || (s.to && sameSpot(s.to, spot))) return;
    s.to = spot;
    setDrag((d) => (d ? { ...d, to: spot } : d));
  };

  /** Scrolls the board sideways, and the column under the pointer up or down, near their edges */
  const tick = (s: Session) => {
    const speed = (d: number) => Math.min(18, Math.ceil(d / 3));
    const E = 48;
    let moved = false;
    const b = scroller.current;
    if (b) {
      const r = b.getBoundingClientRect();
      const dx = s.x < r.left + E ? -speed(r.left + E - s.x) : s.x > r.right - E ? speed(s.x - (r.right - E)) : 0;
      if (dx && b.scrollWidth > b.clientWidth) {
        b.scrollLeft += dx;
        moved = true;
      }
    }
    const list = s.to ? lists.current.get(s.to.columnId) : null;
    if (list) {
      const r = list.getBoundingClientRect();
      const dy = s.y < r.top + E && s.y > r.top - E ? -speed(r.top + E - s.y) : s.y > r.bottom - E && s.y < r.bottom + E ? speed(s.y - (r.bottom - E)) : 0;
      if (dy && list.scrollHeight > list.clientHeight) {
        list.scrollTop += dy;
        moved = true;
      }
    }
    if (moved) retarget(s);
    s.raf = requestAnimationFrame(() => tick(s));
  };

  const begin = (s: Session) => {
    const el = faces.current.get(s.cardId);
    if (!el) return s.stop();
    const r = el.getBoundingClientRect();
    s.started = true;
    s.dx = s.startX - r.left;
    s.dy = s.startY - r.top;
    s.width = r.width;
    const from = spotOf(live.current.cols, s.cardId, live.current.shown);
    s.to = from;
    document.documentElement.style.setProperty("cursor", "grabbing");
    setDrag({ cardId: s.cardId, from, to: from, mode: "pointer" });
    say(`Picked up ${titleOf(s.cardId)}. A line shows where it will go. Escape puts it back.`);
    s.raf = requestAnimationFrame(() => tick(s));
  };

  const finish = (s: Session, drop: boolean) => {
    s.stop();
    if (!s.started) return;
    swallowClick.current = true;
    window.setTimeout(() => (swallowClick.current = false), 0);
    const d = live.current.drag;
    setDrag(null);
    if (!d) return;
    if (drop && s.to && commitSpot(s.cardId, s.to)) say(`Dropped ${titleOf(s.cardId)} in ${where(s.to, s.cardId)}.`);
    else say(`${titleOf(s.cardId)} is back where it was.`);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, cardId: string) => {
    if (e.button !== 0 || session.current || live.current.drag || e.ctrlKey || e.metaKey) return;
    const s: Session = {
      cardId,
      pointerId: e.pointerId,
      type: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      dy: 0,
      width: 0,
      started: false,
      to: null,
      timer: 0,
      raf: 0,
      stop: () => {},
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== s.pointerId) return;
      s.x = ev.clientX;
      s.y = ev.clientY;
      if (!s.started) {
        const far = Math.hypot(s.x - s.startX, s.y - s.startY);
        if (s.type === "mouse" ? far > 4 : far > 10) {
          if (s.type === "mouse") begin(s);
          else s.stop(); // a swipe before the hold: the page scrolls
        }
        return;
      }
      ev.preventDefault();
      if (overlay.current) overlay.current.style.transform = `translate(${s.x - s.dx}px, ${s.y - s.dy}px)`;
      retarget(s);
    };
    const up = (ev: PointerEvent) => ev.pointerId === s.pointerId && finish(s, true);
    const cancel = (ev: PointerEvent) => ev.pointerId === s.pointerId && finish(s, false);
    const key = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && s.started) {
        ev.preventDefault();
        ev.stopPropagation();
        finish(s, false);
      }
    };
    // A long press also asks for the context menu (and on Android selects text); not while dragging.
    const context = (ev: Event) => {
      if (s.started || s.type !== "mouse") {
        ev.preventDefault();
        ev.stopPropagation();
      }
    };
    s.stop = () => {
      clearTimeout(s.timer);
      cancelAnimationFrame(s.raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("contextmenu", context, true);
      document.documentElement.style.removeProperty("cursor");
      if (session.current === s) session.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key, true);
    window.addEventListener("contextmenu", context, true);
    if (s.type !== "mouse") s.timer = window.setTimeout(() => begin(s), 300);
    session.current = s;
  };

  // Keyboard ----------------------------------------------------------------------------------

  const focusCard = (cardId: string | undefined) => {
    if (cardId) faces.current.get(cardId)?.focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>, cardId: string) => {
    if (e.target !== e.currentTarget) return;
    const k = e.key;
    if (drag?.mode === "keyboard" && drag.cardId === cardId) {
      e.preventDefault();
      if (k === "Escape") {
        e.stopPropagation();
        setDrag(null);
        refocus.current = cardId;
        say(`Move cancelled. ${titleOf(cardId)} is back in ${where(drag.from, cardId)}.`);
      } else if (k === " " || k === "Enter") {
        setDrag(null);
        refocus.current = cardId;
        if (commitSpot(cardId, drag.to)) say(`Dropped ${titleOf(cardId)} in ${where(drag.to, cardId)}.`);
        else say(`${titleOf(cardId)} is back where it was.`);
      } else if (k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight") {
        const ci = cols.findIndex((c) => c.id === drag.to.columnId);
        let to = drag.to;
        if (k === "ArrowUp") to = { ...to, index: Math.max(0, to.index - 1) };
        if (k === "ArrowDown") to = { ...to, index: Math.min(others(to.columnId, cardId).length, to.index + 1) };
        if (k === "ArrowLeft" || k === "ArrowRight") {
          const next = cols[ci + (k === "ArrowLeft" ? -1 : 1)];
          if (next) to = { columnId: next.id, index: Math.min(to.index, others(next.id, cardId).length) };
        }
        if (sameSpot(to, drag.to)) {
          const edge = k === "ArrowUp" ? "at the top of" : k === "ArrowDown" ? "at the bottom of" : k === "ArrowLeft" ? "in the first column," : "in the last column,";
          say(`Already ${edge} ${cols[ci]?.title}.`);
          return;
        }
        setDrag({ ...drag, to });
        refocus.current = cardId;
        say(`${where(to, cardId)}.${to.columnId !== drag.to.columnId ? overNote(to, cardId) : ""}`);
      }
      // Tab and everything else do nothing while a card is picked up
      return;
    }
    if (drag) return;
    if (k === " ") {
      e.preventDefault();
      const from = spotOf(cols, cardId, shown);
      setDrag({ cardId, from, to: from, mode: "keyboard" });
      say(`Picked up ${titleOf(cardId)}. ${where(from, cardId)}. The arrow keys move it, Space drops it, Escape puts it back.`);
      return;
    }
    const ci = shownIds.findIndex((ids) => ids.includes(cardId));
    const ids = shownIds[ci] ?? [];
    const i = ids.indexOf(cardId);
    let target: string | undefined;
    if (k === "ArrowUp") target = ids[i - 1];
    else if (k === "ArrowDown") target = ids[i + 1];
    else if (k === "Home") target = ids[0];
    else if (k === "End") target = ids.at(-1);
    else if (k === "ArrowLeft" || k === "ArrowRight") {
      const step = k === "ArrowLeft" ? -1 : 1;
      for (let c = ci + step; c >= 0 && c < shownIds.length && !target; c += step) target = shownIds[c][Math.min(i, shownIds[c].length - 1)];
    } else return;
    e.preventDefault();
    focusCard(target);
  };

  // Menus -------------------------------------------------------------------------------------

  const moveByMenu = (cardId: string, columnId: string, where: "top" | "bottom") => {
    const c = live.current.cols;
    const target = c.find((x) => x.id === columnId);
    if (!target) return;
    const index = where === "top" ? 0 : target.cardIds.filter((x) => x !== cardId).length;
    if (commit(cardId, columnId, index)) say(`Moved ${titleOf(cardId)} to the ${where} of ${target.title}.`);
    afterMenu(() => {
      const el = faces.current.get(cardId);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  };

  const menuForCard = (card: BoardCard, column: BoardColumn): MenuItem[] => [
    ...(onOpen ? [{ label: "Open card", icon: SquarePen, shortcut: "Enter", onSelect: () => onOpen(card.id) }] : []),
    {
      type: "submenu",
      label: "Move to",
      icon: Move,
      items: [
        ...cols.map((c) => ({
          label: c.title,
          hint: c.id === column.id ? "It is here" : undefined,
          disabled: c.id === column.id,
          onSelect: () => moveByMenu(card.id, c.id, "bottom"),
        })),
        { type: "separator" },
        { label: `Top of ${column.title}`, icon: ArrowUpToLine, disabled: column.cardIds[0] === card.id, onSelect: () => moveByMenu(card.id, column.id, "top") },
        { label: `Bottom of ${column.title}`, icon: ArrowDownToLine, disabled: column.cardIds.at(-1) === card.id, onSelect: () => moveByMenu(card.id, column.id, "bottom") },
      ],
    },
    ...(cardMenu?.(card, column) ?? []),
  ];

  const menuForColumn = (column: BoardColumn): MenuItem[] => [
    ...(onAddCard ? [{ label: "Add card", icon: Plus, onSelect: () => setAddRequest((r) => ({ columnId: column.id, n: r.n + 1 })) }] : []),
    ...(columnMenu?.(column) ?? []),
  ];

  const withMenus = cardMenu != null || columnMenu != null || onAddCard != null;
  const dragged = drag ? cards[drag.cardId] : undefined;

  return (
    <div data-slot="kanban-board" className={cn("relative flex min-h-0 flex-col", className)}>
      <p id={`${id}-help`} hidden>
        Enter opens the card. Space picks it up; then the arrow keys move it and Space drops it, or Escape puts it back. On a touch screen, touch and hold a card to drag it.
      </p>
      <div
        ref={scroller}
        role="region"
        aria-label={label}
        onClickCapture={(e) => {
          if (swallowClick.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className={cn("flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overscroll-x-contain p-3", !drag && "max-sm:snap-x max-sm:snap-mandatory")}
      >
        {view.map((column, ci) => {
          const ids = shownIds[ci];
          const done = column.id === doneColumn;
          // The pointer's drop line: before the card at the spot, or after the last one
          const line = drag?.mode === "pointer" && drag.to.columnId === column.id && !sameSpot(drag.to, drag.from) ? drag.to.index : -1;
          const rest = drag ? ids.filter((x) => x !== drag.cardId) : ids;
          const before = line >= 0 ? rest[line] : undefined;
          const after = line >= 0 && line === rest.length ? rest.at(-1) : undefined;
          const body = (
            <KanbanColumn
              column={column}
              shown={filter ? ids.length : undefined}
              menu={withMenus ? menuForColumn(column) : undefined}
              onAddCard={onAddCard ? (title) => onAddCard(column.id, title) : undefined}
              addRequest={addRequest.columnId === column.id ? addRequest.n : 0}
              dropHere={line === 0 && rest.length === 0}
              emptyDescription={filter && column.cardIds.length ? "None match the filters." : "Drag a card here, or add one."}
              listRef={(el) => {
                if (el) lists.current.set(column.id, el);
                return () => {
                  if (lists.current.get(column.id) === el) lists.current.delete(column.id);
                };
              }}
              className="max-sm:w-[calc(100vw-3.5rem)]"
            >
              {ids.map((cardId) => {
                const card = cards[cardId];
                const stop = cardId === tabStop ? 0 : -1;
                return (
                  <li
                    key={cardId}
                    data-card-id={cardId}
                    className={cn(
                      "relative",
                      (cardId === before || cardId === after) && "before:absolute before:inset-x-0 before:z-10 before:h-0.5 before:bg-primary",
                      cardId === before && "before:-top-[5px]",
                      cardId === after && "before:-bottom-[5px]",
                    )}
                  >
                    <KanbanCard
                      ref={(el) => {
                        if (el) faces.current.set(cardId, el);
                        return () => {
                          if (faces.current.get(cardId) === el) faces.current.delete(cardId);
                        };
                      }}
                      data-card-face={cardId}
                      card={card}
                      today={today}
                      done={done}
                      people={people}
                      labels={labels}
                      dragState={drag?.cardId === cardId ? (drag.mode === "keyboard" ? "lifted" : "ghost") : undefined}
                      landed={landed === cardId}
                      onOpen={onOpen ? () => onOpen(cardId) : undefined}
                      menu={cardMenu ? menuForCard(card, column) : undefined}
                      tabIndex={stop}
                      menuTabIndex={stop}
                      aria-describedby={`${id}-help`}
                      onFocus={() => cardId !== activeId && setActiveId(cardId)}
                      onKeyDown={(e) => onKeyDown(e, cardId)}
                      onPointerDown={(e) => onPointerDown(e, cardId)}
                      className={cn(!drag && "active:cursor-grabbing")}
                    />
                  </li>
                );
              })}
            </KanbanColumn>
          );
          return withMenus ? (
            <ContextMenu
              key={column.id}
              disabled={drag != null}
              label={`${column.title}: actions`}
              items={(target) => {
                const cardId = target.closest<HTMLElement>("[data-card-id]")?.dataset.cardId;
                return cardId && cards[cardId] ? menuForCard(cards[cardId], column) : menuForColumn(column);
              }}
              className="flex max-h-full min-h-0 shrink-0 snap-start"
            >
              {body}
            </ContextMenu>
          ) : (
            <div key={column.id} className="flex max-h-full min-h-0 shrink-0 snap-start">
              {body}
            </div>
          );
        })}
      </div>
      <p aria-live="assertive" className="sr-only">
        {message.text}
        {message.n % 2 ? " " : ""}
      </p>
      {mounted &&
        drag?.mode === "pointer" &&
        dragged &&
        createPortal(
          <div ref={overlay} aria-hidden className="pointer-events-none fixed top-0 left-0 z-50 w-72">
            <KanbanCard card={dragged} today={today} done={columnOf(cols, dragged.id)?.id === doneColumn} people={people} labels={labels} dragState="overlay" />
          </div>,
          document.body,
        )}
    </div>
  );
}
