// A stand-in for the chat route in Storybook, which has no API routes: it streams a canned answer
// (with reasoning when Thinking is on) at a readable pace, stops when told to, or fails like the
// route would. Ask about the weather, or to write a document, code or a sheet, and the answer
// calls that tool first, as the route's models do.
import type { ChatTransport, UIMessageChunk } from "ai";
import type { ChatArtifactKind, ChatErrorCode } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS, messageText } from "@/registry/plainspoken/blocks/chat/format";
import { DEFAULT_CHAT_MODEL, chatCost } from "@/registry/plainspoken/blocks/chat/models";
import { SHOWCASE_WEATHER } from "@/registry/plainspoken/blocks/chat/showcase";
import type { ChatUIMessage } from "@/registry/plainspoken/blocks/chat/transport";

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

const DOCUMENTS: Record<ChatArtifactKind, { title: string; language?: string; content: string; after: string }> = {
  text: {
    title: "Notes for the boathouse meeting",
    content: `# Notes for the boathouse meeting

## What we agreed

- The roof is fixed **before** the spring regatta
- Kit is checked in and out on the sheet by the door
- New members get two supervised sessions

## Still open

1. Who holds the second key
2. Whether the shed can take another rack`,
    after: "It's open beside the chat. Edit it there, or ask me to change it.",
  },
  code: {
    title: "Count the words",
    language: "typescript",
    content: `const text = "the tide comes in and the tide goes out";

const counts = new Map<string, number>();
for (const word of text.split(" ")) counts.set(word, (counts.get(word) ?? 0) + 1);

const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3);
console.log(top.map(([w, n]) => \`\${w}: \${n}\`).join("\\n"));`,
    after: "It's open beside the chat: press **Run** to see the three most common words.",
  },
  sheet: {
    title: "Club kit",
    content: `Item,Count,Each (£),Total (£)
Paddles,12,45,540
Spray decks,8,60,480
Buoyancy aids,10,55,550
Throw lines,4,25,100`,
    after: "The sheet is open beside the chat. Click a cell to change it.",
  },
};

const kindOf = (q: string): ChatArtifactKind | null =>
  /\b(sheet|table|spreadsheet|csv)\b/i.test(q) ? "sheet" : /\b(code|script|function|program)\b/i.test(q) ? "code" : /\b(document|draft|write|notes?)\b/i.test(q) ? "text" : null;

export interface FakeOptions {
  /** The answer's text; a function gets the model, for answers that differ by model */
  reply?: string | ((model: string) => string);
  /** Milliseconds between chunks of two words */
  delay?: number;
  /** Fail every request this way instead */
  fail?: ChatErrorCode;
}

export function fakeTransport({ reply = FAKE_REPLY, delay = 45, fail }: FakeOptions = {}): ChatTransport<ChatUIMessage> {
  return {
    async sendMessages({ abortSignal, body, messages }) {
      const { model = DEFAULT_CHAT_MODEL, think = true } = (body ?? {}) as { model?: string; think?: boolean };
      await sleep(500, abortSignal);
      if (fail) throw new Error(JSON.stringify({ code: fail, message: CHAT_ERRORS[fail].body }));
      const began = Date.now();
      const question = messageText(messages.findLast((m) => m.role === "user") ?? { id: "", role: "user", parts: [] });
      const kind = kindOf(question);
      const weather = /\bweather\b/i.test(question);
      const text = weather
        ? "Brighton is cool and breezy today, with sun and some cloud. Bring a layer for the seafront: the wind takes a few degrees off."
        : kind
          ? DOCUMENTS[kind].after
          : typeof reply === "function"
            ? reply(model)
            : reply;
      const words = text.split(/(?<=\s)/);
      const usage = { input: 1200 + question.length, output: Math.round(text.length / 4) };
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
            if (weather || kind) {
              const id = `fake-${began}`;
              const name = weather ? "getWeather" : "createDocument";
              const doc = kind ? DOCUMENTS[kind] : null;
              const input = doc ? { kind, title: doc.title, ...(doc.language ? { language: doc.language } : {}), content: doc.content } : { city: "Brighton, UK" };
              c.enqueue({ type: "start-step" });
              c.enqueue({ type: "tool-input-start", toolCallId: id, toolName: name });
              // The input arrives as JSON, a few characters at a time, as a model writes it
              const json = JSON.stringify(input);
              for (let i = 0; i < json.length; i += 12) {
                await sleep(delay / 3, abortSignal);
                c.enqueue({ type: "tool-input-delta", toolCallId: id, inputTextDelta: json.slice(i, i + 12) });
              }
              c.enqueue({ type: "tool-input-available", toolCallId: id, toolName: name, input });
              await sleep(weather ? 700 : 150, abortSignal);
              const output = doc ? { id: `doc-${began}`, title: doc.title, kind, version: 1 } : SHOWCASE_WEATHER;
              c.enqueue({ type: "tool-output-available", toolCallId: id, output });
              c.enqueue({ type: "finish-step" });
              c.enqueue({ type: "start-step" });
            }
            c.enqueue({ type: "text-start", id: "t" });
            for (let i = 0; i < words.length; i += 2) {
              await sleep(delay, abortSignal);
              c.enqueue({ type: "text-delta", id: "t", delta: words.slice(i, i + 2).join("") });
            }
            c.enqueue({ type: "text-end", id: "t" });
            c.enqueue({ type: "finish", messageMetadata: { finishReason: "stop", usage, cost: chatCost(model, usage.input, usage.output) } });
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
