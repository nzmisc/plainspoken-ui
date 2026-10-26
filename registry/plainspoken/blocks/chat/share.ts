// Sharing a conversation without a server: the conversation, made smaller (no files, no older
// versions of documents), as JSON compressed with the browser's CompressionStream and put after
// the # of the chat's address. The part after # never reaches a server, so nothing is uploaded:
// whoever opens the link reads it from the link itself.
import type { ChatArtifact, ChatConversation, ChatMessage, ChatPart } from "@/registry/plainspoken/blocks/chat/data";
import { isDocumentTool } from "@/registry/plainspoken/blocks/chat/artifacts";

/** The key after #: #share=… */
export const SHARE_KEY = "share";
/** Some apps cut links longer than this when they are pasted */
export const SHARE_WARN_BYTES = 8 * 1024;
/** Longer than this isn't offered as a link: browsers and servers start refusing them */
export const SHARE_MAX_BYTES = 256 * 1024;

export interface SharedConversation {
  v: 1;
  title: string;
  model: string;
  createdAt: number;
  messages: ChatMessage[];
  artifacts?: ChatArtifact[];
}

export interface ShareOptions {
  /** The latest version of each document */
  documents?: boolean;
  /** The model's reasoning */
  reasoning?: boolean;
}

/** A part as it goes in a link: files by name only, document text left to the documents */
function slim(p: ChatPart): ChatPart | null {
  if (p.type === "step-start") return null;
  if (p.type === "file") return { type: "file", mediaType: p.mediaType, filename: p.filename, url: "" };
  if (p.type.startsWith("tool-")) {
    const name = p.type.slice(5);
    const input = isDocumentTool(name) && p.input && typeof p.input === "object" ? { ...(p.input as Record<string, unknown>), content: undefined } : p.input;
    return { type: p.type, toolCallId: p.toolCallId, state: p.state, input, output: p.output, errorText: p.errorText };
  }
  return { type: p.type, text: p.text, state: "done" };
}

/** What a link holds */
export function sharedOf(c: ChatConversation, { documents = true, reasoning = false }: ShareOptions = {}): SharedConversation {
  const messages = c.messages.map((m) => ({
    id: m.id,
    role: m.role,
    metadata: m.metadata && { model: m.metadata.model, createdAt: m.metadata.createdAt, finishReason: m.metadata.finishReason, reasoningMs: m.metadata.reasoningMs, edited: m.metadata.edited, stopped: m.metadata.stopped },
    parts: m.parts.filter((p) => reasoning || p.type !== "reasoning").flatMap((p) => slim(p) ?? []),
  }));
  const artifacts = documents ? c.artifacts?.map((a) => ({ id: a.id, kind: a.kind, title: a.title, language: a.language, versions: [a.versions[a.versions.length - 1]].map((v) => ({ ...v, callId: undefined })) })) : undefined;
  return { v: 1, title: c.title, model: c.model, createdAt: c.createdAt, messages, artifacts: artifacts?.length ? artifacts : undefined };
}

const toBase64Url = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromBase64Url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Whether this browser can make and open links (CompressionStream is in every current one) */
export const canShare = () => typeof CompressionStream === "function" && typeof DecompressionStream === "function";

/** The text after #share= for a conversation */
export async function encodeShare(shared: SharedConversation): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(shared));
  return toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

/** A conversation back from the text after #share=, or null when it isn't one */
export async function decodeShare(text: string): Promise<SharedConversation | null> {
  try {
    if (text.length > SHARE_MAX_BYTES * 2) return null;
    const json = new TextDecoder().decode(await pipe(fromBase64Url(text), new DecompressionStream("deflate-raw")));
    const data = JSON.parse(json) as SharedConversation;
    if (data?.v !== 1 || typeof data.title !== "string" || !Array.isArray(data.messages)) return null;
    const messages = data.messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && Array.isArray(m.parts) && typeof m.id === "string");
    const artifacts = Array.isArray(data.artifacts) ? data.artifacts.filter((a) => a && typeof a.id === "string" && Array.isArray(a.versions) && a.versions.length > 0) : undefined;
    return { ...data, messages, artifacts };
  } catch {
    return null;
  }
}

/** The shared conversation in the address, if there is one */
export function shareInHash(hash: string): string | null {
  const m = new RegExp(`^#${SHARE_KEY}=([A-Za-z0-9_-]+)$`).exec(hash);
  return m ? m[1] : null;
}
