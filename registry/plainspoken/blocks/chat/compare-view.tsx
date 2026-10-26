"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { ChatTransport } from "ai";
import { Check, CircleStop, RotateCcw, X } from "@/registry/plainspoken/lib/icons";
import type { ChatMessage } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS, chatErrorOf } from "@/registry/plainspoken/blocks/chat/format";
import { chatModelName } from "@/registry/plainspoken/blocks/chat/models";
import type { ChatUIMessage } from "@/registry/plainspoken/blocks/chat/transport";
import { ChatMessageView } from "@/registry/plainspoken/blocks/chat/message";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { cn } from "@/lib/utils";

export interface ChatCompareViewProps {
  /** The conversation so far, ending with the question to answer */
  messages: ChatMessage[];
  /** The models that answer it, side by side: two, or three */
  models: string[];
  transport: ChatTransport<ChatUIMessage>;
  /** What else each request carries (whether to think, the documents); the model is added per column */
  body?: Record<string, unknown>;
  /** One answer was picked: it, and every answer that came (the picked one among them) */
  onPick: (kept: ChatMessage, all: ChatMessage[]) => void;
  /** Put the comparison away without keeping an answer */
  onCancel?: () => void;
  className?: string;
}

interface ColumnProps {
  messages: ChatMessage[];
  model: string;
  transport: ChatTransport<ChatUIMessage>;
  body?: Record<string, unknown>;
  /** The answer so far once it is done (null if none came), and whether it is still coming */
  onAnswer: (answer: ChatMessage | null, working: boolean) => void;
  onPick: (answer: ChatMessage) => void;
}

function Column({ messages, model, transport, body, onAnswer, onPick }: ColumnProps) {
  const { messages: list, status, error, regenerate, stop } = useChat<ChatUIMessage>({ messages: messages as ChatUIMessage[], transport, throttle: 40 });
  const ask = () => void regenerate({ body: { ...body, model } });
  // Asked once it has really mounted: useChat stops its request when it unmounts, and React
  // mounts twice in development, so a request made at once would be stopped before it went out
  const begin = useEffectEvent(ask);
  useEffect(() => {
    const t = setTimeout(begin, 0);
    return () => clearTimeout(t);
  }, []);

  const last = list.at(-1);
  const answer = last?.role === "assistant" ? (last as ChatMessage) : null;
  const busy = status === "submitted" || status === "streaming";
  // Stopped before a word came: done, with nothing to show
  const [stopped, setStopped] = useState(false);
  // Working until an answer or an error is in (it hasn't started yet when it first mounts)
  const working = busy || (!answer && !error && !stopped);
  const report = useEffectEvent((a: ChatMessage | null, w: boolean) => onAnswer(a, w));
  useEffect(() => {
    report(busy ? null : answer, working);
  }, [answer, busy, working]);

  const failure = error ? chatErrorOf(error) : null;
  const name = chatModelName(model);
  return (
    <section aria-label={`Answer from ${name}`} aria-busy={busy || undefined} className="flex min-w-0 flex-col gap-3 border border-border p-3">
      {answer ? (
        <ChatMessageView message={answer} streaming={status === "streaming"} />
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[12px] font-semibold text-muted-foreground">{name}</p>
          {busy && (
            <Spinner label={null} className="text-[13px] text-muted-foreground">
              Waiting for the first words…
            </Spinner>
          )}
        </div>
      )}
      {failure && (
        <Alert
          variant="destructive"
          title={CHAT_ERRORS[failure.code].title}
          actions={
            <Button size="sm" icon={RotateCcw} onClick={() => (setStopped(false), ask())}>
              Retry
            </Button>
          }
        >
          {failure.message}
        </Alert>
      )}
      <div className="mt-auto flex gap-2">
        {busy ? (
          <Button size="sm" icon={CircleStop} onClick={() => (setStopped(true), void stop())}>
            Stop
          </Button>
        ) : (
          answer && (
            <Button size="sm" variant="primary" icon={Check} onClick={() => onPick(answer)}>
              Use this answer
            </Button>
          )
        )}
      </div>
    </section>
  );
}

/**
 * One question, answered by two or three models at once, side by side (stacked on a phone). Each
 * answer streams on its own and can be stopped on its own; "Use this answer" keeps one in the
 * conversation, and the others stay as its other versions (‹ 1/2 › under it). Each column is its
 * own useChat, asking once when it mounts.
 */
export function ChatCompareView({ messages, models, transport, body, onPick, onCancel, className }: ChatCompareViewProps) {
  const answers = useRef<(ChatMessage | null)[]>([]);
  // Which columns are still answering, for the line at the top
  const [working, setWorking] = useState<boolean[]>(() => models.map(() => true));
  const answering = working.filter(Boolean).length;
  const others = models.length === 2 ? "the other stays as another version" : "the others stay as other versions";
  return (
    <div data-slot="chat-compare" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <p className="flex-1 text-[13px] text-muted-foreground" aria-live="polite">
          {answering > 0
            ? `${answering === models.length ? `${models.length} models are` : answering === 1 ? "1 model is" : `${answering} models are`} answering. Pick the answer to go on with; ${others}.`
            : `Pick the answer to go on with; ${others}.`}
        </p>
        {onCancel && (
          <Button size="sm" variant="ghost" icon={X} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <div className={cn("grid gap-3", models.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
        {models.map((model, i) => (
          <Column
            key={`${i}:${model}`}
            messages={messages}
            model={model}
            transport={transport}
            body={body}
            onAnswer={(a, w) => {
              answers.current[i] = a;
              setWorking((list) => (list[i] === w ? list : list.map((x, j) => (j === i ? w : x))));
            }}
            onPick={(kept) => {
              // In column order, so ‹ 1/2 › counts left to right
              const all = answers.current.filter((a): a is ChatMessage => !!a);
              onPick(kept, all.some((a) => a.id === kept.id) ? all : [...all, kept]);
            }}
          />
        ))}
      </div>
    </div>
  );
}
