import { ChevronRight } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { formatSeconds } from "@/registry/plainspoken/blocks/chat/format";
import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { cn } from "@/lib/utils";

export interface ChatReasoningProps {
  /** What the model wrote while thinking (Markdown) */
  text: string;
  /** Still thinking: the summary says so, with a spinner */
  streaming?: boolean;
  /** How long it thought, for "Thought for 4 s" */
  durationMs?: number;
  /** Start open */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * The model's reasoning before its answer, folded away in a native <details>: "Thinking…" with a
 * spinner while it comes in, "Thought for 4 s" after. Open, it shows the text in a smaller, muted
 * column with a rule on its left, so it reads as an aside and not as the answer.
 */
export function ChatReasoning({ text, streaming = false, durationMs, defaultOpen = false, className }: ChatReasoningProps) {
  const summary = streaming ? "Thinking…" : durationMs != null ? `Thought for ${formatSeconds(durationMs)}` : "Reasoning";
  return (
    <details data-slot="chat-reasoning" open={defaultOpen || undefined} className={cn("group/reasoning text-[13px]", className)}>
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-1 text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden",
          FOCUS_RING,
        )}
      >
        {streaming ? (
          <Spinner label={null} />
        ) : (
          <Icon icon={ChevronRight} size={14} className="transition-transform group-open/reasoning:rotate-90 motion-reduce:transition-none" />
        )}
        {summary}
      </summary>
      <div className="mt-1.5 border-l-2 border-border pl-3 text-muted-foreground">
        <ChatMarkdown size="sm" streaming={streaming}>
          {text}
        </ChatMarkdown>
      </div>
    </details>
  );
}
