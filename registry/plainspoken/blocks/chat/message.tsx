"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Coins, Info, Pencil, RefreshCw, Square, ThumbsDown, ThumbsUp, Volume2 } from "@/registry/plainspoken/lib/icons";
import type { ChatArtifact, ChatMessage, ChatPart, ChatWeather } from "@/registry/plainspoken/blocks/chat/data";
import { formatCost, formatUsage, isToolPart, messageFiles, messageReasoning, messageText, speakable, toolName } from "@/registry/plainspoken/blocks/chat/format";
import { chatModelName } from "@/registry/plainspoken/blocks/chat/models";
import { isDocumentTool, type DocumentToolOutput } from "@/registry/plainspoken/blocks/chat/artifacts";
import type { ChatAttachment } from "@/registry/plainspoken/blocks/chat/attachments";
import { ChatFileList } from "@/registry/plainspoken/blocks/chat/attachment-chips";
import { ChatArtifactCard } from "@/registry/plainspoken/blocks/chat/artifact-card";
import { ChatBranchPicker } from "@/registry/plainspoken/blocks/chat/branch-picker";
import { ChatComposer } from "@/registry/plainspoken/blocks/chat/composer";
import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";
import { ChatReasoning } from "@/registry/plainspoken/blocks/chat/reasoning";
import { ChatToolCard, toolIcon, toolTitle } from "@/registry/plainspoken/blocks/chat/tool-card";
import { ChatWeatherCard } from "@/registry/plainspoken/blocks/chat/weather-card";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";

/** The versions of a message (after edits and regenerated answers): which one this is, of how many */
export interface ChatMessageBranch {
  index: number;
  count: number;
  onChange: (step: -1 | 1) => void;
}

/** A document card was clicked: open the document (or, while it is written, the call's draft) */
export type ChatOpenArtifact = (target: { id?: string; callId: string; version?: number }) => void;

export interface ChatMessageViewProps {
  message: ChatMessage;
  /** This answer is still coming in: no actions yet, and unfinished Markdown is closed for drawing */
  streaming?: boolean;
  /** Offers "Regenerate" on an answer */
  onRegenerate?: () => void;
  /** Offers "Edit" on a question: called with the new text and the files kept, to send it again in its place */
  onEdit?: (text: string, attachments: ChatAttachment[]) => void;
  /** Said in the edit box, e.g. that the answers after it will be replaced */
  editNote?: string;
  /** The other versions of this message, for ‹ 1/2 › */
  branch?: ChatMessageBranch;
  /** Offers thumbs up and down on an answer; called with the new verdict (undefined to take it back) */
  onFeedback?: (feedback: "up" | "down" | undefined) => void;
  /** The conversation's documents, for the cards of the document tools */
  artifacts?: ChatArtifact[];
  onOpenArtifact?: ChatOpenArtifact;
  /** The document open in the panel (its id), or the call being watched */
  activeArtifact?: { id?: string; callId?: string } | null;
  /** Show what an answer took (tokens, dollars). Default on. */
  showUsage?: boolean;
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

// Reading aloud: one answer at a time, across the page
let speaking: string | null = null;
const speakers = new Set<() => void>();
const setSpeaking = (id: string | null) => {
  speaking = id;
  speakers.forEach((l) => l());
};
const subscribeSpeech = (l: () => void) => {
  speakers.add(l);
  return () => speakers.delete(l);
};
const subscribeNever = () => () => {};

function speak(id: string, text: string) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = document.documentElement.lang || "en";
  u.onend = u.onerror = () => {
    if (speaking === id) setSpeaking(null);
  };
  setSpeaking(id);
  speechSynthesis.speak(u);
}

function ReadAloud({ id, text }: { id: string; text: string }) {
  const can = useSyncExternalStore(subscribeNever, () => "speechSynthesis" in window, () => false);
  const now = useSyncExternalStore(subscribeSpeech, () => speaking, () => null);
  if (!can) return null;
  const on = now === id;
  return (
    <IconButton
      variant="ghost"
      icon={on ? Square : Volume2}
      label={on ? "Stop reading" : "Read aloud"}
      onClick={() => {
        if (on) {
          speechSynthesis.cancel();
          setSpeaking(null);
        } else speak(id, speakable(text));
      }}
    />
  );
}

/** A question's file parts as chips to edit: kept files stay where they are */
function asAttachments(files: ChatPart[], sizes: Record<string, number> = {}): ChatAttachment[] {
  return files.map((f, i) => ({
    id: `${i}:${f.url}`,
    name: f.filename ?? `File ${i + 1}`,
    mediaType: f.mediaType ?? "application/octet-stream",
    size: sizes[f.filename ?? ""] ?? 0,
    url: f.url,
    status: "ready",
  }));
}

/** What an answer is made of, in order: runs of text, tool calls, and files it made */
type Segment = { kind: "text"; key: string; text: string } | { kind: "tool"; key: string; part: ChatPart } | { kind: "files"; key: string; files: ChatPart[] };

function segmentsOf(m: ChatMessage): Segment[] {
  const out: Segment[] = [];
  m.parts.forEach((p, i) => {
    const last = out.at(-1);
    if (p.type === "text" && p.text) {
      if (last?.kind === "text") last.text += p.text;
      else out.push({ kind: "text", key: `t${i}`, text: p.text });
    } else if (p.type === "file" && p.url) {
      if (last?.kind === "files") last.files.push(p);
      else out.push({ kind: "files", key: `f${i}`, files: [p] });
    } else if (isToolPart(p)) out.push({ kind: "tool", key: p.toolCallId!, part: p });
  });
  return out;
}

/** A tool call, drawn for what it is: a document card, the weather, or the generic card */
function ToolCall({
  part,
  artifacts,
  onOpenArtifact,
  activeArtifact,
}: {
  part: ChatPart;
  artifacts?: ChatArtifact[];
  onOpenArtifact?: ChatOpenArtifact;
  activeArtifact?: { id?: string; callId?: string } | null;
}) {
  const name = toolName(part);
  const input = (part.input && typeof part.input === "object" ? part.input : {}) as Record<string, unknown>;
  if (isDocumentTool(name)) {
    const id = (part.output as DocumentToolOutput | undefined)?.id ?? (typeof input.id === "string" ? input.id : undefined);
    const artifact = id ? artifacts?.find((a) => a.id === id) : undefined;
    const active = !!activeArtifact && ((!!id && activeArtifact.id === id) || activeArtifact.callId === part.toolCallId);
    return <ChatArtifactCard part={part} artifact={artifact} onOpen={onOpenArtifact} active={active} />;
  }
  if (name === "getWeather") {
    return (
      <ChatWeatherCard
        city={typeof input.city === "string" ? input.city : undefined}
        state={part.state ?? "input-streaming"}
        weather={part.state === "output-available" ? (part.output as ChatWeather) : undefined}
        errorText={part.errorText}
      />
    );
  }
  return <ChatToolCard name={name} title={toolTitle(name)} icon={toolIcon(name)} state={part.state ?? "input-streaming"} input={part.input} output={part.output} errorText={part.errorText} />;
}

/**
 * One message of a conversation. A question sits on the right in a gray box, as typed (line
 * breaks kept, no Markdown), with its files above it; an answer runs the full width under the
 * name of the model that wrote it, with the reasoning folded above it when the model shared it,
 * then its text as Markdown, the tools it used as cards (a document it wrote, the weather) and
 * any pictures it made, in the order they came.
 *
 * Under a question: Copy, Edit (it becomes a composer in place, its files kept; Escape cancels)
 * and ‹ 1/2 › when it was edited before. Under an answer: Copy, Regenerate, the versions, thumbs
 * up and down, Read aloud (where the browser can speak), and what it took in tokens and dollars.
 * Each message is an <article> with a heading (hidden for questions), so screen readers can jump
 * from message to message.
 */
export function ChatMessageView({
  message,
  streaming = false,
  onRegenerate,
  onEdit,
  editNote,
  branch,
  onFeedback,
  artifacts,
  onOpenArtifact,
  activeArtifact,
  showUsage = true,
  defaultEditing = false,
  defaultReasoningOpen = false,
  className,
}: ChatMessageViewProps) {
  const [editing, setEditing] = useState(defaultEditing);
  const [editFiles, setEditFiles] = useState<ChatAttachment[]>([]);
  const text = messageText(message);
  const meta = message.metadata;
  const files = messageFiles(message);

  if (message.role === "user") {
    const startEditing = () => {
      setEditFiles(asAttachments(files, meta?.sizes));
      setEditing(true);
    };
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
              attach
              attachments={editFiles}
              onAttachmentsChange={setEditFiles}
              onCancel={() => setEditing(false)}
              onSend={(t, kept) => {
                setEditing(false);
                onEdit(t, kept);
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
            {files.length > 0 && <ChatFileList files={files} sizes={meta?.sizes} align="end" className="max-w-[85%]" />}
            {text && <div className="max-w-[85%] border border-border bg-muted px-3 py-1.5 break-words whitespace-pre-wrap">{text}</div>}
            <div className="ctl-xs flex items-center gap-0.5">
              {meta?.edited && <span className="mr-1 text-[12px] text-muted-foreground">Edited</span>}
              {branch && branch.count > 1 && <ChatBranchPicker index={branch.index} count={branch.count} onChange={branch.onChange} of="question" />}
              {text && <CopyButton text={text} name="message" />}
              {onEdit && <IconButton variant="ghost" icon={Pencil} label="Edit message" onClick={startEditing} />}
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
  const segments = segmentsOf(message);
  const tail = segments.at(-1);
  // Between steps (a tool has answered and the model hasn't written again yet) and before the first word
  const waiting = streaming && !thinking && (!tail || (tail.kind === "tool" && (tail.part.state === "output-available" || tail.part.state === "output-error")));
  const outOfSteps = !streaming && meta?.finishReason === "tool-calls";
  return (
    <article data-slot="chat-message" data-role="assistant" aria-busy={streaming || undefined} className={cn("flex flex-col gap-1.5", className)}>
      <h2 className="text-[12px] font-semibold text-muted-foreground">{model}</h2>
      {reasoning && <ChatReasoning text={reasoning} streaming={thinking} durationMs={meta?.reasoningMs} defaultOpen={defaultReasoningOpen} />}
      {segments.map((s, i) =>
        s.kind === "text" ? (
          <ChatMarkdown key={s.key} streaming={streaming && i === segments.length - 1}>
            {s.text}
          </ChatMarkdown>
        ) : s.kind === "files" ? (
          <ChatFileList key={s.key} files={s.files} large />
        ) : (
          <ToolCall key={s.key} part={s.part} artifacts={artifacts} onOpenArtifact={onOpenArtifact} activeArtifact={activeArtifact} />
        ),
      )}
      {waiting && <Spinner className="text-[13px] text-muted-foreground">Writing…</Spinner>}
      {!streaming && meta?.stopped && <Note>Stopped before the end.</Note>}
      {!streaming && meta?.finishReason === "length" && (
        <Note>
          {text ? "Cut off at the length limit. Ask it to go on." : "It ran out of tokens while thinking, before it answered. Ask again, or turn Thinking off."}
        </Note>
      )}
      {outOfSteps && <Note>It used as many tool steps as one answer may. Ask it to go on.</Note>}
      {!streaming && refused && <Note>{text ? "The model stopped here, by its content rules." : "The model declined to answer, by its content rules."}</Note>}
      {!streaming && (
        <div className="ctl-xs flex flex-wrap items-center gap-0.5">
          {branch && branch.count > 1 && <ChatBranchPicker index={branch.index} count={branch.count} onChange={branch.onChange} of="answer" />}
          {text && <CopyButton text={text} name="answer" />}
          {onRegenerate && <IconButton variant="ghost" icon={RefreshCw} label="Regenerate answer" onClick={onRegenerate} />}
          {onFeedback && (
            <>
              <Toggle variant="ghost" icon={ThumbsUp} label="Good answer" pressed={meta?.feedback === "up"} onPressedChange={(on) => onFeedback(on ? "up" : undefined)} />
              <Toggle variant="ghost" icon={ThumbsDown} label="Bad answer" pressed={meta?.feedback === "down"} onPressedChange={(on) => onFeedback(on ? "down" : undefined)} />
            </>
          )}
          {text && <ReadAloud id={message.id} text={text} />}
          {showUsage && meta?.usage && (
            <span
              className="ml-1 flex items-center gap-1 text-[12px] text-muted-foreground tabular-nums"
              title={`${formatUsage(meta.usage)} tokens${meta.cost != null ? `, ${formatCost(meta.cost)}` : ""}`}
            >
              <Icon icon={Coins} size={13} />
              <span className="max-sm:sr-only">{formatUsage(meta.usage)}</span>
              {meta.cost != null && (
                <>
                  <span aria-hidden className="max-sm:hidden">
                    ·
                  </span>
                  <span>{formatCost(meta.cost)}</span>
                </>
              )}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
