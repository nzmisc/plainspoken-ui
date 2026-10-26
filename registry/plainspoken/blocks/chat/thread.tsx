"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, MessageSquare, RotateCcw } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { ChatArtifact, ChatError, ChatMessage, ChatSuggestion } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS } from "@/registry/plainspoken/blocks/chat/format";
import { chatModelName } from "@/registry/plainspoken/blocks/chat/models";
import { ChatMessageView, type ChatMessageBranch, type ChatOpenArtifact } from "@/registry/plainspoken/blocks/chat/message";
import type { ChatAttachment } from "@/registry/plainspoken/blocks/chat/attachments";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { cn } from "@/lib/utils";

/** useChat's status: ready, submitted (waiting for the first word), streaming, error */
export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

export interface ChatThreadProps {
  messages: ChatMessage[];
  status?: ChatStatus;
  /** The failure of the last request, shown after the last message with Retry */
  error?: ChatError | null;
  /** Try the last request again */
  onRetry?: () => void;
  /** Regenerate an answer (any of them: the old one is kept as another version) */
  onRegenerate?: (messageId: string) => void;
  /** Send a question again with new text and the files kept, in its place (what came after is kept as another version) */
  onEdit?: (messageId: string, text: string, attachments: ChatAttachment[]) => void;
  /** The versions of the message at an index of `messages`, for ‹ 1/2 › */
  branchAt?: (index: number) => ChatMessageBranch | undefined;
  /** Thumbs up or down on an answer */
  onFeedback?: (messageId: string, feedback: "up" | "down" | undefined) => void;
  /** The conversation's documents, for the cards of the tools that write them */
  artifacts?: ChatArtifact[];
  onOpenArtifact?: ChatOpenArtifact;
  /** The document open beside the thread */
  activeArtifact?: { id?: string; callId?: string } | null;
  /** The model being waited for, named while the request is out */
  pendingModel?: string;
  /** Prompts offered in an empty conversation */
  suggestions?: ChatSuggestion[];
  onSuggestion?: (prompt: string) => void;
  /** The sentence under "Start a conversation" */
  intro?: ReactNode;
  /** Instead of the default empty state */
  empty?: ReactNode;
  /** After the last message, in the scrolling column: a comparison of answers */
  footer?: ReactNode;
  /** Start scrolled to the end (default), as a conversation opens */
  className?: string;
}

/** Closer than this to the end counts as at the end */
const NEAR_END = 40;

/**
 * A conversation: the messages in a column of reading width, scrolling on their own. It opens
 * at the end and stays there while answers stream and pictures, diagrams and code finish drawing;
 * only scrolling away yourself stops it following (a change of height never does), and then it
 * offers "Jump to latest". An empty conversation shows a few prompts to start from.
 * A failed request shows its reason after the last message, with Retry. What is happening
 * (waiting, answering, done) is said in a polite live region, not by reading the text as it
 * streams. The scrolling area takes keyboard focus, so arrow keys and Page Down scroll it.
 */
export function ChatThread({
  messages,
  status = "ready",
  error,
  onRetry,
  onRegenerate,
  onEdit,
  branchAt,
  onFeedback,
  artifacts,
  onOpenArtifact,
  activeArtifact,
  pendingModel,
  suggestions = [],
  onSuggestion,
  intro,
  empty,
  footer,
  className,
}: ChatThreadProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  // While a smooth jump is under way its own scroll events must not switch following off
  const jumping = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only the reader moves the view away from the end: these say they just did (or are)
  const intentUntil = useRef(0);
  const touching = useRef(false);
  const dragging = useRef(false);
  // The heights last seen: a scroll that comes with a change of height was caused by the layout
  const size = useRef({ content: 0, view: 0 });
  const [away, setAway] = useState(false);

  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  const lastUser = messages.findLastIndex((m) => m.role === "user");

  const toEnd = (smooth = false) => {
    const el = scroller.current;
    if (!el) return;
    following.current = true;
    setAway(false);
    const glide = smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (glide) {
      if (jumping.current) clearTimeout(jumping.current);
      jumping.current = setTimeout(() => (jumping.current = null), 1000);
    }
    el.scrollTo({ top: el.scrollHeight, behavior: glide ? "smooth" : "auto" });
  };

  // Follow the content as it grows or changes height (a streaming answer, a diagram drawn, a
  // picture loaded, code highlighted), unless the reader has scrolled away from the end. An empty
  // conversation (the suggestions) stays at the top.
  const hasMessages = useRef(messages.length > 0);
  useLayoutEffect(() => {
    hasMessages.current = messages.length > 0;
  }, [messages.length]);
  useLayoutEffect(() => {
    const el = scroller.current;
    const col = column.current;
    if (!el || !col) return;
    if (hasMessages.current) el.scrollTop = el.scrollHeight;
    const ro = new ResizeObserver(() => {
      if (following.current && hasMessages.current && !jumping.current) el.scrollTop = el.scrollHeight;
      size.current = { content: el.scrollHeight, view: el.clientHeight };
    });
    ro.observe(col);
    ro.observe(el);
    const mark = (ms = 300) => (intentUntil.current = Math.max(intentUntil.current, performance.now() + ms));
    const onWheel = () => mark();
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab"].includes(e.key)) mark(600);
    };
    const onTouchStart = () => (touching.current = true);
    const onTouchEnd = () => {
      touching.current = false;
      mark(1200); // the flick goes on after the finger lifts
    };
    // A press on the scrolling box itself, not on anything in it, is on its scroll bar
    const onPointerDown = (e: PointerEvent) => {
      if (e.target === el) dragging.current = true;
    };
    const onPointerUp = () => {
      if (dragging.current) mark();
      dragging.current = false;
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("keydown", onKey);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  // A new question always brings the end back into view
  const count = messages.length;
  useEffect(() => {
    if (last?.role === "user") toEnd();
    // Only when a message is added, not as one streams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_END;
    if (jumping.current) {
      if (!atEnd) return;
      clearTimeout(jumping.current);
      jumping.current = null;
    }
    const resized = el.scrollHeight !== size.current.content || el.clientHeight !== size.current.view;
    size.current = { content: el.scrollHeight, view: el.clientHeight };
    if (atEnd) {
      following.current = true;
      setAway(false);
      return;
    }
    // Scrolled by the reader (wheel, touch, keys, the scroll bar), or by something that isn't the
    // layout (find in page, a screen reader): stop following. A scroll that came with a change of
    // height (a diagram drawn above, a picture loaded) while following goes back to the end.
    const byReader = touching.current || dragging.current || performance.now() < intentUntil.current;
    if (byReader || !resized) {
      following.current = false;
      setAway(true);
    } else if (following.current && hasMessages.current) el.scrollTop = el.scrollHeight;
  };

  const said =
    status === "submitted"
      ? `Sent. Waiting for ${chatModelName(pendingModel)}.`
      : status === "streaming"
        ? "Answering…"
        : status === "error"
          ? ""
          : last?.role === "assistant" && last.metadata?.stopped
            ? "Stopped."
            : last?.role === "assistant"
              ? "Answer finished."
              : "";

  const failure = error ? CHAT_ERRORS[error.code] : null;
  return (
    <div data-slot="chat-thread" className={cn("relative flex min-h-0 flex-col", className)}>
      <div
        ref={scroller}
        onScroll={onScroll}
        tabIndex={0}
        role="region"
        aria-label="Messages"
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", FOCUS_RING, "focus-visible:-outline-offset-2")}
      >
        <div ref={column} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
          {messages.length === 0 && !busy
            ? (empty ?? (
                <EmptyState
                  icon={MessageSquare}
                  title="Start a conversation"
                  description={intro ?? "Ask anything, or start from one of these. Answers stream in as they are written."}
                  className="py-8"
                >
                  {suggestions.length > 0 && (
                    <ul className="mt-4 grid gap-2 text-left sm:grid-cols-2">
                      {suggestions.map((s) => (
                        <li key={s.title} className="flex">
                          <button
                            type="button"
                            disabled={!onSuggestion}
                            onClick={() => onSuggestion?.(s.prompt)}
                            className={cn(
                              "flex w-full cursor-pointer flex-col gap-0.5 border border-input bg-background px-3 py-2 text-left hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60",
                              FOCUS_RING,
                            )}
                          >
                            <span className="font-semibold text-foreground">{s.title}</span>
                            <span className="text-[13px] text-muted-foreground">{s.prompt}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </EmptyState>
              ))
            : messages.map((m, i) => {
                const isStreaming = status === "streaming" && i === messages.length - 1 && m.role === "assistant";
                const after = messages.length - 1 - i;
                const answer = m.role === "assistant";
                return (
                  <ChatMessageView
                    key={m.id}
                    message={m}
                    streaming={isStreaming}
                    onRegenerate={!busy && answer && onRegenerate ? () => onRegenerate(m.id) : undefined}
                    onEdit={!busy && onEdit && m.role === "user" ? (t, files) => onEdit(m.id, t, files) : undefined}
                    editNote={
                      after > 0
                        ? i === lastUser
                          ? "Sending gives a new answer; this one stays as an earlier version."
                          : `Sending starts again from here; the ${after} messages below stay as an earlier version.`
                        : undefined
                    }
                    branch={busy ? undefined : branchAt?.(i)}
                    onFeedback={answer && onFeedback && !isStreaming ? (f) => onFeedback(m.id, f) : undefined}
                    artifacts={artifacts}
                    onOpenArtifact={onOpenArtifact}
                    activeArtifact={activeArtifact}
                  />
                );
              })}
          {footer}
          {status === "submitted" && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[12px] font-semibold text-muted-foreground">{chatModelName(pendingModel)}</p>
              <Spinner label={null} className="text-[13px] text-muted-foreground">
                Waiting for the first words…
              </Spinner>
            </div>
          )}
          {status === "ready" && last?.role === "user" && onRetry && (
            <Alert
              title="No answer yet"
              actions={
                <Button size="sm" icon={RotateCcw} onClick={onRetry}>
                  Get an answer
                </Button>
              }
            >
              This question was sent but the answer never arrived.
            </Alert>
          )}
          {error && failure && (
            <Alert
              variant="destructive"
              title={failure.title}
              actions={
                onRetry && (
                  <Button size="sm" icon={RotateCcw} onClick={onRetry}>
                    Retry
                  </Button>
                )
              }
            >
              {error.message}
            </Alert>
          )}
        </div>
      </div>
      {away && messages.length > 0 && (
        <Button
          size="sm"
          icon={ArrowDown}
          onClick={() => toEnd(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background shadow-sm"
        >
          Jump to latest
        </Button>
      )}
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
