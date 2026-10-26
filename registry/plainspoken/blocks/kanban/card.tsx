"use client";

import { useId, type HTMLAttributes, type Ref } from "react";
import { Calendar, CircleAlert, Clock, Ellipsis, ListChecks, MessageSquare, Paperclip, SquareCheck } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { LABELS, PEOPLE, type BoardCard, type BoardLabel, type Person } from "@/registry/plainspoken/blocks/kanban/data";
import { checklistCount, dueState, labelById, names, personById, PRIORITIES } from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanPicture } from "@/registry/plainspoken/blocks/kanban/picture";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { cn } from "@/lib/utils";

/** How a card looks while it is being moved */
export type CardDragState = "lifted" | "ghost" | "overlay";

export interface KanbanCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  card: BoardCard;
  /** The demo's date, for overdue and due soon */
  today: ISODate;
  /** The card is in a column that means finished: its due date is no longer marked */
  done?: boolean;
  people?: Person[];
  labels?: BoardLabel[];
  /**
   * While it is being moved: "lifted" (picked up from the keyboard), "ghost" (the place it left
   * while the pointer carries it), "overlay" (the copy under the pointer)
   */
  dragState?: CardDragState;
  /** Just dropped: outlined for a moment, so the eye finds where it went */
  landed?: boolean;
  /** Opens the card. Makes the face a button: click, Enter or Space. */
  onOpen?: () => void;
  /** Items for its ⋯ menu; leave out for none */
  menu?: MenuItem[];
  /** Tab stop of the ⋯ button, to follow the face's in a roving tab order */
  menuTabIndex?: number;
  /** The face: the focusable part that drag and drop and the roving focus work with */
  ref?: Ref<HTMLDivElement>;
}

/**
 * One card on a board: an optional cover picture, its labels, the title, and a line of small
 * facts: the key, priority, due date (red and marked when overdue, amber when due within two
 * days), checklist progress, attachments, comments, and who it is assigned to as round avatars.
 * Every symbol has words for screen readers too. With `onOpen` the face is a button (its name is
 * the title, its description the facts); the ⋯ menu sits beside it, not inside, so the two are
 * separate controls. Props and handlers go to the face, so a board can make it draggable.
 */
export function KanbanCard({
  card,
  today,
  done = false,
  people = PEOPLE,
  labels = LABELS,
  dragState,
  landed = false,
  onOpen,
  menu,
  menuTabIndex,
  ref,
  className,
  onKeyDown,
  tabIndex,
  "aria-describedby": describedBy,
  ...rest
}: KanbanCardProps) {
  const id = useId();
  const cover = card.cover ? card.attachments.find((a) => a.id === card.cover) : undefined;
  const cardLabels = card.labels.map((l) => labelById(l, labels)).filter((l) => l != null);
  const who = card.assignees.map((p) => personById(p, people));
  const due = card.due ? dueState(card.due, today, done) : null;
  const check = checklistCount(card);
  const prio = PRIORITIES[card.priority];
  const top = cardLabels.length > 0;
  const interactive = onOpen != null && dragState !== "overlay";

  return (
    <div data-slot="kanban-card" className="group/card relative">
      <div
        ref={ref}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? (tabIndex ?? 0) : undefined}
        aria-labelledby={`${id}-title`}
        aria-describedby={[top ? `${id}-labels` : null, `${id}-facts`, describedBy].filter(Boolean).join(" ")}
        onClick={interactive ? onOpen : undefined}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (!interactive || e.defaultPrevented || e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "flex flex-col overflow-hidden border bg-background text-left select-none [-webkit-touch-callout:none]",
          interactive && "cursor-pointer",
          FOCUS_RING,
          dragState === "lifted"
            ? "border-primary bg-accent outline-2 outline-offset-1 outline-primary"
            : dragState === "ghost"
              ? "border-dashed border-input [&>*]:opacity-40"
              : dragState === "overlay"
                ? "cursor-grabbing border-input shadow-md"
                : landed
                  ? "border-primary"
                  : "border-border hover:border-input",
          className,
        )}
        {...rest}
      >
        {cover &&
          (cover.url ? (
            // A file picked in the browser: its own picture, through an object URL
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="" className="h-24 w-full border-b border-border object-cover" />
          ) : cover.picture ? (
            <KanbanPicture kind={cover.picture} className="h-24 w-full border-b border-border" />
          ) : null)}
        <div className="flex flex-col gap-1 p-2">
          {top && (
            <p id={`${id}-labels`} className="flex flex-wrap gap-x-2 gap-y-0.5 pr-6 text-[12px] leading-4">
              <span className="sr-only">Labels: </span>
              {cardLabels.map((l, i) => (
                <span key={l.id} className="inline-flex items-center gap-1">
                  <Swatch color={l.color} />
                  {l.label}
                  {i < cardLabels.length - 1 && <span className="sr-only">,</span>}
                </span>
              ))}
            </p>
          )}
          <p id={`${id}-title`} className={cn("text-[14px] leading-snug font-medium break-words", !top && "pr-6")}>
            {card.title}
          </p>
          <div id={`${id}-facts`} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] leading-5 text-muted-foreground">
            <span className="font-mono">{card.id}</span>
            <span title={`${prio.label} priority`} className={cn("inline-flex items-center", prio.className)}>
              <Icon icon={prio.icon} size={14} />
              <span className="sr-only">, {prio.label} priority</span>
            </span>
            {due && (
              <span
                title={due.long}
                className={cn(
                  "inline-flex items-center gap-1 tabular-nums",
                  due.kind === "overdue" && "font-medium text-destructive",
                  due.kind === "soon" && "font-medium text-warning",
                )}
              >
                <Icon icon={due.kind === "overdue" ? CircleAlert : due.kind === "soon" ? Clock : Calendar} size={13} />
                <span aria-hidden>{due.short}</span>
                <span className="sr-only">, {due.long}</span>
              </span>
            )}
            {check.total > 0 && (
              <span title={`Checklist: ${check.done} of ${check.total} done`} className={cn("inline-flex items-center gap-1 tabular-nums", check.done === check.total && "text-success")}>
                <Icon icon={check.done === check.total ? SquareCheck : ListChecks} size={13} />
                <span aria-hidden>
                  {check.done}/{check.total}
                </span>
                <span className="sr-only">
                  , checklist {check.done} of {check.total} done
                </span>
              </span>
            )}
            {card.attachments.length > 0 && (
              <span title={`${card.attachments.length} attachments`} className="inline-flex items-center gap-1 tabular-nums">
                <Icon icon={Paperclip} size={13} />
                <span aria-hidden>{card.attachments.length}</span>
                <span className="sr-only">, {card.attachments.length === 1 ? "1 attachment" : `${card.attachments.length} attachments`}</span>
              </span>
            )}
            {card.comments.length > 0 && (
              <span title={`${card.comments.length} comments`} className="inline-flex items-center gap-1 tabular-nums">
                <Icon icon={MessageSquare} size={13} />
                <span aria-hidden>{card.comments.length}</span>
                <span className="sr-only">, {card.comments.length === 1 ? "1 comment" : `${card.comments.length} comments`}</span>
              </span>
            )}
            {who.length > 0 && (
              <>
                <span className="sr-only">, assigned to {names(who)}</span>
                <AvatarGroup aria-hidden shape="circle" size={20} max={3} className="ml-auto">
                  {who.map((p) => (
                    <Avatar key={p.id} name={p.name} src={p.picture} />
                  ))}
                </AvatarGroup>
              </>
            )}
          </div>
        </div>
      </div>
      {menu && dragState !== "overlay" && (
        <DropdownMenu
          items={menu}
          align="end"
          size="sm"
          trigger={(props) => (
            <IconButton
              {...props}
              icon={Ellipsis}
              label={`Actions for ${card.id}`}
              variant="ghost"
              size="sm"
              tabIndex={menuTabIndex}
              className={cn(
                "absolute right-0.5 bg-background/90 text-muted-foreground hover:text-foreground",
                cover ? "top-[calc(6rem+3px)]" : "top-0.5",
                "opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100",
                dragState && "invisible",
              )}
            />
          )}
        />
      )}
    </div>
  );
}
