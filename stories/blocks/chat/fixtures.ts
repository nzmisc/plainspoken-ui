// A stand-in for the chat route in Storybook, which has no API routes: it streams a canned answer
// (with reasoning when Thinking is on) at a readable pace, stops when told to, or fails like the
// route would.
import type { ChatTransport, UIMessageChunk } from "ai";
import type { ChatUIMessage } from "@/registry/plainspoken/blocks/chat/chat-app";
import type { ChatErrorCode } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS } from "@/registry/plainspoken/blocks/chat/format";
import { DEFAULT_CHAT_MODEL } from "@/registry/plainspoken/blocks/chat/models";

export const FAKE_REPLY = `This answer comes from Storybook's stand-in for the route, written a couple of words at a time so you can watch it arrive.

### What to try while it streams

1. Scroll up: the view stops following, and **Jump to latest** appears
2. Press **Stop**: what has arrived stays, marked as stopped
3. Then **Regenerate** it, or edit your question

| Step | What happens |
| --- | --- |
| Send | Your question goes into the thread |
| Stream | The answer follows, as Markdown |
| Done | Copy and Regenerate appear |

${"```"}ts
const answer = await fetch("/api/chat", { method: "POST", body });
${"```"}

That is all it says: there is no model behind it.`;

const REASONING = "The person wants to see streaming. Give a short answer with a list, a table and some code, so each kind of block arrives in turn.";

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

export interface FakeOptions {
  reply?: string;
  /** Milliseconds between chunks of two words */
  delay?: number;
  /** Fail every request this way instead */
  fail?: ChatErrorCode;
}

export function fakeTransport({ reply = FAKE_REPLY, delay = 45, fail }: FakeOptions = {}): ChatTransport<ChatUIMessage> {
  return {
    async sendMessages({ abortSignal, body }) {
      const { model = DEFAULT_CHAT_MODEL, think = true } = (body ?? {}) as { model?: string; think?: boolean };
      await sleep(500, abortSignal);
      if (fail) throw new Error(JSON.stringify({ code: fail, message: CHAT_ERRORS[fail].body }));
      const began = Date.now();
      const words = reply.split(/(?<=\s)/);
      return new ReadableStream<UIMessageChunk>({
        async start(c) {
          try {
            c.enqueue({ type: "start", messageMetadata: { model, createdAt: began } });
            if (think) {
              c.enqueue({ type: "reasoning-start", id: "r" });
              for (const w of REASONING.split(/(?<=\s)/)) {
                await sleep(delay / 2, abortSignal);
                c.enqueue({ type: "reasoning-delta", id: "r", delta: w });
              }
              c.enqueue({ type: "reasoning-end", id: "r" });
              c.enqueue({ type: "message-metadata", messageMetadata: { reasoningMs: Date.now() - began } });
            }
            c.enqueue({ type: "text-start", id: "t" });
            for (let i = 0; i < words.length; i += 2) {
              await sleep(delay, abortSignal);
              c.enqueue({ type: "text-delta", id: "t", delta: words.slice(i, i + 2).join("") });
            }
            c.enqueue({ type: "text-end", id: "t" });
            c.enqueue({ type: "finish", messageMetadata: { finishReason: "stop" } });
            c.close();
          } catch (e) {
            c.error(e);
          }
        },
      });
    },
    async reconnectToStream() {
      return null;
    },
  };
}
