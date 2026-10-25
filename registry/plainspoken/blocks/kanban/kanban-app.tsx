"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Archive, ArrowDownWideNarrow, Columns2, Flag, Gauge, Keyboard, Link, LogOut, Settings, SquareKanban, Tag, UserMinus, UserPlus } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import {
  BOARD,
  CARDS,
  COLUMNS,
  DONE_COLUMN,
  KANBAN_NOW,
  KANBAN_TODAY,
  LABELS,
  ME,
  PEOPLE,
  type BoardCard,
  type BoardColumn,
  type LabelId,
  type Priority,
} from "@/registry/plainspoken/blocks/kanban/data";
import {
  columnOf,
  dayLong,
  EMPTY_FILTER,
  isFiltering,
  matchesFilter,
  moveCard,
  ms,
  nextCardId,
  personById,
  PRIORITIES,
  PRIORITY_ORDER,
  withActivity,
  type BoardFilter,
} from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanBoard, type BoardDrag, type BoardSpot } from "@/registry/plainspoken/blocks/kanban/board";
import { KanbanCardDetail } from "@/registry/plainspoken/blocks/kanban/card-detail";
import { afterMenu } from "@/registry/plainspoken/blocks/kanban/column";
import { KanbanToolbar } from "@/registry/plainspoken/blocks/kanban/toolbar";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Navbar } from "@/registry/plainspoken/ui/navbar";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { toast } from "@/registry/plainspoken/ui/toast";
import { cn } from "@/lib/utils";

const SHORTCUTS: [keys: string[], what: string][] = [
  [["/"], "Search the cards"],
  [["↑", "↓", "←", "→"], "Move between cards"],
  [["Enter"], "Open the card"],
  [["Space"], "Pick the card up, or drop it"],
  [["↑", "↓", "←", "→"], "While picked up: move it"],
  [["Esc"], "Put it back where it was"],
  [["Shift", "F10"], "The card's menu"],
];

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export interface KanbanAppProps {
  /** The board to start with. Default: the demo's, the Saltmarsh Ferries app team's. */
  columns?: BoardColumn[];
  cards?: BoardCard[];
  /** The card open at first, or null; leave out openCardId to let the app keep it */
  defaultOpenCardId?: string | null;
  /** The open card, controlled: for linking to a card from the address bar */
  openCardId?: string | null;
  onOpenCardChange?: (cardId: string | null) => void;
  defaultFilter?: BoardFilter;
  /** Start with a card mid-move (for stories) */
  defaultDrag?: { cardId: string; to?: BoardSpot; mode: BoardDrag["mode"] };
  /** An address for a card, for Copy link; leave out for no Copy link */
  cardLink?: (cardId: string) => string;
  /** More controls in the top bar, before the account menu: a theme switch */
  actions?: ReactNode;
  /** The demo's date and clock */
  today?: ISODate;
  now?: string;
  /** The frame: full window height by default */
  className?: string;
}

/**
 * Corkboard, the whole task board: a bar with the app's name, keyboard help and your account; the
 * board's name and team, and its members as round avatars, the five most recently active and a
 * "+N" that lists all forty (choosing anyone shows only their cards); the search and filters; then
 * the columns. Cards
 * move by drag and drop, from the keyboard, or with Move to; a click opens one in the card dialog
 * (a drawer on phones), where every field, checkbox, file and comment can be changed. Columns have
 * menus to add cards, sort, set a work-in-progress limit, move or archive everything in them.
 *
 * It is a working picture: all of it happens in the page's own state, with the demo's fixed date,
 * and nothing is saved. Archiving shows a toast with Undo (mount a Toaster to see it).
 */
export function KanbanApp({
  columns: startColumns = COLUMNS,
  cards: startCards = CARDS,
  defaultOpenCardId = null,
  openCardId,
  onOpenCardChange,
  defaultFilter = EMPTY_FILTER,
  defaultDrag,
  cardLink,
  actions,
  today = KANBAN_TODAY,
  now = KANBAN_NOW,
  className,
}: KanbanAppProps) {
  const me = ME;
  const [columns, setColumns] = useState(startColumns);
  const [cards, setCards] = useState(() => Object.fromEntries(startCards.map((c) => [c.id, c])) as Record<string, BoardCard>);
  const [filter, setFilter] = useState(defaultFilter);
  const [ownOpen, setOwnOpen] = useState(defaultOpenCardId);
  const [said, setSaid] = useState("");
  const openId = openCardId !== undefined ? openCardId : ownOpen;
  const open = openId ? (cards[openId] ?? null) : null;
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  // The header shows whoever was on the board last; the Assignee filter lists only people with cards
  const members = [...PEOPLE].sort((a, b) => b.seen.localeCompare(a.seen));
  const assigned = new Set(Object.values(cards).flatMap((c) => c.assignees));
  const assignable = PEOPLE.filter((p) => assigned.has(p.id));
  const total = columns.reduce((n, c) => n + c.cardIds.length, 0);
  const shown = columns.reduce((n, c) => n + c.cardIds.filter((id) => cards[id] && matchesFilter(cards[id], filter, me)).length, 0);
  const filtering = isFiltering(filter);

  const setOpen = (cardId: string | null) => {
    setOwnOpen(cardId);
    onOpenCardChange?.(cardId);
  };
  const focusFace = (cardId: string) =>
    afterMenu(() => {
      const el = root.current?.querySelector<HTMLElement>(`[data-card-face="${cardId}"]`);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  const patch = (cardId: string, f: (c: BoardCard) => BoardCard) => setCards((all) => (all[cardId] ? { ...all, [cardId]: f(all[cardId]) } : all));
  const title = (id: string) => columns.find((c) => c.id === id)?.title ?? id;

  // "/" anywhere on the board (outside a text box) goes to the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true], dialog[open]")) return;
      e.preventDefault();
      search.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const archive = (ids: string[]) => {
    const where = ids.map((id) => {
      const col = columnOf(columns, id)!;
      return { id, col: col.id, index: col.cardIds.indexOf(id) };
    });
    setColumns((cs) => cs.map((c) => ({ ...c, cardIds: c.cardIds.filter((x) => !ids.includes(x)) })));
    if (openId && ids.includes(openId)) setOpen(null);
    toast({
      title: ids.length === 1 ? "Card archived" : `${ids.length} cards archived`,
      description: ids.length === 1 ? `${ids[0]}, ${cards[ids[0]]?.title}` : `From ${title(where[0].col)}`,
      action: {
        label: "Undo",
        onClick: () =>
          setColumns((cs) =>
            cs.map((c) => {
              const back = where.filter((w) => w.col === c.id).sort((a, b) => a.index - b.index);
              if (!back.length) return c;
              const ids2 = [...c.cardIds];
              for (const w of back) ids2.splice(Math.min(w.index, ids2.length), 0, w.id);
              return { ...c, cardIds: ids2 };
            }),
          ),
      },
    });
  };

  const copyLink = (cardId: string) => {
    if (!cardLink) return;
    navigator.clipboard?.writeText(cardLink(cardId)).then(
      () => toast({ title: "Link copied", description: cardLink(cardId), variant: "success" }),
      () => toast({ title: "Couldn't copy the link", description: cardLink(cardId), variant: "destructive" }),
    );
  };

  const cardMenu = (card: BoardCard): MenuItem[] => {
    const mine = card.assignees.includes(me);
    return [
      mine
        ? { label: "Take me off", icon: UserMinus, onSelect: () => patch(card.id, (c) => withActivity({ ...c, assignees: c.assignees.filter((p) => p !== me) }, me, now, { type: "unassigned", person: me })) }
        : { label: "Assign me", icon: UserPlus, onSelect: () => patch(card.id, (c) => withActivity({ ...c, assignees: [...c.assignees, me] }, me, now, { type: "assigned", person: me })) },
      {
        type: "submenu",
        label: "Labels",
        icon: Tag,
        items: LABELS.map((l) => ({
          type: "checkbox" as const,
          label: l.label,
          checked: card.labels.includes(l.id),
          onCheckedChange: (on: boolean) =>
            patch(card.id, (c) =>
              withActivity({ ...c, labels: on ? [...c.labels, l.id] : c.labels.filter((x) => x !== l.id) }, me, now, { type: on ? "labelled" : "unlabelled", label: l.id as LabelId }),
            ),
        })),
      },
      {
        type: "submenu",
        label: "Priority",
        icon: Flag,
        items: [
          {
            type: "radio",
            value: card.priority,
            onValueChange: (v) => patch(card.id, (c) => withActivity({ ...c, priority: v as Priority }, me, now, { type: "priority", priority: v as Priority })),
            options: PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITIES[p].label })),
          },
        ],
      },
      { type: "separator" },
      ...(cardLink ? [{ label: "Copy link", icon: Link, onSelect: () => copyLink(card.id) }] : []),
      { label: "Archive card", icon: Archive, onSelect: () => archive([card.id]) },
    ];
  };

  const columnMenu = (column: BoardColumn): MenuItem[] => {
    const empty = column.cardIds.length === 0;
    const sortBy = (key: "priority" | "due") =>
      setColumns((cs) =>
        cs.map((c) =>
          c.id !== column.id
            ? c
            : {
                ...c,
                cardIds: [...c.cardIds].sort((a, b) =>
                  key === "priority"
                    ? PRIORITY_RANK[cards[a].priority] - PRIORITY_RANK[cards[b].priority]
                    : (cards[a].due ?? "9999").localeCompare(cards[b].due ?? "9999"),
                ),
              },
        ),
      );
    return [
      {
        type: "submenu",
        label: "Sort",
        icon: ArrowDownWideNarrow,
        disabled: column.cardIds.length < 2,
        items: [
          { label: "By priority", hint: "Urgent first", onSelect: () => sortBy("priority") },
          { label: "By due date", hint: "Soonest first, then no date", onSelect: () => sortBy("due") },
        ],
      },
      {
        type: "submenu",
        label: "Work-in-progress limit",
        icon: Gauge,
        items: [
          {
            type: "radio",
            label: `${column.title} holds at most`,
            value: String(column.limit ?? "none"),
            onValueChange: (v) => setColumns((cs) => cs.map((c) => (c.id === column.id ? { ...c, limit: v === "none" ? null : Number(v) } : c))),
            options: [{ value: "none", label: "No limit" }, ...[2, 3, 4, 5, 6, 8].map((n) => ({ value: String(n), label: `${n} cards` }))],
          },
        ],
      },
      {
        type: "submenu",
        label: "Move all cards to",
        icon: Columns2,
        disabled: empty,
        items: columns
          .filter((c) => c.id !== column.id)
          .map((to) => ({
            label: to.title,
            onSelect: () => {
              const ids = column.cardIds;
              setColumns((cs) => cs.map((c) => (c.id === column.id ? { ...c, cardIds: [] } : c.id === to.id ? { ...c, cardIds: [...c.cardIds, ...ids] } : c)));
              setCards((all) => {
                const next = { ...all };
                for (const id of ids) next[id] = withActivity(next[id], me, now, { type: "moved", from: column.title, to: to.title });
                return next;
              });
              setSaid(`${ids.length} cards moved from ${column.title} to ${to.title}.`);
            },
          })),
      },
      { type: "separator" },
      { label: "Archive all cards", icon: Archive, disabled: empty, onSelect: () => archive(column.cardIds) },
    ];
  };

  return (
    <div ref={root} data-slot="kanban-app" className={cn("flex h-dvh flex-col overflow-hidden bg-background text-foreground", className)}>
      <Navbar
        phone="hide"
        brand={
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={SquareKanban} />
            Corkboard
          </span>
        }
        actions={
          <>
            <Popover trigger={Keyboard} label="Keyboard shortcuts" title="Keyboard" triggerVariant="ghost" triggerClassName="max-sm:hidden" align="end" className="w-80">
              <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5 text-[13px]">
                {SHORTCUTS.map(([keys, what], i) => (
                  <div key={i} className="contents">
                    <dt className="flex gap-0.5 whitespace-nowrap">
                      {keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </dt>
                    <dd>{what}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[12px] text-muted-foreground">On a touch screen, touch and hold a card to drag it.</p>
            </Popover>
            {actions}
            <DropdownMenu
              align="end"
              label={`Account: ${personById(me).name}`}
              items={[
                { type: "label", label: `${personById(me).name}, ${personById(me).role}` },
                { label: "My cards", icon: SquareKanban, onSelect: () => setFilter({ ...EMPTY_FILTER, mine: true }) },
                { label: "Settings", icon: Settings },
                { type: "separator" },
                { label: "Sign out", icon: LogOut },
              ]}
              trigger={(props) => (
                <button {...props} aria-label={`Account: ${personById(me).name}`} className={cn("flex cursor-pointer", FOCUS_RING)}>
                  <Avatar name={personById(me).name} src={personById(me).picture} shape="circle" size={28} />
                </button>
              )}
            />
          </>
        }
      />
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-3 pt-2 pb-1.5">
        <div className="min-w-0">
          <h1 className="text-[16px] leading-tight font-bold">{BOARD.name}</h1>
          <p className="text-[13px] text-muted-foreground">
            {BOARD.team}
            <span className="max-sm:hidden">. Release on {dayLong(BOARD.release)}.</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground max-sm:sr-only">Members</span>
          <AvatarGroup
            shape="circle"
            size={24}
            max={5}
            label={`Board members, most recently active first`}
            overflow="list"
            listTitle={`Board members: ${members.length}`}
            onPersonSelect={(i) => setFilter((f) => ({ ...f, involved: members[i].id }))}
            personLabel={(name) => `Show the cards ${name} is on`}
          >
            {members.map((p) => (
              <Avatar
                key={p.id}
                name={p.name}
                src={p.picture}
                detail={
                  <>
                    {p.role}, active <RelativeTime date={ms(p.seen)} now={ms(now)} format="long" locale="en-GB" />
                  </>
                }
              />
            ))}
          </AvatarGroup>
        </div>
      </header>
      <KanbanToolbar
        people={assignable}
        filter={filter}
        onFilterChange={setFilter}
        me={me}
        shown={shown}
        total={total}
        searchRef={search}
        className="border-b border-border px-3 py-1.5"
      />
      <KanbanBoard
        columns={columns}
        cards={cards}
        today={today}
        doneColumn={DONE_COLUMN}
        defaultDrag={defaultDrag}
        label={`${BOARD.name}: board`}
        filter={filtering ? (c) => matchesFilter(c, filter, me) : undefined}
        onOpen={setOpen}
        onMove={(m) => {
          setColumns((cs) => moveCard(cs, m.cardId, m.to, m.index));
          if (m.from !== m.to) patch(m.cardId, (c) => withActivity(c, me, now, { type: "moved", from: title(m.from), to: title(m.to) }));
        }}
        onAddCard={(columnId, t) => {
          const id = nextCardId(cards);
          setCards((all) => ({
            ...all,
            [id]: {
              id,
              title: t,
              description: "",
              labels: [],
              assignees: [],
              due: null,
              priority: "medium",
              checklist: [],
              attachments: [],
              comments: [],
              cover: null,
              watchers: [],
              createdBy: me,
              createdAt: now,
              activity: [{ id: `${id}-created`, by: me, at: now, event: { type: "created" } }],
            },
          }));
          setColumns((cs) => cs.map((c) => (c.id === columnId ? { ...c, cardIds: [...c.cardIds, id] } : c)));
          setSaid(`Added ${id}, ${t}, at the bottom of ${title(columnId)}.`);
        }}
        cardMenu={cardMenu}
        columnMenu={columnMenu}
        className="flex-1"
      />
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
      <KanbanCardDetail
        card={open}
        columns={columns}
        today={today}
        now={now}
        me={me}
        link={open && cardLink ? cardLink(open.id) : undefined}
        onClose={() => {
          const id = openId;
          setOpen(null);
          if (id) focusFace(id);
        }}
        onChange={(c) => setCards((all) => ({ ...all, [c.id]: c }))}
        onMove={(to) => {
          if (!open) return;
          setColumns((cs) => moveCard(cs, open.id, to, cs.find((c) => c.id === to)?.cardIds.filter((x) => x !== open.id).length ?? 0));
        }}
        onArchive={open ? () => archive([open.id]) : undefined}
      />
    </div>
  );
}
