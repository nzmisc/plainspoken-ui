// What the chat blocks say about messages, conversations and errors. Plain functions with no React
// and no Date.now(): "today" is passed in, so the server and the browser render the same text.
import { daysBetween, makeDate, type ISODate } from "@/registry/plainspoken/lib/dates";
import type { ChatConversation, ChatError, ChatErrorCode, ChatMessage } from "@/registry/plainspoken/blocks/chat/data";

/** The text of a message: its text parts, joined */
export function messageText(m: ChatMessage): string {
  return m.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

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
