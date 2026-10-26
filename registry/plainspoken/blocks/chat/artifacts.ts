// Documents the model writes with its tools, as plain functions shared by the route and the app.
// The model writes a document's whole text as the input of a tool call (so it streams into the
// panel as it is written); the route checks the call and answers with an id and a version, and the
// browser keeps every version. Nothing is stored on the server: each request carries the latest
// version of the conversation's documents, so the model can change them.
import type { ChatArtifact, ChatArtifactKind, ChatArtifactVersion, ChatEditSuggestion, ChatPart } from "@/registry/plainspoken/blocks/chat/data";

/** The document tools, by name */
export const DOCUMENT_TOOLS = ["createDocument", "updateDocument", "editDocument", "requestSuggestions"] as const;
export type DocumentTool = (typeof DOCUMENT_TOOLS)[number];

export const isDocumentTool = (name: string): name is DocumentTool => (DOCUMENT_TOOLS as readonly string[]).includes(name);

/** What a request tells the model about a document: its latest version */
export interface DocumentBrief {
  id: string;
  kind: ChatArtifactKind;
  title: string;
  language?: string;
  content: string;
  /** 1 for the first */
  version: number;
}

/** The inputs of the document tools, as the model writes them (partly, while it streams) */
export interface CreateDocumentInput {
  kind?: ChatArtifactKind;
  title?: string;
  language?: string;
  content?: string;
}
export interface UpdateDocumentInput {
  id?: string;
  content?: string;
  note?: string;
}
export interface EditDocumentInput {
  id?: string;
  find?: string;
  replace?: string;
  all?: boolean;
  note?: string;
}
export interface RequestSuggestionsInput {
  id?: string;
  suggestions?: { original?: string; replacement?: string; reason?: string }[];
}

/** What the route answers a document tool with */
export interface DocumentToolOutput {
  id: string;
  title?: string;
  kind?: ChatArtifactKind;
  version?: number;
  /** editDocument: how many places changed */
  replaced?: number;
  /** requestSuggestions: how many were kept (each must quote the document exactly) */
  kept?: number;
  error?: string;
}

/** Replaces `find` (the first time, or every time) in a document; null when it isn't there */
export function applyEdit(content: string, find: string, replace: string, all = false): { content: string; count: number } | null {
  if (!find || !content.includes(find)) return null;
  if (!all) return { content: content.replace(find, () => replace), count: 1 };
  const count = content.split(find).length - 1;
  return { content: content.split(find).join(replace), count };
}

/** The suggestions that quote the document word for word and change something, at most `max` */
export function keepSuggestions(content: string, list: RequestSuggestionsInput["suggestions"], max = 8): Omit<ChatEditSuggestion, "id">[] {
  const out: Omit<ChatEditSuggestion, "id">[] = [];
  for (const s of list ?? []) {
    if (out.length >= max) break;
    const original = s?.original ?? "";
    const replacement = s?.replacement ?? "";
    if (!original.trim() || original === replacement || !content.includes(original)) continue;
    if (out.some((o) => o.original === original)) continue;
    out.push({ original, replacement, reason: (s?.reason ?? "").slice(0, 300) });
  }
  return out;
}

export const latestVersion = (a: ChatArtifact): ChatArtifactVersion => a.versions[a.versions.length - 1];

/** The latest versions, newest documents first, within the limits on what the model is shown */
export function documentBriefs(artifacts: ChatArtifact[], maxDocuments: number, maxChars: number): DocumentBrief[] {
  const out: DocumentBrief[] = [];
  let chars = 0;
  for (const a of [...artifacts].reverse()) {
    if (out.length >= maxDocuments) break;
    const content = latestVersion(a).content;
    if (chars + content.length > maxChars) continue;
    chars += content.length;
    out.push({ id: a.id, kind: a.kind, title: a.title, language: a.language, content, version: a.versions.length });
  }
  return out;
}

const objectInput = <T>(p: ChatPart): T => (p.input && typeof p.input === "object" ? (p.input as T) : ({} as T));
const outputOf = (p: ChatPart): DocumentToolOutput | null =>
  p.output && typeof p.output === "object" && typeof (p.output as DocumentToolOutput).id === "string" ? (p.output as DocumentToolOutput) : null;

/**
 * The documents after a finished document tool call: a new document, a new version, or new
 * suggestions. A call is applied once (the version remembers its call id), and a call that failed
 * or was refused changes nothing.
 */
export function applyToolCall(artifacts: ChatArtifact[], part: ChatPart, now: number): ChatArtifact[] {
  const name = part.type.slice("tool-".length);
  const out = outputOf(part);
  if (part.state !== "output-available" || !out || out.error || !isDocumentTool(name)) return artifacts;
  const callId = part.toolCallId!;
  if (artifacts.some((a) => a.versions.some((v) => v.callId === callId) || (name === "requestSuggestions" && a.suggestions?.some((s) => s.id.startsWith(`${callId}:`))))) {
    return artifacts;
  }
  const at = artifacts.findIndex((a) => a.id === out.id);
  const version = (content: string, note?: string): ChatArtifactVersion => ({ content, by: "model", note, createdAt: now, callId });

  if (name === "createDocument") {
    if (at >= 0) return artifacts;
    const input = objectInput<CreateDocumentInput>(part);
    const kind = input.kind === "code" || input.kind === "sheet" ? input.kind : "text";
    return [
      ...artifacts,
      { id: out.id, kind, title: input.title?.trim() || "Untitled", language: kind === "code" ? (input.language || "text").toLowerCase() : undefined, versions: [version(input.content ?? "")] },
    ];
  }
  if (at < 0) return artifacts;
  const doc = artifacts[at];
  const replace = (next: ChatArtifact) => artifacts.map((a, i) => (i === at ? next : a));
  if (name === "updateDocument") {
    const input = objectInput<UpdateDocumentInput>(part);
    return replace({ ...doc, versions: [...doc.versions, version(input.content ?? "", input.note)] });
  }
  if (name === "editDocument") {
    const input = objectInput<EditDocumentInput>(part);
    const edited = applyEdit(latestVersion(doc).content, input.find ?? "", input.replace ?? "", input.all);
    if (!edited) return artifacts;
    return replace({ ...doc, versions: [...doc.versions, version(edited.content, input.note ?? "A small edit")] });
  }
  // requestSuggestions: they apply to the latest version
  const input = objectInput<RequestSuggestionsInput>(part);
  const kept = keepSuggestions(latestVersion(doc).content, input.suggestions).map((s, i) => ({ ...s, id: `${callId}:${i}` }));
  return replace({ ...doc, suggestions: kept, suggestionsFor: doc.versions.length - 1 });
}

/** A document as a tool call is still writing it, for the panel to show as it arrives */
export interface ArtifactDraft {
  callId: string;
  tool: DocumentTool;
  /** The document being changed, once known */
  id?: string;
  kind?: ChatArtifactKind;
  title?: string;
  language?: string;
  /** The text so far (createDocument and updateDocument) */
  content?: string;
}

/** The draft in a tool call that is still being written, or null */
export function draftOf(part: ChatPart, artifacts: ChatArtifact[]): ArtifactDraft | null {
  const name = part.type.slice("tool-".length);
  if (!isDocumentTool(name) || (part.state !== "input-streaming" && part.state !== "input-available")) return null;
  if (name === "createDocument") {
    const input = objectInput<CreateDocumentInput>(part);
    return { callId: part.toolCallId!, tool: name, kind: input.kind, title: input.title, language: input.language, content: input.content };
  }
  const input = objectInput<UpdateDocumentInput>(part);
  const doc = artifacts.find((a) => a.id === input.id);
  return {
    callId: part.toolCallId!,
    tool: name,
    id: input.id,
    kind: doc?.kind,
    title: doc?.title,
    language: doc?.language,
    content: name === "updateDocument" ? input.content : undefined,
  };
}

/**
 * The document with your change: a version of your own after the model's last one is changed in
 * place (so a run of edits is one version), otherwise a new version of yours is added.
 */
export function withYourEdit(a: ChatArtifact, content: string, note: string, now: number): ChatArtifact {
  const last = latestVersion(a);
  if (last.content === content) return a;
  if (last.by === "you" && last.note === note) {
    return { ...a, versions: [...a.versions.slice(0, -1), { ...last, content, createdAt: now }] };
  }
  return { ...a, versions: [...a.versions, { content, by: "you", note, createdAt: now }] };
}

/** An older version, made the latest again (as a new version, so nothing is lost) */
export function restoreVersion(a: ChatArtifact, index: number, now: number): ChatArtifact {
  const v = a.versions[index];
  if (!v || index === a.versions.length - 1) return a;
  return { ...a, versions: [...a.versions, { content: v.content, by: "you", note: `Restored version ${index + 1}`, createdAt: now }] };
}

/** Accept (apply it to the document as your edit) or reject a suggestion */
export function resolveSuggestion(a: ChatArtifact, id: string, accept: boolean, now: number): ChatArtifact {
  const s = a.suggestions?.find((x) => x.id === id);
  if (!s || s.status) return a;
  const suggestions = a.suggestions!.map((x) => (x.id === id ? { ...x, status: accept ? ("accepted" as const) : ("rejected" as const) } : x));
  if (!accept) return { ...a, suggestions };
  const edited = applyEdit(latestVersion(a).content, s.original, s.replacement);
  if (!edited) return { ...a, suggestions: a.suggestions!.map((x) => (x.id === id ? { ...x, status: "rejected" as const } : x)) };
  const next = withYourEdit(a, edited.content, "Accepted suggestions", now);
  // The suggestions stay with the version they now belong to
  return { ...next, suggestions, suggestionsFor: next.versions.length - 1 };
}

/** The suggestions still open on the latest version */
export function openSuggestions(a: ChatArtifact): ChatEditSuggestion[] {
  if (a.suggestionsFor !== a.versions.length - 1) return [];
  const content = latestVersion(a).content;
  return (a.suggestions ?? []).filter((s) => !s.status && content.includes(s.original));
}

// ---------------------------------------------------------------------------------------------
// CSV, for sheets

/** Rows of cells from CSV (RFC 4180: quoted cells may hold commas, quotes and line breaks) */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  // Every row as wide as the widest, blank lines dropped
  const width = Math.max(0, ...rows.map((r) => r.length));
  return rows.filter((r) => r.some((c) => c.trim() !== "")).map((r) => [...r, ...Array<string>(width - r.length).fill("")]);
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) || /^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Rows of cells as CSV, quoted where needed, lines ending in \n */
export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

/** A number as a sheet writes it: "1,200.50", "$40", "12%" and "(300)" read as numbers */
export function sheetNumber(v: string): number | null {
  const t = v.trim().replace(/^\((.*)\)$/, "-$1").replace(/[$€£,\s%]/g, "");
  if (!t || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(t)) return null;
  return Number(t);
}

// ---------------------------------------------------------------------------------------------
// Files

const EXT: Record<string, string> = {
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  tsx: "tsx",
  jsx: "jsx",
  python: "py",
  py: "py",
  rust: "rs",
  go: "go",
  ruby: "rb",
  java: "java",
  kotlin: "kt",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  csharp: "cs",
  "c#": "cs",
  php: "php",
  sql: "sql",
  bash: "sh",
  shell: "sh",
  sh: "sh",
  html: "html",
  css: "css",
  json: "json",
  yaml: "yaml",
  toml: "toml",
  markdown: "md",
};

/** A file name for a document: its title in lowercase words, and the extension for its kind */
export function artifactFileName(a: Pick<ChatArtifact, "title" | "kind" | "language">): string {
  const base =
    a.title
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "document";
  const ext = a.kind === "sheet" ? "csv" : a.kind === "text" ? "md" : (EXT[(a.language ?? "").toLowerCase()] ?? "txt");
  return `${base}.${ext}`;
}

/** The media type a document downloads as */
export function artifactMediaType(a: Pick<ChatArtifact, "kind">): string {
  return a.kind === "sheet" ? "text/csv" : a.kind === "text" ? "text/markdown" : "text/plain";
}

/** Code the Run button can run: JavaScript, and TypeScript once its types are stripped */
export function runnable(language: string | undefined): "js" | "ts" | null {
  const l = (language ?? "").toLowerCase();
  if (["js", "javascript", "mjs", "jsx"].includes(l)) return "js";
  if (["ts", "typescript", "tsx"].includes(l)) return "ts";
  return null;
}
