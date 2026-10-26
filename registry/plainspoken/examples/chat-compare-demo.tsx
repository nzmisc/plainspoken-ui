"use client";

import { useState } from "react";
import type { ChatTransport, UIMessageChunk } from "ai";
import type { ChatMessage } from "@/registry/plainspoken/blocks/chat/data";
import { ChatCompareView } from "@/registry/plainspoken/blocks/chat/compare-view";
import { chatModelName } from "@/registry/plainspoken/blocks/chat/models";
import type { ChatUIMessage } from "@/registry/plainspoken/blocks/chat/transport";
import { Button } from "@/registry/plainspoken/ui/button";

const QUESTION: ChatMessage[] = [{ id: "q1", role: "user", parts: [{ type: "text", text: "In two sentences: why do tides come twice a day?" }] }];

const ANSWERS: Record<string, string> = {
  "anthropic/claude-haiku-5.5":
    "The Moon's pull makes the ocean bulge on the side facing it, and the Earth is pulled away from the water on the far side, so there are two bulges. As the Earth turns through both in about 24 hours and 50 minutes, most coasts get two high tides.",
  "openai/gpt-6-luna": "Two bulges of water, one under the Moon and one opposite it, stay roughly in place while the Earth spins. Each spot on the coast passes through both a day, so it sees two highs and two lows.",
};

/** Canned answers, a word at a time, instead of the chat route: in the app, pass chatTransport() */
const canned: ChatTransport<ChatUIMessage> = {
  async sendMessages({ body, abortSignal }) {
    const model = (body as { model: string }).model;
    const words = (ANSWERS[model] ?? "…").split(/(?<=\s)/);
    return new ReadableStream<UIMessageChunk>({
      async start(c) {
        try {
          c.enqueue({ type: "start", messageMetadata: { model } });
          c.enqueue({ type: "text-start", id: "t" });
          for (const w of words) {
            await new Promise((r) => setTimeout(r, model.startsWith("openai") ? 60 : 40));
            if (abortSignal?.aborted) return;
            c.enqueue({ type: "text-delta", id: "t", delta: w });
          }
          c.enqueue({ type: "text-end", id: "t" });
          c.enqueue({ type: "finish", messageMetadata: { finishReason: "stop" } });
          c.close();
        } catch {
          // Stopped: the stream was cancelled under it
        }
      },
    });
  },
  reconnectToStream: async () => null,
};

/** Two models answer one question side by side (canned answers here). Pick one to go on with. */
export default function ChatCompareDemo() {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex max-w-5xl flex-col gap-3">
      {picked ? (
        <p>
          Kept the answer from <span className="font-semibold">{picked}</span>; the other stays as its other version.
        </p>
      ) : (
        <ChatCompareView
          key={round}
          messages={QUESTION}
          models={["anthropic/claude-haiku-5.5", "openai/gpt-6-luna"]}
          transport={canned}
          onPick={(kept) => setPicked(chatModelName(kept.metadata?.model ?? ""))}
        />
      )}
      <Button className="self-start" onClick={() => (setPicked(null), setRound((r) => r + 1))}>
        Ask again
      </Button>
    </div>
  );
}
