import { ChevronLeft, ChevronRight, Diff, RotateCcw } from "@/registry/plainspoken/lib/icons";
import type { ChatArtifactVersion } from "@/registry/plainspoken/blocks/chat/data";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";

export interface ChatVersionFooterProps {
  versions: ChatArtifactVersion[];
  /** The version shown, from 0 */
  index: number;
  onIndexChange: (index: number) => void;
  /** Make the version shown the latest again; offered on older versions */
  onRestore?: (index: number) => void;
  /** Showing what changed from the version before, rather than the version itself */
  diff?: boolean;
  onDiffChange?: (diff: boolean) => void;
  /** No restoring while the model is writing a new version */
  busy?: boolean;
  className?: string;
}

/** "14:05", the same on the server and in the browser for the same time zone */
const timeOf = (t: number) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * The bar under a document: which version is shown and who made it ("Version 2 of 3, by the model:
 * a shorter opening"), with ‹ and › to step through them, Changes to see what that version changed
 * (words added underlined, removed struck through), and, on an older version, Restore, which makes
 * it the latest again as a new version, so nothing is lost.
 */
export function ChatVersionFooter({ versions, index, onIndexChange, onRestore, diff = false, onDiffChange, busy = false, className }: ChatVersionFooterProps) {
  const v = versions[index];
  if (!v) return null;
  const latest = index === versions.length - 1;
  return (
    <div data-slot="chat-version-footer" className={cn("ctl-sm flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border bg-muted px-2 py-1.5 text-[13px]", className)}>
      <span className="inline-flex items-center">
        <IconButton variant="ghost" icon={ChevronLeft} label="Older version" disabled={index === 0} onClick={() => onIndexChange(index - 1)} />
        <IconButton variant="ghost" icon={ChevronRight} label="Newer version" disabled={latest} onClick={() => onIndexChange(index + 1)} />
      </span>
      {/* Two steady lines: which version and when, then who made it and why (cut short if it must be) */}
      <p className="min-w-[12rem] flex-1 leading-tight" aria-live="polite">
        <span className="font-semibold">
          Version {index + 1} of {versions.length}
        </span>
        <span className="whitespace-nowrap text-muted-foreground">
          {" · "}
          <time dateTime={new Date(v.createdAt).toISOString()} suppressHydrationWarning>
            {timeOf(v.createdAt)}
          </time>
        </span>
        <span className="block truncate text-[12px] text-muted-foreground" title={v.note}>
          {v.by === "you" ? "Your edit" : "By the model"}
          {v.note ? `: ${v.note}` : ""}
        </span>
      </p>
      <span className="flex items-center gap-2">
        {onDiffChange && index > 0 && (
          <Toggle icon={Diff} pressed={diff} onPressedChange={onDiffChange} title="Show what this version changed from the one before">
            Changes
          </Toggle>
        )}
        {!latest && onRestore && (
          <Button icon={RotateCcw} disabled={busy} onClick={() => onRestore(index)}>
            Restore
          </Button>
        )}
        {!latest && (
          <Button variant="ghost" onClick={() => onIndexChange(versions.length - 1)}>
            Latest
          </Button>
        )}
      </span>
    </div>
  );
}
