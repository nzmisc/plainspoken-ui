// What the chat blocks say about messages, conversations and errors. Plain functions with no React
// and no Date.now(): "today" is passed in, so the server and the browser render the same text.
import { daysBetween, makeDate, type ISODate } from "@/registry/plainspoken/lib/dates";
import type { ChatConversation, ChatError, ChatErrorCode, ChatMessage, ChatPart, ChatUsage } from "@/registry/plainspoken/blocks/chat/data";

/** The text of a message: its text parts (one for each step of an answer that used tools), joined as paragraphs */
export function messageText(m: ChatMessage): string {
  return m.parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!.trim())
    .join("\n\n");
}

/** The files of a message: attachments on a question, pictures an answer made */
export function messageFiles(m: ChatMessage): ChatPart[] {
  return m.parts.filter((p) => p.type === "file" && typeof p.url === "string");
}

/** A tool call's part: its type is "tool-" and the tool's name */
export const isToolPart = (p: ChatPart) => p.type.startsWith("tool-") && typeof p.toolCallId === "string";

/** The tool a part calls: "getWeather" for "tool-getWeather" */
export const toolName = (p: ChatPart) => p.type.slice("tool-".length);

/** A tool call that is still being written or run */
export const toolRunning = (p: ChatPart) => p.state === "input-streaming" || p.state === "input-available";

/** What the model thought before answering, if it said */
export function messageReasoning(m: ChatMessage): string {
  return m.parts
    .filter((p) => p.type === "reasoning")
    .map((p) => p.text ?? "")
    .join("\n\n")
    .trim();
}

/** A conversation's title from its first message: the first line, cut at a word near 48 characters */
export function titleFrom(text: string, max = 48): string {
  const line = text.trim().split("\n")[0].replace(/\s+/g, " ").replace(/^[#>*\-\s]+/, "");
  if (line.length <= max) return line || "New chat";
  const cut = line.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[,.;:!?-]+$/, "")}…`;
}

/** "4 s", "1 min 12 s", "under a second" */
export function formatSeconds(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 1) return "under a second";
  if (s < 60) return `${s} s`;
  return s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`;
}

/** The calendar date a timestamp falls on, where the viewer is */
export function localDate(t: number): ISODate {
  const d = new Date(t);
  return makeDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export interface ConversationGroup {
  key: string;
  heading: string;
  conversations: ChatConversation[];
}

const GROUPS = [
  { key: "today", heading: "Today" },
  { key: "yesterday", heading: "Yesterday" },
  { key: "week", heading: "Previous 7 days" },
  { key: "older", heading: "Older" },
] as const;

/**
 * Conversations newest first under Today, Yesterday, Previous 7 days and Older. Demo
 * conversations count their days from `demoToday` (the day they were written for) instead of
 * `today`. Without `today` (on the server, before the browser's date is known) they come in one
 * group, newest first.
 */
export function groupConversations(conversations: ChatConversation[], today: ISODate | null, demoToday?: ISODate): ConversationGroup[] {
  if (!today) {
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    return sorted.length ? [{ key: "all", heading: "Conversations", conversations: sorted }] : [];
  }
  const aged = conversations.map((c) => {
    const days = daysBetween(localDate(c.updatedAt), c.demo && demoToday ? demoToday : today);
    return { c, group: days <= 0 ? 0 : days === 1 ? 1 : days < 8 ? 2 : 3 };
  });
  return GROUPS.map((g, i) => ({
    ...g,
    conversations: aged
      .filter((a) => a.group === i)
      .map((a) => a.c)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  })).filter((g) => g.conversations.length > 0);
}

/** What each failure is called, and what to do about it */
export const CHAT_ERRORS: Record<ChatErrorCode, { title: string; body: string }> = {
  "no-key": { title: "No API key", body: "The server has no OPENROUTER_API_KEY, so it can't ask a model." },
  "bad-key": { title: "API key refused", body: "OpenRouter didn't accept the server's OPENROUTER_API_KEY." },
  credit: { title: "Out of credit", body: "The OpenRouter account behind this chat has run out of credit. Try again once it is topped up." },
  "rate-limit": { title: "Too many requests", body: "The model is getting more requests than it takes right now. Wait a moment, then try again." },
  network: { title: "Couldn't reach the server", body: "Check your connection, then try again." },
  refused: { title: "The model declined", body: "It stopped without answering, usually because of its content rules. Try asking another way, or another model." },
  "too-long": { title: "Too long to send", body: "That is more text than this chat sends in one go. Start a new chat, or shorten your message." },
  "too-big": { title: "Files too big", body: "The attached files are more than this chat sends in one go. Attach fewer or smaller files, or start a new chat." },
  "bad-model": { title: "Model not available", body: "That model isn't on this chat's list. Pick another one." },
  "bad-request": { title: "Couldn't send that", body: "The request wasn't understood. Try again, or start a new chat." },
  unavailable: { title: "The model is unavailable", body: "Its provider didn't answer. Try again in a minute, or pick another model." },
  unknown: { title: "Something went wrong", body: "The answer didn't come through. Try again." },
};

const CODES = new Set<string>(Object.keys(CHAT_ERRORS));

/**
 * The failure behind an error from useChat: the route sends `{ code, message }` as JSON, both as
 * an HTTP error body and inside the stream. A failed fetch (offline, server down) has no JSON.
 */
export function chatErrorOf(error: unknown): ChatError {
  const message = error instanceof Error ? error.message : String(error ?? "");
  try {
    const parsed = JSON.parse(message) as Partial<ChatError>;
    if (parsed && typeof parsed.code === "string" && CODES.has(parsed.code)) {
      return { code: parsed.code as ChatErrorCode, message: parsed.message ?? CHAT_ERRORS[parsed.code as ChatErrorCode].body };
    }
  } catch {
    // Not the route's JSON
  }
  if (/failed to fetch|networkerror|load failed|network/i.test(message)) return { code: "network", message: CHAT_ERRORS.network.body };
  return { code: "unknown", message: CHAT_ERRORS.unknown.body };
}

/** "1,204 tokens" style counts: 812, 1.2k, 34k */
export function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n / 1000)}k`;
}

/** Dollars, to the digit that matters: $0.0004, $0.012, $1.20 */
export function formatCost(dollars: number): string {
  if (dollars === 0) return "$0";
  if (dollars < 0.0001) return "under $0.0001";
  if (dollars < 0.01) return `$${dollars.toPrecision(1)}`;
  if (dollars < 1) return `$${dollars.toFixed(3).replace(/0$/, "")}`;
  return `$${dollars.toFixed(2)}`;
}

/** "1.2k in, 340 out" */
export function formatUsage(u: ChatUsage): string {
  return `${formatTokens(u.input)} in, ${formatTokens(u.output)} out${u.reasoning ? ` (${formatTokens(u.reasoning)} thinking)` : ""}`;
}

/**
 * Markdown as plain sentences, for reading aloud: no code, tables or formulas (they are named
 * instead), no marks, links as their words.
 */
export function speakable(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?(```|$)/g, " (a code block) ")
    .replace(/\$\$[\s\S]*?\$\$/g, " (a formula) ")
    .replace(/^\|.*\|\s*$/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+(?:\[[ x]\]\s+)?/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, "$2")
    .replace(/^-{3,}$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Whether a conversation has `query` in its title or any of its messages (case and accents aside) */
export function conversationMatches(c: ChatConversation, query: string): boolean {
  const fold = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const q = fold(query.trim());
  if (!q) return true;
  if (fold(c.title).includes(q)) return true;
  return c.messages.some((m) => fold(messageText(m)).includes(q) || m.parts.some((p) => p.filename && fold(p.filename).includes(q)));
}

/** Where the words of `query` first show in a conversation, as a short excerpt: for search results */
export function matchExcerpt(c: ChatConversation, query: string, width = 60): string | null {
  const q = query.trim().toLowerCase();
  if (!q || c.title.toLowerCase().includes(q)) return null;
  for (const m of c.messages) {
    const t = messageText(m).replace(/\s+/g, " ");
    const at = t.toLowerCase().indexOf(q);
    if (at < 0) continue;
    const start = Math.max(0, at - Math.floor((width - q.length) / 2));
    return `${start > 0 ? "…" : ""}${t.slice(start, start + width).trim()}${start + width < t.length ? "…" : ""}`;
  }
  return null;
}
