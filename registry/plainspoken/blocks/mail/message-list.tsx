"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Clock, Inbox, Paperclip, Star } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { isPlainClick } from "@/registry/plainspoken/lib/nav";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { LABELS, type MailThread, type MailView } from "@/registry/plainspoken/blocks/mail/data";
import { aheadTime, hasAttachments, latest, listTime, participants, snippet } from "@/registry/plainspoken/blocks/mail/format";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { ContextMenu, type MenuItem } from "@/registry/plainspoken/ui/context-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";

export interface MailMessageListProps {
  /** The conversations to show, in order */
  threads: MailThread[];
  /** The folder or view, for what the rows say (Sent shows recipients, Snoozed when they come back) */
  view: MailView;
  today: ISODate;
  /** The conversation open in the reading pane: drawn as the current row */
  openId?: string | null;
  /** Rows ticked at first */
  selected?: ReadonlySet<string>;
  /** A plain click on a row. Without it rows are links that the browser follows. */
  onOpen?: (id: string) => void;
  /** The link each row is: what a click with a modifier key, or a new tab, opens */
  hrefFor?: (id: string) => string;
  /** Right-click (or Shift+F10) menu for a row */
  menuFor?: (thread: MailThread) => MenuItem[];
  /** Shown when there are no rows */
  empty?: ReactNode;
  /** Accessible name of the list. Default "Conversations". */
  label?: string;
  className?: string;
}

const FILLED_STAR = <Icon icon={Star} fill="currentColor" className="text-warning" />;

/**
 * The list of conversations in a mail client: who, subject, the start of the latest message, when,
 * and marks for unread (bold, and "Unread" for screen readers), stars, attachments and labels.
 * Each row has a checkbox and a star toggle; Drafts say so in red, Sent lists recipients, Snoozed
 * shows when each comes back.
 *
 * Keyboard: the list is one Tab stop, on the row the keyboard was last on (a roving tabindex);
 * ↑/↓ move between rows, Home and End jump, Enter opens. Right-click or Shift+F10 on a row opens
 * its menu.
 */
export function MailMessageList({
  threads,
  view,
  today,
  openId,
  selected,
  onOpen,
  hrefFor = (id) => `#${id}`,
  menuFor,
  empty,
  label = "Conversations",
  className,
}: MailMessageListProps) {
  const list = useRef<HTMLUListElement>(null);
  const [own, setCursor] = useState<string | null>(null);
  const cursor = (own && threads.some((t) => t.id === own) ? own : null) ?? openId ?? threads[0]?.id ?? null;

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) || e.altKey || e.metaKey || e.ctrlKey) return;
    const i = threads.findIndex((t) => t.id === cursor);
    const n = e.key === "Home" ? 0 : e.key === "End" ? threads.length - 1 : Math.max(0, Math.min(threads.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
    const next = threads[n];
    if (!next) return;
    e.preventDefault();
    setCursor(next.id);
    list.current?.querySelector<HTMLElement>(`[data-thread-id="${CSS.escape(next.id)}"] a`)?.focus();
  };

  if (!threads.length) return <div className={className}>{empty ?? <EmptyState icon={Inbox} title="Nothing here" description="No conversations in this folder." />}</div>;

  const body = (
    <ul ref={list} aria-label={label} onKeyDown={onKeyDown} className="flex flex-col">
      {threads.map((t) => {
        const m = latest(t);
        const isOpen = t.id === openId;
        const tab = t.id === cursor ? 0 : -1;
        const when = t.folder === "snoozed" && t.snoozedUntil ? aheadTime(t.snoozedUntil, today).replace(/, \d\d:\d\d$/, "") : listTime(m.date, today);
        const labels = LABELS.filter((l) => t.labels.includes(l.id) && `label:${l.id}` !== view);
        return (
          <li
            key={t.id}
            data-thread-id={t.id}
            onFocus={() => setCursor(t.id)}
            className={cn(
              "relative flex items-start gap-1 border-b border-border py-1.5 pr-3 pl-2",
              isOpen ? "bg-accent before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-foreground" : "hover:bg-muted has-[input:checked]:bg-secondary",
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                tabIndex={tab}
                defaultChecked={selected?.has(t.id)}
                aria-label={`Select “${t.subject || "(no subject)"}”`}
                className={cn("m-0 size-3.5 cursor-pointer accent-primary", FOCUS_RING)}
              />
            </span>
            <Toggle
              variant="ghost"
              size="xs"
              tabIndex={tab}
              icon={Star}
              iconPressed={FILLED_STAR}
              label="Star"
              defaultPressed={t.starred}
              className="text-muted-foreground aria-pressed:border-transparent aria-pressed:bg-transparent"
            />
            <a
              href={hrefFor(t.id)}
              tabIndex={tab}
              aria-current={isOpen || undefined}
              onClick={(e) => {
                if (!onOpen || !isPlainClick(e)) return;
                e.preventDefault();
                onOpen(t.id);
              }}
              className={cn("min-w-0 flex-1 pl-1 text-foreground no-underline visited:text-foreground", FOCUS_RING, "focus-visible:outline-offset-0")}
            >
              <span className="flex items-baseline gap-2">
                <span className={cn("min-w-0 flex-1 truncate", t.unread && "font-bold")}>
                  {t.unread && <span className="sr-only">Unread, </span>}
                  {t.folder === "drafts" && <span className="text-destructive">Draft </span>}
                  {participants(t)}
                  {t.messages.length > 1 && <span className="font-normal text-muted-foreground"> {t.messages.length}</span>}
                </span>
                <span className={cn("shrink-0 text-[12px] tabular-nums", t.unread ? "font-bold text-foreground" : "text-muted-foreground")}>
                  {t.folder === "snoozed" && <Icon icon={Clock} className="mr-0.5" label="Snoozed until" />}
                  {when}
                </span>
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className={cn("min-w-0 flex-1 truncate", t.unread && "font-semibold")}>{t.subject || "(no subject)"}</span>
                {hasAttachments(t) && <Icon icon={Paperclip} label="Has attachments" className="shrink-0 text-muted-foreground" />}
              </span>
              <span className="block truncate text-[13px] leading-5 text-muted-foreground">{snippet(m)}</span>
              {labels.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-1">
                  {labels.map((l) => (
                    <Badge key={l.id} icon={false} className="gap-1 bg-background">
                      <Swatch color={l.color} />
                      {l.label}
                    </Badge>
                  ))}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div data-slot="mail-message-list" className={className}>
      {menuFor ? (
        <ContextMenu
          label="Conversation actions"
          items={(target) => {
            const id = target.closest<HTMLElement>("[data-thread-id]")?.dataset.threadId;
            const t = threads.find((x) => x.id === id);
            return t ? menuFor(t) : [];
          }}
        >
          {body}
        </ContextMenu>
      ) : (
        body
      )}
    </div>
  );
}
