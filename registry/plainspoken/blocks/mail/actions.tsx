"use client";

import {
  Archive,
  ArchiveRestore,
  Clock,
  FolderInput,
  Inbox,
  Mail,
  MailOpen,
  OctagonAlert,
  Tag,
  Trash,
  type Glyph,
} from "@/registry/plainspoken/lib/icons";
import { addDays, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { FOLDERS, LABELS, type FolderId, type LabelId, type MailThread, type MailView } from "@/registry/plainspoken/blocks/mail/data";
import { aheadTime, splitWhen } from "@/registry/plainspoken/blocks/mail/format";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Everything that can be done to one or more conversations */
export type MailAction =
  | { type: "archive" }
  | { type: "delete" }
  | { type: "deleteForever" }
  | { type: "read"; read: boolean }
  | { type: "star"; starred: boolean }
  | { type: "move"; folder: FolderId }
  | { type: "label"; label: LabelId; on: boolean }
  | { type: "snooze"; until: string }
  | { type: "unsnooze" }
  | { type: "spam"; spam: boolean };

/** Where a snooze can send a conversation, from the demo's "now" */
export function snoozeChoices(now: string): { label: string; until: string }[] {
  const { date, time } = splitWhen(now);
  const hour = Number(time.slice(0, 2));
  const out: { label: string; until: string }[] = [];
  if (hour < 17) out.push({ label: "Later today", until: `${date}T18:00` });
  out.push({ label: "Tomorrow", until: `${addDays(date, 1)}T08:00` });
  // The coming Saturday, unless that's today or tomorrow
  const toSat = (6 - weekday(date) + 7) % 7;
  if (toSat > 1) out.push({ label: "This weekend", until: `${addDays(date, toSat)}T09:00` });
  const toMon = (1 - weekday(date) + 7) % 7 || 7;
  out.push({ label: "Next week", until: `${addDays(date, toMon)}T08:00` });
  out.push({ label: "In a month", until: `${addDays(date, 28)}T08:00` });
  return out;
}

/** The menu items for a set of conversations: shared by the toolbar menus and the right-click menu */
export function mailMenuItems(threads: MailThread[], view: MailView, now: string, today: ISODate, act: (a: MailAction) => void) {
  const folder = view.startsWith("label:") || view === "starred" ? null : (view as FolderId);
  const allHave = (l: LabelId) => threads.length > 0 && threads.every((t) => t.labels.includes(l));
  const snooze: MenuItem[] = [
    { type: "label", label: "Snooze until…" },
    ...snoozeChoices(now).map((c) => ({ label: c.label, hint: aheadTime(c.until, today), onSelect: () => act({ type: "snooze", until: c.until }) })),
    ...(threads.some((t) => t.folder === "snoozed") ? [{ type: "separator" } as const, { label: "Unsnooze", onSelect: () => act({ type: "unsnooze" }) }] : []),
  ];
  const move: MenuItem[] = FOLDERS.filter((f) => ["inbox", "archive", "spam", "trash"].includes(f.id) && f.id !== folder).map((f) => ({
    label: f.label,
    onSelect: () => act({ type: "move", folder: f.id }),
  }));
  const labels: MenuItem[] = LABELS.map((l) => ({
    type: "checkbox",
    label: l.label,
    checked: allHave(l.id),
    onCheckedChange: (on: boolean) => act({ type: "label", label: l.id, on }),
  }));
  return { snooze, move, labels };
}

const allRead = (threads: MailThread[]) => threads.every((t) => !t.unread);

export interface MailActionsProps {
  /** The conversations the buttons act on: the selection, or the one that is open */
  threads: MailThread[];
  /** The folder or view they are shown in: decides Archive or Move to Inbox, Delete or Delete forever */
  view: MailView;
  /** Called with what was chosen. The buttons and menus work without it; nothing is done to the mail. */
  onAction?: (action: MailAction) => void;
  /** The demo's clock, for the snooze times */
  now: string;
  today: ISODate;
  /** Icons only (each still named, and titled on hover), for a narrow toolbar */
  compact?: boolean;
  className?: string;
}

/**
 * The toolbar of things to do to conversations: archive, delete, mark read or unread, snooze,
 * move, label and report spam. The buttons change with the folder (in Archive the first is "Move to
 * Inbox", in Trash "Delete forever", in Spam "Not spam"). Labels are checkboxes in their menu, so
 * several can be set without it closing; a label only some of the conversations have is shown
 * unticked, and ticking it gives it to all of them.
 */
export function MailActions({ threads, view, onAction = () => {}, now, today, compact = false, className }: MailActionsProps) {
  const folder = view.startsWith("label:") || view === "starred" ? null : (view as FolderId);
  const none = threads.length === 0;
  const menus = mailMenuItems(threads, view, now, today, onAction);
  const read = allRead(threads);

  const action = (icon: Glyph, label: string, a: MailAction, extra?: string) =>
    compact ? (
      <IconButton variant="ghost" icon={icon} label={label} disabled={none} onClick={() => onAction(a)} className={extra} />
    ) : (
      <Button variant="ghost" icon={icon} disabled={none} onClick={() => onAction(a)} className={extra}>
        {label}
      </Button>
    );

  return (
    <div data-slot="mail-actions" role="group" aria-label="Conversation actions" className={cn("flex min-w-0 flex-wrap items-center gap-0.5", className)}>
      {folder === "archive" || folder === "trash" || folder === "spam" || folder === "snoozed"
        ? action(folder === "snoozed" ? Inbox : ArchiveRestore, folder === "spam" ? "Not spam" : "Move to Inbox", folder === "spam" ? { type: "spam", spam: false } : { type: "move", folder: "inbox" })
        : action(Archive, "Archive", { type: "archive" })}
      {folder === "trash" ? action(Trash, "Delete forever", { type: "deleteForever" }, "text-destructive") : action(Trash, "Delete", { type: "delete" })}
      {action(read ? Mail : MailOpen, read ? "Mark as unread" : "Mark as read", { type: "read", read: !read })}
      <DropdownMenu
        trigger={compact ? Clock : "Snooze"}
        label={compact ? "Snooze" : undefined}
        chevron={!compact}
        triggerVariant="ghost"
        items={menus.snooze}
        className="min-w-56"
      />
      <DropdownMenu trigger={compact ? FolderInput : "Move"} label={compact ? "Move to" : undefined} chevron={!compact} triggerVariant="ghost" items={menus.move} />
      <DropdownMenu trigger={compact ? Tag : "Label"} label={compact ? "Labels" : undefined} chevron={!compact} triggerVariant="ghost" items={menus.labels} />
      {folder !== "spam" && folder !== "trash" && folder !== "sent" && folder !== "drafts" && action(OctagonAlert, "Report spam", { type: "spam", spam: true })}
    </div>
  );
}
