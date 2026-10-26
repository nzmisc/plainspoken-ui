// POST /api/chat: streams an answer from OpenRouter to the chat app. The key stays here on the
// server (OPENROUTER_API_KEY); the browser only names a model from the allow-list, says whether
// to think first, and sends the conversation with its files and the latest version of its
// documents. A request is capped (messages, characters, files, answer and reasoning tokens, tool
// steps). The tools only write content: documents (checked here, kept in the browser) and the
// weather, which is the one thing fetched from outside, from open-meteo.com only.
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { APICallError, RetryError, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { applyEdit, keepSuggestions, type DocumentBrief, type DocumentToolOutput } from "@/registry/plainspoken/blocks/chat/artifacts";
import type { ChatError, ChatErrorCode, ChatMetadata, ChatWeather } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS } from "@/registry/plainspoken/blocks/chat/format";
import { CHAT_LIMITS, chatCost, chatModel, isChatModel, type ChatModel } from "@/registry/plainspoken/blocks/chat/models";

/** Seconds an answer may take: a few steps of 2,000 tokens come well within it */
export const maxDuration = 60;

const INSTRUCTIONS = `You are Parley, a helpful assistant in a chat window.
Write in Markdown: short paragraphs, and lists, tables or headings where they help. Put code in fenced blocks with the language named.
Write math in LaTeX between dollar signs: $…$ inside a sentence, and $$…$$ on lines of their own for a formula that stands alone.
Be direct and keep answers to the point: they are cut off after about 1,500 words.
You can't browse the web or open links. People can attach pictures, PDFs and text files; their contents are in the message.

Tools:
- createDocument puts a document in a panel beside the chat, where the person can read, edit, download and (for JavaScript and TypeScript) run it. Use it for something they will want to keep or work on: a letter, an essay, a plan or a page of writing (kind "text", in Markdown), a program or a script (kind "code", with its language), or a table of data (kind "sheet", CSV with a header row). Keep documents under about 800 words. Write the whole document in "content", and don't repeat it in the chat: afterwards say in a sentence or two what you made. Short answers, small snippets and small tables belong in the chat, not in a document.
- editDocument changes one passage of a document: "find" must quote it exactly. updateDocument replaces a document with a new version; use it for bigger changes.
- requestSuggestions proposes edits to a text document, for the person to accept or reject one by one. Each "original" must quote the document exactly. Use it when they ask for suggestions or feedback on a document.
- getWeather gives the weather now and for the next five days in a city. Use it for questions about the weather; never guess it.
Lines in square brackets that start with "Tool:" in earlier answers record tools you used; never write such lines yourself.`;

const MB = 1024 * 1024;
/** Biggest request body accepted, in characters: the files (as base64) and the conversation */
const MAX_BODY = Math.ceil((CHAT_LIMITS.maxRequestFileBytes * 4) / 3) + 1.5 * MB;

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
  if (status === 413 || /too large|payload/.test(text)) return failure("too-big");
  if (/context length|context window|too many tokens|maximum context/.test(text)) return failure("too-long");
  if (status === 404) return failure("bad-model");
  if (status === 408 || (status != null && status >= 500)) return failure("unavailable");
  return failure("unknown");
}

// ---------------------------------------------------------------------------------------------
// The conversation, checked

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
/** Text files go into the message as text; these besides text/* */
const TEXT_TYPES = new Set(["application/json", "application/xml", "application/javascript", "application/typescript", "application/x-yaml", "application/yaml", "application/toml", "application/sql"]);
const isText = (type: string) => type.startsWith("text/") || TEXT_TYPES.has(type);

type File = { name: string; type: string; base64: string; bytes: number };
type Message = { role: "user" | "assistant"; text: string; files: File[] };

/** A data: URL's type and bytes, or null when it isn't one we take */
function dataUrl(url: string): { type: string; base64: string; bytes: number } | null {
  const m = /^data:([\w.+-]+\/[\w.+-]+)(?:;[\w-]+=[^;,]*)*;base64,([A-Za-z0-9+/=\s]*)$/.exec(url);
  if (!m) return null;
  const base64 = m[2].replace(/\s/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return { type: m[1].toLowerCase(), base64, bytes: (base64.length * 3) / 4 - padding };
}

const safeName = (v: unknown, i: number) => (typeof v === "string" && v.trim() ? v.replace(/[\r\n<>"]/g, " ").trim().slice(0, 120) : `file-${i + 1}`);

type Cleaned = { messages: Message[]; pdf: boolean } | { error: ChatErrorCode; message?: string };

/**
 * The conversation as the model will get it: only questions and answers, their text, and the
 * files of questions (pictures, PDFs, text files), the last CHAT_LIMITS.maxMessages, no more than
 * CHAT_LIMITS.maxInputChars of text, and no more files than the limits allow (the newest kept,
 * the others named in a note). It starts with a question and ends with one.
 */
function clean(raw: unknown, model: ChatModel): Cleaned {
  if (!Array.isArray(raw) || raw.length === 0) return { error: "bad-request" };
  const out: Message[] = [];
  for (const m of raw.slice(-CHAT_LIMITS.maxMessages)) {
    if (!m || typeof m !== "object") return { error: "bad-request" };
    const { role, parts } = m as { role?: unknown; parts?: unknown };
    // System messages from the browser are dropped: the instructions above are the only ones
    if (role !== "user" && role !== "assistant") continue;
    if (!Array.isArray(parts)) return { error: "bad-request" };
    let text = "";
    const files: File[] = [];
    for (const [i, p] of parts.entries()) {
      if (p?.type === "text" && typeof p.text === "string") text += p.text;
      else if (p?.type === "file" && role === "user" && typeof p.url === "string") {
        const data = dataUrl(p.url);
        if (!data) return { error: "bad-request", message: "An attached file couldn't be read." };
        if (data.bytes > CHAT_LIMITS.maxFileBytes) return { error: "too-big", message: `“${safeName(p.filename, i)}” is bigger than ${CHAT_LIMITS.maxFileBytes / MB} MB.` };
        files.push({ name: safeName(p.filename, i), type: data.type, base64: data.base64, bytes: data.bytes });
      }
    }
    if (files.length > CHAT_LIMITS.maxFiles) return { error: "too-big", message: `A message can have at most ${CHAT_LIMITS.maxFiles} files.` };
    if (!text.trim() && files.length === 0) continue;
    out.push({ role, text, files });
  }

  // Files, newest first, within the limits; the older ones become notes
  let count = 0;
  let bytes = 0;
  for (let i = out.length - 1; i >= 0; i--) {
    const kept: File[] = [];
    const notes: string[] = [];
    for (const f of out[i].files) {
      const fits = count < CHAT_LIMITS.maxFilesPerRequest && bytes + f.bytes <= CHAT_LIMITS.maxRequestFileBytes;
      const known = IMAGE_TYPES.has(f.type) || f.type === "application/pdf" || isText(f.type);
      if (!known) notes.push(`[The file “${f.name}” (${f.type}) was attached, but this chat can't read that kind of file.]`);
      else if (IMAGE_TYPES.has(f.type) && !model.reads.images) notes.push(`[The picture “${f.name}” was attached, but this model can't see pictures.]`);
      else if (!fits) {
        if (i === out.length - 1) return { error: "too-big" };
        notes.push(`[An earlier file, “${f.name}”, was left out of this request to keep it small.]`);
      } else {
        count++;
        bytes += f.bytes;
        kept.push(f);
      }
    }
    out[i] = { ...out[i], files: kept, text: [out[i].text, ...notes].filter(Boolean).join("\n\n") };
  }

  // Text files become text, so they count against the characters
  for (const m of out) {
    const inline = m.files.filter((f) => isText(f.type));
    if (!inline.length) continue;
    const blocks = inline.map((f) => {
      let body = Buffer.from(f.base64, "base64").toString("utf8");
      const cut = body.length > CHAT_LIMITS.maxTextFileChars;
      if (cut) body = body.slice(0, CHAT_LIMITS.maxTextFileChars);
      return `<file name="${f.name}">\n${body}\n</file>${cut ? `\n[“${f.name}” was cut off after ${CHAT_LIMITS.maxTextFileChars.toLocaleString("en")} characters.]` : ""}`;
    });
    m.text = [m.text, ...blocks].filter(Boolean).join("\n\n");
    m.files = m.files.filter((f) => !isText(f.type));
  }

  let total = out.reduce((n, m) => n + m.text.length, 0);
  while (out.length > 1 && total > CHAT_LIMITS.maxInputChars) total -= out.shift()!.text.length;
  while (out[0]?.role === "assistant") out.shift();
  if (total > CHAT_LIMITS.maxInputChars) return { error: "too-long" };
  if (out.at(-1)?.role !== "user") return { error: "bad-request" };
  return { messages: out, pdf: out.some((m) => m.files.some((f) => f.type === "application/pdf")) };
}

function toModelMessages(messages: Message[]): ModelMessage[] {
  return messages.map((m): ModelMessage => {
    if (m.role === "assistant") return { role: "assistant", content: m.text };
    return {
      role: "user",
      content: [
        ...(m.text ? [{ type: "text" as const, text: m.text }] : []),
        ...m.files.map((f) => ({ type: "file" as const, data: Buffer.from(f.base64, "base64"), mediaType: f.type, filename: f.name })),
      ],
    };
  });
}

const KINDS = ["text", "code", "sheet"] as const;

/** The documents the browser says the conversation has, within the limits, newest last */
function cleanDocuments(raw: unknown): Map<string, DocumentBrief> {
  const docs = new Map<string, DocumentBrief>();
  if (!Array.isArray(raw)) return docs;
  let chars = 0;
  for (const d of raw.slice(0, CHAT_LIMITS.maxDocuments)) {
    if (!d || typeof d !== "object") continue;
    const { id, kind, title, language, content, version } = d as Record<string, unknown>;
    if (typeof id !== "string" || !/^[\w-]{1,40}$/.test(id) || !KINDS.includes(kind as (typeof KINDS)[number])) continue;
    if (typeof content !== "string" || content.length > CHAT_LIMITS.maxDocumentLength || chars + content.length > CHAT_LIMITS.maxDocumentChars) continue;
    chars += content.length;
    docs.set(id, {
      id,
      kind: kind as DocumentBrief["kind"],
      title: typeof title === "string" ? title.slice(0, 120) : "Untitled",
      language: typeof language === "string" ? language.slice(0, 30) : undefined,
      content,
      version: typeof version === "number" && Number.isInteger(version) && version > 0 ? version : 1,
    });
  }
  return docs;
}

const attr = (v: string) => v.replace(/["<>\n]/g, " ");

function describeDocuments(docs: Map<string, DocumentBrief>): string {
  if (!docs.size) return "";
  const list = [...docs.values()].map(
    (d) =>
      `<document id="${d.id}" kind="${d.kind}" title="${attr(d.title)}"${d.language ? ` language="${attr(d.language)}"` : ""} version="${d.version}">\n${d.content}\n</document>`,
  );
  return `\n\nDocuments in this conversation, latest versions (use their ids with the tools):\n${list.join("\n")}`;
}

// ---------------------------------------------------------------------------------------------
// Weather, from open-meteo.com (no key): the two hosts are fixed, only the query comes from the model

const WEATHER_TIMEOUT = 5000;
const MAX_WEATHER_BYTES = 200_000;

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(WEATHER_TIMEOUT)]), redirect: "error", headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`The weather service answered with an error (${res.status}).`);
  const text = await res.text();
  if (text.length > MAX_WEATHER_BYTES) throw new Error("The weather service sent more than expected.");
  return JSON.parse(text);
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

async function weather(city: string, signal: AbortSignal): Promise<ChatWeather> {
  const name = city.trim().slice(0, 80);
  if (!name) throw new Error("Which city?");
  const geo = (await getJson(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name, count: "1", language: "en", format: "json" })}`, signal)) as {
    results?: { name?: string; admin1?: string; country?: string; latitude?: number; longitude?: number }[];
  };
  const p = geo.results?.[0];
  if (!p || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) throw new Error(`No place called “${name}” was found.`);
  const query = new URLSearchParams({
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "5",
  });
  const f = (await getJson(`https://api.open-meteo.com/v1/forecast?${query}`, signal)) as {
    current?: Record<string, unknown>;
    current_units?: Record<string, unknown>;
    daily?: Record<string, unknown[]>;
  };
  const c = f.current ?? {};
  const d = f.daily ?? {};
  const days = Array.isArray(d.time) ? d.time.slice(0, 5) : [];
  return {
    place: { name: String(p.name ?? name).slice(0, 80), region: p.admin1?.slice(0, 80), country: p.country?.slice(0, 80), latitude: p.latitude!, longitude: p.longitude! },
    current: {
      time: String(c.time ?? ""),
      temperature: num(c.temperature_2m),
      feelsLike: num(c.apparent_temperature),
      humidity: num(c.relative_humidity_2m),
      wind: num(c.wind_speed_10m),
      code: num(c.weather_code),
      isDay: c.is_day === 1,
    },
    daily: days.map((date, i) => ({
      date: String(date),
      code: num(d.weather_code?.[i]),
      max: num(d.temperature_2m_max?.[i]),
      min: num(d.temperature_2m_min?.[i]),
      rain: Number.isFinite(num(d.precipitation_probability_max?.[i])) ? num(d.precipitation_probability_max?.[i]) : null,
    })),
    units: { temperature: String(f.current_units?.temperature_2m ?? "°C"), wind: String(f.current_units?.wind_speed_10m ?? "km/h") },
  };
}

// ---------------------------------------------------------------------------------------------
// The tools: they check and record; the documents themselves are kept by the browser

function makeTools(docs: Map<string, DocumentBrief>, signal: AbortSignal) {
  let weatherCalls = 0;
  const tooLong = `Too long: a document can have at most ${CHAT_LIMITS.maxDocumentLength.toLocaleString("en")} characters.`;
  const find = (id: string) => {
    const d = docs.get(id);
    if (!d) throw new Error(`There is no document with the id “${id}”.`);
    return d;
  };
  return {
    createDocument: tool({
      description: "Make a new document beside the chat. Write all of it in content.",
      inputSchema: z.object({
        kind: z.enum(KINDS).describe('"text" for writing (Markdown), "code" for a program, "sheet" for a table (CSV with a header row)'),
        title: z.string().max(120).describe("A short title"),
        language: z.string().max(30).optional().describe('Code only: the language, such as "javascript", "typescript" or "python"'),
        content: z.string().describe("The whole document"),
      }),
      execute: async ({ kind, title, language, content }): Promise<DocumentToolOutput> => {
        if (content.length > CHAT_LIMITS.maxDocumentLength) throw new Error(tooLong);
        if (docs.size >= CHAT_LIMITS.maxDocuments * 2) throw new Error("This conversation has as many documents as it can hold.");
        const id = `d${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
        docs.set(id, { id, kind, title, language: kind === "code" ? language : undefined, content, version: 1 });
        return { id, title, kind, version: 1 };
      },
    }),
    updateDocument: tool({
      description: "Replace a document with a new version, written in full.",
      inputSchema: z.object({
        id: z.string().describe("The document's id"),
        note: z.string().max(120).describe("What changed, in a few words"),
        content: z.string().describe("The whole new version"),
      }),
      execute: async ({ id, content }): Promise<DocumentToolOutput> => {
        const d = find(id);
        if (content.length > CHAT_LIMITS.maxDocumentLength) throw new Error(tooLong);
        docs.set(id, { ...d, content, version: d.version + 1 });
        return { id, title: d.title, kind: d.kind, version: d.version + 1 };
      },
    }),
    editDocument: tool({
      description: "Change one passage of a document. find must quote the document exactly, with enough words around the change to be unique.",
      inputSchema: z.object({
        id: z.string().describe("The document's id"),
        find: z.string().min(1).describe("The passage to change, quoted exactly"),
        replace: z.string().describe("What it becomes"),
        all: z.boolean().optional().describe("Change every place it occurs (default: only the first)"),
        note: z.string().max(120).optional().describe("What changed, in a few words"),
      }),
      execute: async ({ id, find: passage, replace, all }): Promise<DocumentToolOutput> => {
        const d = find(id);
        const edited = applyEdit(d.content, passage, replace, all);
        if (!edited) throw new Error("That passage isn't in the document. Quote it exactly, or use updateDocument.");
        if (edited.content.length > CHAT_LIMITS.maxDocumentLength) throw new Error(tooLong);
        docs.set(id, { ...d, content: edited.content, version: d.version + 1 });
        return { id, title: d.title, kind: d.kind, version: d.version + 1, replaced: edited.count };
      },
    }),
    requestSuggestions: tool({
      description: "Propose edits to a text document, which the person accepts or rejects one by one.",
      inputSchema: z.object({
        id: z.string().describe("The document's id"),
        suggestions: z
          .array(
            z.object({
              original: z.string().describe("A sentence or phrase of the document, quoted exactly"),
              replacement: z.string().describe("What it should say instead"),
              reason: z.string().max(300).describe("Why, in one short sentence"),
            }),
          )
          .min(1)
          .max(8),
      }),
      execute: async ({ id, suggestions }): Promise<DocumentToolOutput> => {
        const d = find(id);
        if (d.kind !== "text") throw new Error("Suggestions are for text documents.");
        const kept = keepSuggestions(d.content, suggestions);
        if (!kept.length) throw new Error("None of the suggestions quote the document exactly.");
        return { id, title: d.title, kind: d.kind, version: d.version, kept: kept.length };
      },
    }),
    getWeather: tool({
      description: "The weather now and for the next five days in a city.",
      inputSchema: z.object({ city: z.string().max(80).describe('The city, with its country if the name is common: "Portland, Maine"') }),
      execute: async ({ city }) => {
        if (++weatherCalls > CHAT_LIMITS.maxWeatherCalls) throw new Error(`At most ${CHAT_LIMITS.maxWeatherCalls} weather lookups per answer.`);
        try {
          return await weather(city, signal);
        } catch (e) {
          // Timeouts and network failures in plain words; nothing else of the error is passed on
          if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) throw new Error("The weather service took too long to answer.");
          if (e instanceof SyntaxError) throw new Error("The weather service sent something unreadable.");
          throw e instanceof Error && /^(The weather|No place|Which city)/.test(e.message) ? e : new Error("The weather service couldn't be reached.");
        }
      },
    }),
  };
}

// ---------------------------------------------------------------------------------------------

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return reply(503, "no-key");

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return reply(413, "too-big");
  const raw = await req.text();
  if (raw.length > MAX_BODY) return reply(413, "too-big");
  let body: { messages?: unknown; model?: unknown; think?: unknown; documents?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, "bad-request");
  }
  if (!isChatModel(body.model)) return reply(400, "bad-model");
  const model = body.model;
  const info = chatModel(model)!;
  const think = body.think !== false;
  const cleaned = clean(body.messages, info);
  if ("error" in cleaned) return reply(cleaned.error === "too-big" ? 413 : 400, cleaned.error, cleaned.message);
  const docs = cleanDocuments(body.documents);

  // "Thought for 4 s" counts from the request, as the reader waited: some models think in silence
  // and send their reasoning in one burst at the end
  const began = Date.now();
  let reportedCost = 0;
  let costKnown = true;
  const openrouter = createOpenRouter({ apiKey });
  const result = streamText({
    // Thinking gets a budget of its own on top of the answer's, since reasoning tokens count as
    // output. Off, it is asked for none: some models reason at length by default and never get to
    // the answer. A model that can't reason ignores this and answers. PDFs go to a model that
    // reads them as they are; for the others OpenRouter pulls out the text, with its free engine.
    model: openrouter.chat(model, {
      reasoning: think ? { max_tokens: CHAT_LIMITS.reasoningTokens } : { effort: "none" },
      ...(cleaned.pdf ? { plugins: [{ id: "file-parser" as const, pdf: { engine: info.reads.pdfs ? "native" : "pdf-text" } }] } : {}),
      // Costs come back with the usage
      usage: { include: true },
    }),
    instructions: INSTRUCTIONS + describeDocuments(docs),
    messages: toModelMessages(cleaned.messages),
    tools: makeTools(docs, req.signal),
    stopWhen: isStepCount(CHAT_LIMITS.maxSteps),
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
        if (part.type === "finish-step") {
          const cost = (part.providerMetadata?.openrouter as { usage?: { cost?: unknown } } | undefined)?.usage?.cost;
          if (typeof cost === "number") reportedCost += cost;
          else costKnown = false;
          return undefined;
        }
        if (part.type === "finish") {
          const u = part.totalUsage;
          const usage = { input: u.inputTokens ?? 0, output: u.outputTokens ?? 0, reasoning: u.outputTokenDetails?.reasoningTokens || undefined, cached: u.inputTokenDetails?.cacheReadTokens || undefined };
          return { finishReason: part.finishReason, usage, cost: costKnown ? reportedCost : chatCost(model, usage.input, usage.output) };
        }
        return undefined;
      },
    }),
  });
}
