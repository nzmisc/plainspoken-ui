"use client";

import type { ReactNode, Ref } from "react";
import { Copy, Ellipsis, Trash } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { ME, NOTEBOOK_NOW, STATUSES, type NotebookPage, type PageStatus } from "@/registry/plainspoken/blocks/milkdown/data";
import { lengthLine, personName, statusLabel, statusVariant, trail } from "@/registry/plainspoken/blocks/milkdown/format";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { cn } from "@/lib/utils";

export interface NotebookPageHeaderProps {
  page: NotebookPage;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: PageStatus) => void;
  /** Words in the page, for the length and reading time */
  words: number;
  onDuplicate?: () => void;
  onDelete?: () => void;
  /** Enter in the title: move on to the text */
  onTitleEnter?: () => void;
  titleRef?: Ref<HTMLInputElement>;
  /** The demo's clock, for "edited … ago" on the pages as they came. Edits since count from the real one. */
  now?: string;
  /** Before the ⋯ menu: an "On this page" menu where the outline rail doesn't fit */
  actions?: ReactNode;
  /** Classes for the column the header's content sits in: line it up with the text under it */
  columnClassName?: string;
  className?: string;
}

/**
 * The top of a notebook page: where it sits, its title (an input drawn as a heading, with the page's
 * real h1 for screen readers), and a line with its status, its authors, when it was last edited and
 * by whom ("by you" for your own edits), and its length and reading time. The ⋯ menu sets the
 * status and duplicates or deletes the page.
 */
export function NotebookPageHeader({
  page,
  onTitleChange,
  onStatusChange,
  words,
  onDuplicate,
  onDelete,
  onTitleEnter,
  titleRef,
  now = NOTEBOOK_NOW,
  actions,
  columnClassName,
  className,
}: NotebookPageHeaderProps) {
  const edited = new Date(page.editedAt) > new Date(now) ? undefined : now;
  return (
    <header data-slot="notebook-page-header" className={cn("border-b border-border", className)}>
      <div className={cn("flex flex-col gap-1.5 px-3 pt-3 pb-2.5", columnClassName)}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted-foreground">{trail(page)}</p>
            <h1 className="sr-only">{page.title || "Untitled"}</h1>
            <input
              ref={titleRef}
              aria-label="Title"
              value={page.title}
              placeholder="Untitled"
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing || !onTitleEnter) return;
                e.preventDefault();
                onTitleEnter();
              }}
              className={cn(
                "-mx-1 w-[calc(100%+0.5rem)] border border-transparent bg-transparent px-1 text-[24px] leading-tight font-bold text-foreground placeholder:text-muted-foreground hover:border-input",
                FOCUS_RING,
              )}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 pt-4">
            {actions}
            <DropdownMenu
              label="Page actions"
              trigger={Ellipsis}
              triggerVariant="ghost"
              align="end"
              items={[
                { type: "radio", label: "Status", value: page.status, onValueChange: (v) => onStatusChange(v as PageStatus), options: STATUSES },
                { type: "separator" },
                { label: "Duplicate", icon: Copy, onSelect: onDuplicate, disabled: !onDuplicate },
                { label: "Delete page", icon: Trash, destructive: true, onSelect: onDelete, disabled: !onDelete },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <Badge variant={statusVariant(page.status)}>{statusLabel(page.status)}</Badge>
          {page.authors.length > 0 && (
            <AvatarGroup label="Authors" size={20} shape="circle" max={4}>
              {page.authors.map((a) => (
                <Avatar key={a} name={personName(a)} />
              ))}
            </AvatarGroup>
          )}
          <span>
            Edited <RelativeTime date={page.editedAt} format="long" locale="en" now={edited} /> by {page.editedBy === ME ? "you" : personName(page.editedBy)}
          </span>
          <span className="tabular-nums">{lengthLine(words)}</span>
        </div>
      </div>
    </header>
  );
}
