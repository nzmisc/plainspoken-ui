// A conversation out of the chat and back in: Markdown to read anywhere, JSON to import into
// another browser (with its files and documents). Plain functions; reading kept files back from
// the browser is passed in, so this file needs no React and no IndexedDB.
import type { ChatArtifact, ChatConversation, ChatMessage, ChatPart } from "@/registry/plainspoken/blocks/chat/data";
import { isToolPart, messageReasoning, toolName } from "@/registry/plainspoken/blocks/chat/format";
import { chatModelName, isChatModel, DEFAULT_CHAT_MODEL } from "@/registry/plainspoken/blocks/chat/models";
import { latestVersion } from "@/registry/plainspoken/blocks/chat/artifacts";

/** What a JSON export starts with, so an import can tell it from any other JSON */
export const CHAT_EXPORT_FORMAT = "plainspoken-chat";

export interface ChatExport {
  format: typeof CHAT_EXPORT_FORMAT;
  version: 1;
  exportedAt: number;
  conversation: ChatConversation;
}

/** A tool call in a few words, for Markdown and for the model's history: "[Tool: getWeather for Lisbon]" */
export function toolNote(p: ChatPart): string {
  const name = toolName(p);
  const input = (p.input && typeof p.input === "object" ? p.input : {}) as Record<string, unknown>;
  const output = (p.output && typeof p.output === "object" ? p.output : {}) as Record<string, unknown>;
  if (p.state === "output-error") return `[Tool: ${name} failed: ${p.errorText ?? "no reason given"}]`;
  if (name === "getWeather") {
    const now = output.current as { temperature?: number; code?: number } | undefined;
    const units = output.units as { temperature?: string } | undefined;
    const days = (output.daily as { date: string; max: number; min: number }[] | undefined) ?? [];
    const place = (output.place as { name?: string; country?: string } | undefined) ?? {};
    const where = [place.name ?? input.city, place.country].filter(Boolean).join(", ");
    const t = units?.temperature ?? "°C";
    const ahead = days.map((d) => `${d.date} ${Math.round(d.min)}–${Math.round(d.max)}${t}`).join("; ");
    return `[Tool: getWeather for ${where}: now ${now?.temperature ?? "?"}${t}, weather code ${now?.code ?? "?"}${ahead ? `; ${ahead}` : ""}]`;
  }
  if (name === "createDocument") return `[Tool: createDocument made ${input.kind ?? "text"} document ${output.id ?? "?"}, “${input.title ?? "Untitled"}”]`;
  if (name === "updateDocument" || name === "editDocument") return `[Tool: ${name} on document ${output.id ?? input.id ?? "?"}, now version ${output.version ?? "?"}${input.note ? `: ${input.note}` : ""}]`;
  if (name === "requestSuggestions") return `[Tool: requestSuggestions on document ${output.id ?? input.id ?? "?"}: ${output.kept ?? 0} suggestions]`;
  const short = (v: unknown) => {
    const s = JSON.stringify(v) ?? "";
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  };
  return `[Tool: ${name}(${short(p.input)}) → ${short(p.output)}]`;
}

const fence = (text: string, lang = "") => {
  const ticks = "`".repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map((m) => m[0].length + 1)));
  return `${ticks}${lang}\n${text}\n${ticks}`;
};

function documentMarkdown(a: ChatArtifact): string {
  const v = latestVersion(a);
  const head = `### ${a.title} (version ${a.versions.length})`;
  if (a.kind === "code") return `${head}\n\n${fence(v.content, a.language ?? "")}`;
  if (a.kind === "sheet") return `${head}\n\n${fence(v.content, "csv")}`;
  return `${head}\n\n${v.content}`;
}

/** The conversation as Markdown: each message under who said it, then the documents' latest versions */
export function conversationMarkdown(c: ChatConversation, { reasoning = false }: { reasoning?: boolean } = {}): string {
  const out: string[] = [`# ${c.title}`, ""];
  for (const m of c.messages) {
    if (m.role === "system") continue;
    out.push(m.role === "user" ? "## You" : `## ${chatModelName(m.metadata?.model ?? c.model)}`, "");
    if (reasoning && m.role === "assistant") {
      const r = messageReasoning(m);
      if (r) out.push(r.split("\n").map((l) => `> ${l}`).join("\n"), "");
    }
    for (const p of m.parts) {
      if (p.type === "text" && p.text) out.push(p.text, "");
      else if (p.type === "file") out.push(`*Attached: ${p.filename ?? "a file"}*`, "");
      else if (isToolPart(p)) out.push(`*${toolNote(p).slice(1, -1)}*`, "");
    }
  }
  if (c.artifacts?.length) {
    out.push("## Documents", "");
    for (const a of c.artifacts) out.push(documentMarkdown(a), "");
  }
  return `${out.join("\n").trim()}\n`;
}

/** The conversation as JSON, its kept files read back into it (`read` gives a data: URL, or null when it is gone) */
export async function conversationJson(c: ChatConversation, read: (url: string) => Promise<string | null>): Promise<string> {
  const withFiles = async (m: ChatMessage): Promise<ChatMessage> => ({
    ...m,
    parts: await Promise.all(m.parts.map(async (p) => (p.type === "file" && p.url ? { ...p, url: (await read(p.url)) ?? p.url } : p))),
  });
  const stash = c.tree ? Object.fromEntries(await Promise.all(Object.entries(c.tree.stash).map(async ([id, m]) => [id, await withFiles(m)] as const))) : undefined;
  const conversation: ChatConversation = {
    ...c,
    demo: undefined,
    messages: await Promise.all(c.messages.map(withFiles)),
    tree: c.tree && stash ? { ...c.tree, stash } : undefined,
  };
  const data: ChatExport = { format: CHAT_EXPORT_FORMAT, version: 1, exportedAt: Date.now(), conversation };
  return JSON.stringify(data, null, 1);
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function cleanMessage(m: unknown): ChatMessage | null {
  if (!isObject(m) || typeof m.id !== "string" || (m.role !== "user" && m.role !== "assistant") || !Array.isArray(m.parts)) return null;
  // A file's address must be its own data, or a file on this site: nothing that loads from elsewhere
  const safe = (url: unknown) => (typeof url === "string" && (url.startsWith("data:") || (url.startsWith("/") && !url.startsWith("//"))) ? url : "");
  const parts = m.parts
    .filter((p): p is ChatPart => isObject(p) && typeof p.type === "string")
    .map((p) => (p.type === "file" ? { ...p, url: safe(p.url) } : p));
  return { id: m.id, role: m.role, parts, metadata: isObject(m.metadata) ? (m.metadata as ChatMessage["metadata"]) : undefined };
}

/**
 * A conversation from an exported file's text, checked: the messages that make sense, a known
 * model, and a new id when `taken` says this one is in use. Throws with a reason people can read.
 */
export function parseImport(text: string, taken: (id: string) => boolean, newId: () => string): ChatConversation {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't JSON.");
  }
  if (!isObject(data) || data.format !== CHAT_EXPORT_FORMAT || !isObject(data.conversation)) throw new Error("This file isn't a conversation exported from this chat.");
  const c = data.conversation;
  const messages = Array.isArray(c.messages) ? c.messages.map(cleanMessage).filter((m): m is ChatMessage => !!m) : [];
  if (!messages.length) throw new Error("This conversation has no messages.");
  const now = Date.now();
  const id = typeof c.id === "string" && !taken(c.id) ? c.id : newId();
  const t = c.tree;
  const tree =
    isObject(t) && isObject(t.children) && isObject(t.chosen) && isObject(t.stash)
      ? {
          children: t.children as Record<string, string[]>,
          chosen: t.chosen as Record<string, string>,
          stash: Object.fromEntries(Object.entries(t.stash).flatMap(([k, m]) => (cleanMessage(m) ? [[k, cleanMessage(m)!]] : []))),
        }
      : undefined;
  return {
    id,
    title: typeof c.title === "string" && c.title.trim() ? c.title.trim().slice(0, 120) : "Imported conversation",
    model: isChatModel(c.model) ? c.model : DEFAULT_CHAT_MODEL,
    createdAt: typeof c.createdAt === "number" ? c.createdAt : now,
    updatedAt: now,
    messages,
    pinned: c.pinned === true || undefined,
    tree,
    artifacts: Array.isArray(c.artifacts) ? (c.artifacts.filter((a) => isObject(a) && typeof a.id === "string" && Array.isArray(a.versions) && a.versions.length) as ChatArtifact[]) : undefined,
  };
}

/** A file name from a title: "Launch plan for Tidewater.md" */
export function exportFileName(title: string, ext: string): string {
  const base = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Conversation";
  return `${base}.${ext}`;
}
