"use client";

// Files attached to a question: read in the browser, pictures made smaller, and kept in the
// browser's IndexedDB once sent (localStorage is far too small for them), so a conversation opened
// again still shows them and can send them again. The messages themselves only hold
// "attachment:<id>" for a kept file. Nothing is uploaded anywhere but to the chat route, inside
// the request.
import { useEffect, useState } from "react";
import { CHAT_IMAGE_SIDE, CHAT_LIMITS } from "@/registry/plainspoken/blocks/chat/models";
import type { ChatPart } from "@/registry/plainspoken/blocks/chat/data";

/** A file on its way into a message */
export interface ChatAttachment {
  id: string;
  name: string;
  /** Its media type as sent: pictures made smaller become JPEG or WebP */
  mediaType: string;
  /** Bytes, as sent */
  size: number;
  /** A data: URL once read */
  url?: string;
  status: "reading" | "ready" | "error";
  /** Why it can't be sent */
  error?: string;
}

/** What a file is to the chat: a picture, a PDF, or text (put into the message), or null for what it can't take */
export type AttachmentKind = "image" | "pdf" | "text";

const TEXT_EXT: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  json: "application/json",
  xml: "application/xml",
  yaml: "application/yaml",
  yml: "application/yaml",
  toml: "application/toml",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  jsx: "text/javascript",
  ts: "text/x-typescript",
  tsx: "text/x-typescript",
  py: "text/x-python",
  rb: "text/x-ruby",
  go: "text/x-go",
  rs: "text/x-rust",
  java: "text/x-java",
  kt: "text/x-kotlin",
  swift: "text/x-swift",
  c: "text/x-c",
  h: "text/x-c",
  cpp: "text/x-c++",
  cs: "text/x-csharp",
  php: "text/x-php",
  sh: "text/x-shellscript",
  sql: "application/sql",
  log: "text/plain",
  ini: "text/plain",
  env: "text/plain",
};
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const TEXT_TYPES = new Set(Object.values(TEXT_EXT));

/** For the file picker: pictures, PDFs and text files */
export const ATTACHMENT_ACCEPT = [...IMAGE_TYPES, "application/pdf", "text/*", ...Object.keys(TEXT_EXT).map((e) => `.${e}`)].join(",");

const extension = (name: string) => /\.([a-z0-9]+)$/i.exec(name)?.[1].toLowerCase() ?? "";

/** The kind of a file, and the media type to send it as */
export function attachmentKind(file: { name: string; type: string }): { kind: AttachmentKind; mediaType: string } | null {
  const type = file.type.toLowerCase();
  if (IMAGE_TYPES.includes(type)) return { kind: "image", mediaType: type };
  if (type === "application/pdf" || extension(file.name) === "pdf") return { kind: "pdf", mediaType: "application/pdf" };
  const byExt = TEXT_EXT[extension(file.name)];
  if (byExt) return { kind: "text", mediaType: byExt };
  if (type.startsWith("text/") || TEXT_TYPES.has(type)) return { kind: "text", mediaType: type };
  return null;
}

/** The kind of a part's file, from its media type */
export function partKind(p: Pick<ChatPart, "mediaType" | "filename">): AttachmentKind | "other" {
  return attachmentKind({ name: p.filename ?? "", type: p.mediaType ?? "" })?.kind ?? "other";
}

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("Couldn't read the file"));
    r.readAsDataURL(blob);
  });

/** Bytes in a data: URL */
export function dataUrlBytes(url: string): number {
  const comma = url.indexOf(",");
  if (comma < 0 || !url.slice(0, comma).endsWith(";base64")) return url.length - comma - 1;
  const b64 = url.length - comma - 1;
  return Math.floor((b64 * 3) / 4) - (url.endsWith("==") ? 2 : url.endsWith("=") ? 1 : 0);
}

/**
 * A picture no bigger than CHAT_IMAGE_SIDE on its longest side: the models see no more detail
 * than that, and it keeps requests small. GIFs stay as they are (they may move).
 */
async function smaller(file: File, mediaType: string): Promise<Blob> {
  if (mediaType === "image/gif" || typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, CHAT_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // PNGs may be see-through: WebP keeps that; photos go to JPEG
  const type = mediaType === "image/png" ? "image/webp" : "image/jpeg";
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), type, 0.86));
}

let seq = 0;
const newId = () => `a${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Reads a file for sending: checked, a picture made smaller, as a data: URL */
export async function readAttachment(file: File): Promise<ChatAttachment> {
  const id = newId();
  const kind = attachmentKind(file);
  const base = { id, name: file.name || "pasted-file", mediaType: kind?.mediaType ?? file.type, size: file.size };
  if (!kind) return { ...base, status: "error", error: "This kind of file can't be sent: attach pictures, PDFs or text files." };
  try {
    const blob = kind.kind === "image" ? await smaller(file, kind.mediaType) : file;
    if (blob.size > CHAT_LIMITS.maxFileBytes) return { ...base, size: blob.size, status: "error", error: `Too big: files can be up to ${CHAT_LIMITS.maxFileBytes / 1024 / 1024} MB.` };
    const mediaType = blob === file ? kind.mediaType : blob.type;
    // A pasted picture is called "image.png" by every browser; give it a name of its own
    const name = file.name && !/^image\.(png|jpe?g|gif|webp)$/i.test(file.name) ? file.name : `pasted-${id.slice(-4)}.${mediaType.split("/")[1]}`;
    const url = await readAsDataUrl(blob.type === mediaType ? blob : new Blob([blob], { type: mediaType }));
    const renamed = blob !== file && kind.kind === "image" ? name.replace(/\.(png|jpe?g|webp)$/i, mediaType === "image/webp" ? ".webp" : ".jpg") : name;
    return { ...base, name: renamed, mediaType, size: blob.size, url, status: "ready" };
  } catch {
    return { ...base, status: "error", error: "This file couldn't be read." };
  }
}

// ---------------------------------------------------------------------------------------------
// Keeping files: IndexedDB, one store of data: URLs by id

const DB_NAME = "plainspoken-chat";
const STORE = "attachments";
let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("No IndexedDB"));
  return (dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  }));
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = run(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** Data URLs waiting to be kept, and the ids they are kept under, so a message is saved with the id */
const keptIds = new Map<string, string>();
const memory = new Map<string, string>();

/** Keeps a file's data: URL and gives the address to store in its place */
export function keepAttachment(url: string, id = newId()): string {
  const known = keptIds.get(url);
  if (known) return `attachment:${known}`;
  keptIds.set(url, id);
  memory.set(id, url);
  void tx("readwrite", (s) => s.put(url, id)).catch(() => {});
  return `attachment:${id}`;
}

/** The address to store for a file part: attachment:<id> for a data: URL that is kept */
export function storedUrl(url: string): string {
  if (!url.startsWith("data:")) return url;
  return keepAttachment(url);
}

/** A kept file's data: URL, or null when this browser no longer has it */
export async function loadAttachment(id: string): Promise<string | null> {
  const hit = memory.get(id);
  if (hit) return hit;
  try {
    const url = await tx<string | undefined>("readonly", (s) => s.get(id) as IDBRequest<string | undefined>);
    if (url) memory.set(id, url);
    return url ?? null;
  } catch {
    return null;
  }
}

/** Forget kept files (a deleted conversation's) */
export function forgetAttachments(urls: string[]) {
  for (const u of urls) {
    if (!u.startsWith("attachment:")) continue;
    const id = u.slice("attachment:".length);
    memory.delete(id);
    void tx("readwrite", (s) => s.delete(id)).catch(() => {});
  }
}

/**
 * A file part's address as something to send: a data: URL (a kept file is read back, a file on
 * this site is fetched), or null when it is gone.
 */
export async function sendableUrl(url: string): Promise<string | null> {
  if (url.startsWith("data:")) return url;
  if (url.startsWith("attachment:")) return loadAttachment(url.slice("attachment:".length));
  if (url.startsWith("/") && !url.startsWith("//")) {
    try {
      const res = await fetch(url);
      return res.ok ? await readAsDataUrl(await res.blob()) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * A file part's address for <img src> or a download: the address itself, or once read, a kept
 * file's data. `missing` is true when the browser no longer has it.
 */
export function useAttachmentUrl(url: string | undefined): { src: string | null; missing: boolean } {
  const kept = url?.startsWith("attachment:") ? url.slice("attachment:".length) : null;
  const [loaded, setLoaded] = useState<{ id: string; src: string | null } | null>(null);
  useEffect(() => {
    if (!kept) return;
    let live = true;
    void loadAttachment(kept).then((src) => live && setLoaded({ id: kept, src }));
    return () => {
      live = false;
    };
  }, [kept]);
  if (!url) return { src: null, missing: true };
  if (!kept) return { src: url, missing: false };
  const hit = memory.get(kept) ?? (loaded?.id === kept ? loaded.src : null);
  return { src: hit, missing: loaded?.id === kept && !loaded.src };
}

/** Starts a download of a data: URL or address under a file name */
export function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}

/** Starts a download of text */
export function downloadText(text: string, name: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  download(url, name);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
