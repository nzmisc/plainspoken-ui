"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { Ellipsis, Inbox, Plus, TriangleAlert, X } from "@/registry/plainspoken/lib/icons";
import type { BoardColumn } from "@/registry/plainspoken/blocks/kanban/data";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

/** Waits out a menu closing, which puts focus back on its button, before moving focus elsewhere */
export const afterMenu = (fn: () => void) => {
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(fn);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
};

export interface KanbanColumnProps {
  column: BoardColumn;
  /** How many of its cards a filter lets through, when it hides some: the count reads "3 of 7" */
  shown?: number;
  /** Items of the ⋯ menu in the header; leave out for none */
  menu?: MenuItem[];
  /** Adds a card with this title at the bottom. Leave out for no "Add a card" button. */
  onAddCard?: (title: string) => void;
  /** Start with the new-card box open (for stories) */
  defaultAdding?: boolean;
  /** Change it (a counter) to open the new-card box from outside, e.g. from the column menu */
  addRequest?: number;
  /** A card is being dragged over this column while it has none: the empty box is outlined */
  dropHere?: boolean;
  /** The cards, as <li> elements */
  children?: ReactNode;
  /** The list of cards, for drag and drop to measure and scroll */
  listRef?: Ref<HTMLOListElement>;
  /** What the empty column says. Default "No cards". */
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * One column of a board: its name, how many cards it holds, its work-in-progress limit when it is
 * over it (an amber badge with a symbol, and a line saying so, never colour alone), a ⋯ menu, the
 * cards in a list that scrolls on its own, and "Add a card" at the foot, which opens a box in place:
 * Enter adds the card and keeps the box open for the next, Shift+Enter starts a new line, Escape
 * closes it. An empty column says so in a dashed box, which is where a dragged card can go.
 */
export function KanbanColumn({
  column,
  shown,
  menu,
  onAddCard,
  defaultAdding = false,
  addRequest = 0,
  dropHere = false,
  children,
  listRef,
  emptyTitle = "No cards",
  emptyDescription,
  className,
}: KanbanColumnProps) {
  const id = useId();
  const total = column.cardIds.length;
  const over = column.limit != null && total > column.limit;
  const filtered = shown != null && shown !== total;
  const empty = (shown ?? total) === 0;
  const [adding, setAdding] = useState(defaultAdding);
  const [title, setTitle] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  // Asked from outside (the column menu): open the box, and take focus once the menu has let go of it.
  const [seenRequest, setSeenRequest] = useState(addRequest);
  if (addRequest !== seenRequest) {
    setSeenRequest(addRequest);
    setAdding(true);
  }
  useEffect(() => {
    if (addRequest) return afterMenu(() => box.current?.focus());
  }, [addRequest]);

  const close = () => {
    setAdding(false);
    setTitle("");
    afterMenu(() => addButton.current?.focus());
  };
  const submit = () => {
    const t = title.trim().replace(/\s+/g, " ");
    if (!t) return close();
    onAddCard?.(t);
    setTitle("");
    box.current?.focus();
  };

  return (
    <section
      data-slot="kanban-column"
      data-column-id={column.id}
      aria-labelledby={`${id}-heading`}
      className={cn("flex max-h-full min-h-0 w-72 shrink-0 flex-col border border-border bg-muted", over && "border-t-2 border-t-warning", className)}
    >
      <header className="flex flex-col gap-0.5 px-2 pt-1.5 pb-1">
        <div className="ctl-sm flex min-h-6 items-center gap-1.5">
          <h2 id={`${id}-heading`} className="flex min-w-0 items-baseline gap-1.5 text-[13px] font-bold">
            <span className="truncate">{column.title}</span>
            <span className="font-normal text-muted-foreground tabular-nums">
              <span aria-hidden>{filtered ? `${shown} of ${total}` : total}</span>
              <span className="sr-only">
                , {filtered ? `${shown} of ${total} cards shown` : total === 1 ? "1 card" : `${total} cards`}
                {column.limit != null && (over ? `, over the limit of ${column.limit}` : `, limit ${column.limit}`)}
              </span>
            </span>
          </h2>
          {column.limit != null &&
            (over ? (
              <Badge variant="warning" aria-hidden title={`Over the work-in-progress limit of ${column.limit}`} className="tabular-nums">
                {total} / {column.limit}
              </Badge>
            ) : (
              <span aria-hidden title={`Work-in-progress limit: ${column.limit}`} className="text-[12px] text-muted-foreground tabular-nums">
                max {column.limit}
              </span>
            ))}
          {menu && (
            <span className="ml-auto">
              <DropdownMenu items={menu} trigger={Ellipsis} triggerVariant="ghost" label={`${column.title}: column actions`} align="end" />
            </span>
          )}
        </div>
        {over && (
          <p className="text-[12px] leading-snug text-warning">
            <Icon icon={TriangleAlert} className="mr-1" />
            {total - column.limit!} over the limit. Finish something before starting more.
          </p>
        )}
      </header>

      <ol ref={listRef} aria-labelledby={`${id}-heading`} className={cn("flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain px-2 pt-1 pb-2", !empty && "flex-1")}>
        {children}
      </ol>
      {empty && (
        <EmptyState
          compact
          bordered
          icon={Inbox}
          title={emptyTitle}
          description={emptyDescription}
          className={cn("mx-2 mb-2 bg-background", dropHere && "border-solid border-primary bg-accent")}
        />
      )}

      {onAddCard && (
        <div className="ctl-sm border-t border-border px-2 py-1.5">
          {adding ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex flex-col gap-1.5"
            >
              <Textarea
                ref={box}
                rows={2}
                autoFocus={!defaultAdding}
                value={title}
                aria-label={`Title of the new card in ${column.title}`}
                placeholder="What needs doing?"
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    close();
                  }
                }}
                className="resize-none"
              />
              <div className="flex items-center gap-1">
                <Button type="submit" variant="primary">
                  Add card
                </Button>
                <IconButton variant="ghost" icon={X} label="Cancel" onClick={close} />
              </div>
            </form>
          ) : (
            <Button ref={addButton} variant="ghost" icon={Plus} block onClick={() => setAdding(true)} className="justify-start text-muted-foreground hover:text-foreground">
              Add a card
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
