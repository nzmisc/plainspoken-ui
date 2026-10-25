"use client";

import { useState, type ReactNode } from "react";
import { Info, Pencil, RefreshCw } from "@/registry/plainspoken/lib/icons";
import type { ChatMessage } from "@/registry/plainspoken/blocks/chat/data";
import { messageReasoning, messageText } from "@/registry/plainspoken/blocks/chat/format";
import { chatModelName } from "@/registry/plainspoken/blocks/chat/models";
import { ChatComposer } from "@/registry/plainspoken/blocks/chat/composer";
import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";
import { ChatReasoning } from "@/registry/plainspoken/blocks/chat/reasoning";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { cn } from "@/lib/utils";

export interface ChatMessageViewProps {
  message: ChatMessage;
  /** This answer is still coming in: no actions yet, and unfinished Markdown is closed for drawing */
  streaming?: boolean;
  /** Offers "Regenerate" on an answer (give it to the last one, when nothing is streaming) */
  onRegenerate?: () => void;
  /** Offers "Edit" on a question: called with the new text, to send it again in its place */
  onEdit?: (text: string) => void;
  /** Said in the edit box, e.g. that the answers after it will be replaced */
  editNote?: string;
  /** Start editing (for stories) */
  defaultEditing?: boolean;
  /** Start with the reasoning open (for stories) */
  defaultReasoningOpen?: boolean;
  className?: string;
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <Icon icon={Info} size={14} />
      {children}
    </p>
  );
}

/**
 * One message of a conversation. A question sits on the right in a gray box, as typed (line
 * breaks kept, no Markdown); an answer runs the full width under the name of the model that wrote
 * it, as Markdown, with the reasoning folded above it when the model shared it. Under each: Copy,
 * and Regenerate on an answer or Edit on a question when those are offered. Editing turns the
 * question into a composer in place; Escape cancels. Each message is an <article> with a heading
 * (hidden for questions), so screen readers can jump from message to message.
 */
export function ChatMessageView({
  message,
  streaming = false,
  onRegenerate,
  onEdit,
  editNote,
  defaultEditing = false,
  defaultReasoningOpen = false,
  className,
}: ChatMessageViewProps) {
  const [editing, setEditing] = useState(defaultEditing);
  const text = messageText(message);
  const meta = message.metadata;

  if (message.role === "user") {
    return (
      <article data-slot="chat-message" data-role="user" className={cn("flex flex-col items-end gap-1", className)}>
        <h2 className="sr-only">You said</h2>
        {editing && onEdit ? (
          <div className="flex w-full flex-col gap-1">
            <ChatComposer
              defaultValue={text}
              label="Edit your message"
              sendLabel="Send again"
              autoFocus
              onCancel={() => setEditing(false)}
              onSend={(t) => {
                setEditing(false);
                onEdit(t);
              }}
              hint={editNote ?? null}
              tools={
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              }
              className="w-full"
            />
          </div>
        ) : (
          <>
            <div className="max-w-[85%] border border-border bg-muted px-3 py-1.5 break-words whitespace-pre-wrap">{text}</div>
            <div className="ctl-xs flex items-center gap-0.5">
              {meta?.edited && <span className="mr-1 text-[12px] text-muted-foreground">Edited</span>}
              <CopyButton text={text} name="message" />
              {onEdit && <IconButton variant="ghost" icon={Pencil} label="Edit message" onClick={() => setEditing(true)} />}
            </div>
          </>
        )}
      </article>
    );
  }

  const reasoningPart = message.parts.find((p) => p.type === "reasoning");
  const reasoning = messageReasoning(message);
  const thinking = streaming && reasoningPart?.state === "streaming";
  const model = chatModelName(meta?.model);
  const refused = meta?.finishReason === "content-filter";
  return (
    <article data-slot="chat-message" data-role="assistant" aria-busy={streaming || undefined} className={cn("flex flex-col gap-1.5", className)}>
      <h2 className="text-[12px] font-semibold text-muted-foreground">{model}</h2>
      {reasoning && <ChatReasoning text={reasoning} streaming={thinking} durationMs={meta?.reasoningMs} defaultOpen={defaultReasoningOpen} />}
      {text ? (
        <ChatMarkdown streaming={streaming}>{text}</ChatMarkdown>
      ) : streaming && !thinking ? (
        <Spinner className="text-[13px] text-muted-foreground">Writing…</Spinner>
      ) : null}
      {!streaming && meta?.stopped && <Note>Stopped before the end.</Note>}
      {!streaming && meta?.finishReason === "length" && (
        <Note>
          {text ? "Cut off at the length limit. Ask it to go on." : "It ran out of tokens while thinking, before it answered. Ask again, or turn Thinking off."}
        </Note>
      )}
      {!streaming && refused && <Note>{text ? "The model stopped here, by its content rules." : "The model declined to answer, by its content rules."}</Note>}
      {!streaming && (text || onRegenerate) && (
        <div className="ctl-xs flex gap-0.5">
          {text && <CopyButton text={text} name="answer" />}
          {onRegenerate && <IconButton variant="ghost" icon={RefreshCw} label="Regenerate answer" onClick={onRegenerate} />}
        </div>
      )}
    </article>
  );
}
