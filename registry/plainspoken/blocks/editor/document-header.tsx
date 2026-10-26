"use client";

import { Copy, Ellipsis, EyeOff, Files, Send, Trash } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { DocStatus } from "@/registry/plainspoken/blocks/editor/data";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { cn } from "@/lib/utils";

export interface EditorDocumentHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  status: DocStatus;
  onStatusChange: (status: DocStatus) => void;
  /** The handbook part the page is in, shown above the title */
  section: string;
  words: number;
  /** Saving now, or when it was last saved and by whom. `now` fixes the clock (for the demo's first render). */
  save: { saving: true } | { saving?: false; at: string; by: string; now?: string };
  onCopyMarkdown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * The top of a handbook page: where it sits, its title (an input drawn as a heading), Publish or
 * Unpublish, a menu of other actions, and a line with the status, the word count and reading time,
 * and when it was last saved and by whom ("Saving…" while it saves).
 */
export function EditorDocumentHeader({
  title,
  onTitleChange,
  status,
  onStatusChange,
  section,
  words,
  save,
  onCopyMarkdown,
  onDuplicate,
  onDelete,
  className,
}: EditorDocumentHeaderProps) {
  const published = status === "published";
  return (
    <header data-slot="editor-document-header" className={cn("flex flex-col gap-1 border-b border-border px-4 pt-2.5 pb-2", className)}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-48 flex-1">
          <p className="text-[13px] text-muted-foreground">Handbook / {section}</p>
          <h1 className="sr-only">{title || "Untitled"}</h1>
          <input
            aria-label="Title"
            value={title}
            placeholder="Untitled"
            onChange={(e) => onTitleChange(e.target.value)}
            className={cn(
              "-mx-1 w-[calc(100%+0.5rem)] border border-transparent bg-transparent px-1 text-[22px] leading-tight font-bold placeholder:text-muted-foreground hover:border-input",
              FOCUS_RING,
            )}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 pt-4">
          {published ? (
            <Button icon={EyeOff} onClick={() => onStatusChange("draft")}>
              Unpublish
            </Button>
          ) : (
            <Button variant="primary" icon={Send} onClick={() => onStatusChange("published")}>
              Publish
            </Button>
          )}
          <DropdownMenu
            label="More actions"
            trigger={Ellipsis}
            triggerVariant="ghost"
            align="end"
            items={[
              { label: "Copy as Markdown", icon: Copy, onSelect: onCopyMarkdown },
              { label: "Duplicate", icon: Files, onSelect: onDuplicate },
              { type: "separator" },
              { label: "Delete page", icon: Trash, destructive: true, onSelect: onDelete },
            ]}
          />
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground">
        <Badge variant={published ? "success" : "default"}>{published ? "Published" : "Draft"}</Badge>
        <span className="tabular-nums">
          {words.toLocaleString("en")} {words === 1 ? "word" : "words"}, {Math.max(1, Math.round(words / 200))} min read
        </span>
        <span>
          {save.saving ? (
            "Saving…"
          ) : (
            <>
              Saved <RelativeTime date={save.at} format="long" locale="en" now={save.now} /> by {save.by}
            </>
          )}
        </span>
      </p>
    </header>
  );
}
