import { ChevronLeft, ChevronRight } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { cn } from "@/lib/utils";

export interface ChatBranchPickerProps {
  /** Which version is shown, from 0 */
  index: number;
  /** How many there are */
  count: number;
  /** Show another version: -1 the one before, +1 the one after */
  onChange: (step: -1 | 1) => void;
  /** What the versions are of, for screen readers: "answer", "question" */
  of?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * ‹ 2/3 › under a message that has other versions: answers that were regenerated, questions that
 * were edited and sent again, answers from a comparison. The arrows step through them and the
 * conversation below follows the version shown. Nothing is drawn when there is only one.
 */
export function ChatBranchPicker({ index, count, onChange, of = "message", disabled = false, className }: ChatBranchPickerProps) {
  if (count < 2) return null;
  return (
    <span data-slot="chat-branch-picker" role="group" aria-label={`Versions of this ${of}`} className={cn("inline-flex items-center", className)}>
      <IconButton variant="ghost" icon={ChevronLeft} label={`Previous version of this ${of}`} disabled={disabled || index === 0} onClick={() => onChange(-1)} />
      <span className="min-w-8 text-center text-[12px] text-muted-foreground tabular-nums" aria-live="polite">
        <span className="sr-only">Version </span>
        {index + 1}
        <span aria-hidden>/</span>
        <span className="sr-only"> of </span>
        {count}
      </span>
      <IconButton variant="ghost" icon={ChevronRight} label={`Next version of this ${of}`} disabled={disabled || index === count - 1} onClick={() => onChange(1)} />
    </span>
  );
}
