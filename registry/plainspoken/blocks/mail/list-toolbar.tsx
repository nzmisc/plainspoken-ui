"use client";

import type { ISODate } from "@/registry/plainspoken/lib/dates";
import type { MailThread, MailView } from "@/registry/plainspoken/blocks/mail/data";
import { MailActions, type MailAction } from "@/registry/plainspoken/blocks/mail/actions";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { cn } from "@/lib/utils";

export interface MailListToolbarProps {
  /** Every conversation in the list */
  threads: MailThread[];
  /** The ticked ones */
  selected?: ReadonlySet<string>;
  view: MailView;
  today: ISODate;
  now: string;
  onAction?: (action: MailAction) => void;
  className?: string;
}

/**
 * The strip over a message list: a select-all box, and either how many conversations there are or,
 * once some are ticked, how many and what can be done to them (archive, delete, mark read, snooze,
 * move, label, spam), as icon buttons so the strip fits a narrow list. The box shows the
 * part-ticked state when only some are.
 */
export function MailListToolbar({ threads, selected = new Set(), view, today, now, onAction = () => {}, className }: MailListToolbarProps) {
  const picked = threads.filter((t) => selected.has(t.id));
  const all = picked.length > 0 && picked.length === threads.length;
  const unread = threads.filter((t) => t.unread).length;
  return (
    <div
      data-slot="mail-list-toolbar"
      className={cn("ctl-sm flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted py-0.5 pr-2 pl-2.5", className)}
    >
      <Checkbox
        label={picked.length ? <b>{picked.length} selected</b> : <span className="sr-only">Select all</span>}
        defaultChecked={all}
        indeterminate={picked.length > 0 && !all}
        disabled={!threads.length}
      />
      {picked.length > 0 ? (
        <MailActions threads={picked} view={view} onAction={onAction} today={today} now={now} compact />
      ) : (
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {threads.length === 1 ? "1 conversation" : `${threads.length} conversations`}
          {unread > 0 && `, ${unread} unread`}
        </span>
      )}
    </div>
  );
}
