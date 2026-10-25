// POST /api/chat: streams an answer from OpenRouter to the chat app. The key stays here on the
// server (OPENROUTER_API_KEY); the browser only names a model from the allow-list and says whether
// to think first. A request is capped (messages, characters, answer and reasoning tokens) and has
// no tools and no web access, so one person can't run up much of a bill with it.
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { APICallError, RetryError, convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import type { ChatError, ChatErrorCode, ChatMetadata } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS } from "@/registry/plainspoken/blocks/chat/format";
import { CHAT_LIMITS, isChatModel } from "@/registry/plainspoken/blocks/chat/models";

/** Seconds an answer may take; 2,000 tokens come well within it */
export const maxDuration = 60;

const INSTRUCTIONS = `You are Parley, a helpful assistant in a chat window.
Write in Markdown: short paragraphs, and lists, tables or headings where they help. Put code in fenced blocks with the language named.
Write math in LaTeX between dollar signs: $…$ inside a sentence, and $$…$$ on lines of their own for a formula that stands alone.
Be direct and keep answers to the point: they are cut off after about 1,500 words.
You can't browse the web, open links or run code; say so when a question needs that.`;

/** Biggest request body accepted, in characters; the conversation itself is capped lower */
const MAX_BODY = 400_000;

const failure = (code: ChatErrorCode, message = CHAT_ERRORS[code].body): ChatError => ({ code, message });

function reply(status: number, code: ChatErrorCode, message?: string) {
  return Response.json(failure(code, message), { status });
}

/** What went wrong with OpenRouter, in the chat's terms. Its own message isn't passed on. */
function classify(error: unknown): ChatError {
  const e = RetryError.isInstance(error) ? error.lastError : error;
  const status = APICallError.isInstance(e) ? e.statusCode : typeof e === "object" && e && "statusCode" in e ? Number(e.statusCode) : undefined;
  const text = `${e instanceof Error ? e.message : ""} ${APICallError.isInstance(e) ? (e.responseBody ?? "") : ""}`.toLowerCase();
  if (status === 401) return failure("bad-key");
  if (status === 402 || /insufficient (credits|funds)|credit balance/.test(text)) return failure("credit");
  if (status === 429) return failure("rate-limit");
  if (status === 403 || /moderation|flagged/.test(text)) return failure("refused");
  if (/context length|context window|too many tokens|maximum context/.test(text)) return failure("too-long");
  if (status === 404) return failure("bad-model");
  if (status === 408 || (status != null && status >= 500)) return failure("unavailable");
  return failure("unknown");
}

type Cleaned = { messages: UIMessage[] } | { error: ChatErrorCode };

/**
 * The conversation as the model will get it: only questions and answers, only their text (no
 * reasoning, files or tool calls), the last CHAT_LIMITS.maxMessages, and no more than
 * CHAT_LIMITS.maxInputChars, dropping the oldest. It starts with a question and ends with one.
 */
function clean(raw: unknown): Cleaned {
  if (!Array.isArray(raw) || raw.length === 0) return { error: "bad-request" };
  const out: UIMessage[] = [];
  for (const m of raw.slice(-CHAT_LIMITS.maxMessages)) {
    if (!m || typeof m !== "object") return { error: "bad-request" };
    const { id, role, parts } = m as { id?: unknown; role?: unknown; parts?: unknown };
    // System messages from the browser are dropped: the instructions above are the only ones
    if (role !== "user" && role !== "assistant") continue;
    if (!Array.isArray(parts)) return { error: "bad-request" };
    const text = parts
      .filter((p): p is { type: "text"; text: string } => p?.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
    if (!text.trim()) continue;
    out.push({ id: typeof id === "string" ? id.slice(0, 64) : `m${out.length}`, role, parts: [{ type: "text", text }] });
  }
  const size = (m: UIMessage) => (m.parts[0] as { text: string }).text.length;
  let total = out.reduce((n, m) => n + size(m), 0);
  while (out.length > 1 && total > CHAT_LIMITS.maxInputChars) total -= size(out.shift()!);
  while (out[0]?.role === "assistant") out.shift();
  if (total > CHAT_LIMITS.maxInputChars) return { error: "too-long" };
  if (out.at(-1)?.role !== "user") return { error: "bad-request" };
  return { messages: out };
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return reply(503, "no-key");

  const raw = await req.text();
  if (raw.length > MAX_BODY) return reply(413, "too-long");
  let body: { messages?: unknown; model?: unknown; think?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, "bad-request");
  }
  if (!isChatModel(body.model)) return reply(400, "bad-model");
  const model = body.model;
  const think = body.think !== false;
  const cleaned = clean(body.messages);
  if ("error" in cleaned) return reply(400, cleaned.error);

  // "Thought for 4 s" counts from the request, as the reader waited: some models think in silence
  // and send their reasoning in one burst at the end
  const began = Date.now();
  const openrouter = createOpenRouter({ apiKey });
  const result = streamText({
    // Thinking gets a budget of its own on top of the answer's, since reasoning tokens count as
    // output. Off, it is asked for none: some models reason at length by default and never get to
    // the answer. A model that can't reason ignores this and answers.
    model: openrouter.chat(model, { reasoning: think ? { max_tokens: CHAT_LIMITS.reasoningTokens } : { effort: "none" } }),
    instructions: INSTRUCTIONS,
    messages: await convertToModelMessages(cleaned.messages),
    maxOutputTokens: CHAT_LIMITS.maxOutputTokens + (think ? CHAT_LIMITS.reasoningTokens : 0),
    maxRetries: 1,
    abortSignal: req.signal,
    // The default logs the whole error; this keeps the log to what it was
    onError: ({ error }) => console.error(`chat: ${model}: ${classify(error).code}`),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendReasoning: true,
      onError: (error) => JSON.stringify(classify(error)),
      messageMetadata: ({ part }): ChatMetadata | undefined => {
        if (part.type === "start") return { model, createdAt: Date.now() };
        if (part.type === "reasoning-end") return { reasoningMs: Date.now() - began };
        if (part.type === "finish") return { finishReason: part.finishReason };
        return undefined;
      },
    }),
  });
}
