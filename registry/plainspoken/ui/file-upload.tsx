"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from "react";
import { CircleCheck, CircleX, RotateCw } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { useFieldProps } from "@/registry/plainspoken/ui/field";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Where a file is: being sent, sent, failed on the way, refused before sending (wrong type, too
 * big, one too many), stopped by the user, or (without an upload function) kept for the form.
 */
export type UploadStatus = "ready" | "uploading" | "done" | "failed" | "rejected" | "canceled";

export interface UploadItem {
  id: string;
  name: string;
  /** Bytes */
  size: number;
  /** MIME type, "" when the browser doesn't know */
  type: string;
  status: UploadStatus;
  /** 0–1 */
  progress: number;
  /** Why it failed or was rejected, in words */
  error?: string;
  file?: File;
}

/**
 * Sends one file and resolves when the server has it; rejects (with an Error whose message is
 * shown) when it fails. Call onProgress with 0–1 as bytes go out, and stop when the signal aborts
 * (the user pressed Cancel or removed the file). XMLHttpRequest has upload progress events;
 * fetch has none, so with fetch just resolve at the end.
 */
export type UploadFunction = (file: File, options: { signal: AbortSignal; onProgress: (fraction: number) => void }) => Promise<void>;

interface Rules {
  /** Same syntax as <input accept>: ".pdf,image/*,application/json" */
  accept?: string;
  /** Bytes */
  maxSize?: number;
}

/** Bytes for people: 812 B, 3.2 KiB, 248 KiB, 1.3 MiB, 2.4 GiB. */
export function formatSize(n: number): string {
  const f = (v: number, digits: number) => v.toFixed(digits).replace(/\.0$/, "");
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${f(n / 1024, n < 10 * 1024 ? 1 : 0)} KiB`;
  if (n < 1024 ** 3) return `${f(n / 1024 ** 2, n < 10 * 1024 ** 2 ? 1 : 0)} MiB`;
  return `${f(n / 1024 ** 3, 1)} GiB`;
}

function matchesAccept(file: { name: string; type: string }, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? file.type.startsWith(a.slice(0, -1)) : file.type === a));
}

/** An accept string in plain words: ".pdf,image/*" → "PDF, images". */
export function describeAccept(accept?: string): string {
  if (!accept) return "any type";
  return accept
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((a) => (a.startsWith(".") ? a.slice(1).toUpperCase() : a.endsWith("/*") ? `${a.slice(0, -2)}s` : a))
    .join(", ");
}

let seq = 0;
function checkFile(file: File, rules: Rules, canUpload: boolean): UploadItem {
  const base = { id: `upload-${++seq}`, name: file.name || "pasted file", size: file.size, type: file.type, progress: 0, file };
  if (!matchesAccept(file, rules.accept)) return { ...base, status: "rejected", error: `Not an accepted type (${describeAccept(rules.accept)})` };
  if (rules.maxSize != null && file.size > rules.maxSize)
    return { ...base, status: "rejected", error: `Too large: ${formatSize(file.size)}, the limit is ${formatSize(rules.maxSize)}` };
  return { ...base, status: canUpload ? "uploading" : "ready" };
}

/**
 * The list of files and the uploads running for them. Each upload gets its own AbortController;
 * cancel and remove abort it, retry starts a new one. Progress never goes backwards.
 */
function useUploads(
  initial: UploadItem[],
  upload: UploadFunction | undefined,
  onItemsChange: ((items: UploadItem[]) => void) | undefined,
  handOver?: { onUploaded?: (item: UploadItem) => void; clearOnDone?: boolean },
) {
  const [items, setItems] = useState(initial);
  const running = useRef(new Map<string, AbortController>());
  // Read when an upload finishes, which can be many renders after it started
  const latest = useRef(handOver);
  useEffect(() => {
    latest.current = handOver;
  });
  const update = (id: string, f: (i: UploadItem) => UploadItem) => setItems((l) => l.map((i) => (i.id === id ? f(i) : i)));

  const start = (item: UploadItem) => {
    if (!upload || !item.file) return;
    running.current.get(item.id)?.abort();
    const ctl = new AbortController();
    running.current.set(item.id, ctl);
    const live = (f: (i: UploadItem) => UploadItem) => {
      if (!ctl.signal.aborted) update(item.id, (i) => (i.status === "uploading" ? f(i) : i));
    };
    upload(item.file, { signal: ctl.signal, onProgress: (fr) => live((i) => ({ ...i, progress: Math.max(i.progress, Math.min(1, Math.max(0, fr))) })) }).then(
      () => {
        if (ctl.signal.aborted) return;
        const h = latest.current;
        running.current.delete(item.id);
        if (h?.clearOnDone) setItems((l) => l.filter((i) => i.id !== item.id));
        else live((i) => ({ ...i, status: "done", progress: 1 }));
        h?.onUploaded?.({ ...item, status: "done", progress: 1, error: undefined });
      },
      (e: unknown) => live((i) => ({ ...i, status: "failed", error: e instanceof Error && e.message ? e.message : "Upload failed" })),
    );
  };

  // Files that start out uploading (with a File to send) start now; leaving aborts whatever runs.
  const startInitial = useEffectEvent(() => {
    for (const i of items) if (i.status === "uploading") start(i);
  });
  useEffect(() => {
    const map = running.current;
    startInitial();
    return () => {
      for (const c of map.values()) c.abort();
      map.clear();
    };
  }, []);

  const notify = useEffectEvent((list: UploadItem[]) => onItemsChange?.(list));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    notify(items);
  }, [items]);

  const stop = (id: string) => {
    running.current.get(id)?.abort();
    running.current.delete(id);
  };
  return {
    items,
    /** Adds checked items and starts the uploads among them */
    add: (incoming: UploadItem[], replace: boolean) => {
      if (replace) for (const i of items) stop(i.id);
      setItems((l) => (replace ? incoming : [...l, ...incoming]));
      for (const i of incoming) if (i.status === "uploading") start(i);
    },
    cancel: (id: string) => {
      stop(id);
      update(id, (i) => ({ ...i, status: "canceled" }));
    },
    retry: (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const next = { ...item, status: "uploading" as const, progress: 0, error: undefined };
      update(id, () => next);
      start(next);
    },
    remove: (id: string) => {
      stop(id);
      setItems((l) => l.filter((i) => i.id !== id));
    },
    clearFinished: () => setItems((l) => l.filter((i) => i.status === "uploading")),
  };
}

/** Drag state for an element. Counts enter/leave pairs, so moving over child elements doesn't make it flicker. */
function useDropTarget(onFiles: (files: File[]) => void, disabled?: boolean) {
  const [over, setOver] = useState(0); // files being dragged over it; 0 = none
  const depth = useRef(0);
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
  return {
    over,
    props: {
      onDragEnter: (e: DragEvent) => {
        if (disabled || !hasFiles(e)) return;
        e.preventDefault();
        depth.current++;
        setOver(Math.max(1, e.dataTransfer.items.length));
      },
      onDragOver: (e: DragEvent) => {
        if (disabled || !hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      },
      onDragLeave: () => {
        if (--depth.current <= 0) {
          depth.current = 0;
          setOver(0);
        }
      },
      onDrop: (e: DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        depth.current = 0;
        setOver(0);
        onFiles(Array.from(e.dataTransfer.files));
      },
    },
  };
}

/** Puts the kept files into the hidden <input type="file">, so a plain form post sends them. */
function putFiles(el: HTMLInputElement | null, items: UploadItem[]) {
  if (!el || typeof DataTransfer === "undefined") return;
  const dt = new DataTransfer();
  for (const i of items) if (i.status === "ready" && i.file) dt.items.add(i.file);
  el.files = dt.files;
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="inline-block h-1.5 w-20 shrink-0 bg-accent align-middle"
    >
      <span className="block h-full bg-primary motion-safe:transition-[width]" style={{ width: `${value * 100}%` }} />
    </span>
  );
}

function StatusText({ item }: { item: UploadItem }) {
  switch (item.status) {
    case "uploading":
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <ProgressBar value={item.progress} label={`Uploading ${item.name}`} />
          <span className="tabular-nums">{Math.round(item.progress * 100)}%</span>
        </span>
      );
    case "ready":
      return <span className="text-muted-foreground">Ready</span>;
    case "done":
      return (
        <span className="whitespace-nowrap text-success">
          <Icon icon={CircleCheck} /> Uploaded
        </span>
      );
    case "canceled":
      return <span className="text-muted-foreground">Canceled</span>;
    case "failed":
      return (
        <span className="text-destructive">
          <Icon icon={CircleX} /> Failed: {item.error}
        </span>
      );
    case "rejected":
      return (
        <span className="text-destructive">
          <Icon icon={CircleX} /> {item.error}
        </span>
      );
  }
}

function Actions({ item, cancel, retry, remove }: { item: UploadItem; cancel: (id: string) => void; retry: (id: string) => void; remove: (id: string) => void }) {
  return (
    <span className="ctl-xs flex flex-wrap gap-1 whitespace-nowrap">
      {item.status === "uploading" && (
        <Button onClick={() => cancel(item.id)} aria-label={`Cancel ${item.name}`}>
          Cancel
        </Button>
      )}
      {(item.status === "failed" || item.status === "canceled") && item.file && (
        <Button icon={RotateCw} onClick={() => retry(item.id)} aria-label={`Retry ${item.name}`}>
          Retry
        </Button>
      )}
      {item.status !== "uploading" && (
        <Button variant="ghost" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}>
          Remove
        </Button>
      )}
    </span>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export interface FileUploadProps extends Rules {
  /** The field's label, also the drop zone's accessible name */
  label?: string;
  /**
   * Sends a file. Leave it out to only check and list the files: they are kept as "ready", sent with
   * the form through the hidden file input (give it a `name`), and handed to onItemsChange.
   */
  upload?: UploadFunction;
  /** Name of the hidden file input, for a plain form post (only when there is no upload function) */
  name?: string;
  multiple?: boolean;
  /** Most files kept at once (rejected ones don't count) */
  maxFiles?: number;
  /** Also take files dropped anywhere on the page, with a full-page overlay while dragging */
  pageDrop?: boolean;
  disabled?: boolean;
  /** Files listed from the start: ones already attached, or states to show in a story */
  defaultItems?: UploadItem[];
  /** Called with the whole list whenever it changes (added, progress, done, removed) */
  onItemsChange?: (items: UploadItem[]) => void;
  /** Called once for each file whose upload has finished, with the file in `item.file` */
  onUploaded?: (item: UploadItem) => void;
  /**
   * Take each file off the list as soon as it is uploaded, for when the page shows it somewhere
   * else from then on (a card's attachments, a gallery). Pair it with onUploaded.
   */
  clearOnDone?: boolean;
  /** Replaces the line that lists the rules (types, size, count) */
  hint?: ReactNode;
  className?: string;
}

/**
 * A drop zone with a list of files under it. Files come from drag and drop, the "Choose files…"
 * button (the system file picker), or pasting while the zone has focus. Each file is checked
 * against `accept`, `maxSize` and `maxFiles` and either refused with the reason or sent with
 * your `upload` function, with progress, Cancel and Retry. A live region says how many files were
 * added or refused; the list is a plain table.
 */
export function FileUpload({
  label = "Files",
  upload,
  name,
  accept,
  maxSize,
  multiple = true,
  maxFiles,
  pageDrop = false,
  disabled = false,
  defaultItems = [],
  onItemsChange,
  onUploaded,
  clearOnDone = false,
  hint,
  className,
}: FileUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { items, add, cancel, retry, remove, clearFinished } = useUploads(defaultItems, upload, onItemsChange, { onUploaded, clearOnDone });
  const [announce, setAnnounce] = useState("");
  const formPost = !upload && !!name;
  useEffect(() => {
    if (formPost) putFiles(input.current, items);
  }, [formPost, items]);

  const addFiles = (files: File[]) => {
    if (!files.length) return;
    const kept = multiple ? items.filter((i) => i.status !== "rejected").length : 0;
    let room = maxFiles == null ? Infinity : maxFiles - kept;
    const incoming = (multiple ? files : files.slice(0, 1)).map((f) => {
      const item = checkFile(f, { accept, maxSize }, !!upload);
      if (item.status === "rejected") return item;
      if (room-- <= 0) return { ...item, status: "rejected" as const, error: `Over the limit of ${plural(maxFiles!, "file")}` };
      return item;
    });
    const bad = incoming.filter((i) => i.status === "rejected").length;
    setAnnounce(`${plural(incoming.length - bad, "file")} added${bad ? `, ${bad} refused` : ""}.`);
    add(incoming, !multiple);
  };

  const zone = useDropTarget(addFiles, disabled);
  const pageOver = usePageDrop(pageDrop && !disabled, addFiles);
  const over = zone.over || pageOver;

  const onPaste = (e: ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length && !disabled) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const total = items.reduce((a, i) => a + (i.status === "rejected" ? 0 : i.size), 0);
  const count = (s: UploadStatus) => items.filter((i) => i.status === s).length;
  const finished = items.filter((i) => i.status !== "uploading").length;
  const rules = [
    accept && describeAccept(accept),
    maxSize != null && `up to ${formatSize(maxSize)}${multiple ? " each" : ""}`,
    multiple && maxFiles != null && `${maxFiles} files at most`,
  ].filter(Boolean) as string[];
  const rulesText = rules.length ? rules.join(", ").replace(/^./, (c) => c.toUpperCase()) : "Any type, any size";
  const th = "border border-border bg-muted px-2 py-0.5 text-left font-semibold";
  const td = "border border-border px-2 py-0.5 align-top";

  return (
    <div data-slot="file-upload" className={cn("flex min-w-0 flex-col gap-1.5 text-[14px]", className)}>
      <div
        {...zone.props}
        data-drop-zone
        onPaste={onPaste}
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        className={cn(
          "flex flex-col items-start gap-1 border px-3 py-3",
          disabled ? "border-dashed border-border text-muted-foreground" : over ? "border-solid border-primary bg-accent" : "border-dashed border-input",
        )}
      >
        <span id={`${id}-label`} className="font-semibold">
          {label}
        </span>
        {over ? (
          <span className="font-medium">Release to add {over > 1 ? `${over} files` : "the file"}.</span>
        ) : (
          <span className="ctl-sm">
            Drop {multiple ? "files" : "a file"} here, or{" "}
            <Button onClick={() => input.current?.click()} disabled={disabled}>
              Choose {multiple ? "files" : "a file"}…
            </Button>
            {!disabled && <span className="text-muted-foreground"> or paste with the button focused</span>}
          </span>
        )}
        <span id={`${id}-hint`} className="text-[13px] text-muted-foreground">
          {hint ?? rulesText}
          {pageDrop && !disabled ? ". You can drop anywhere on the page." : ""}
        </span>
        <input
          ref={input}
          type="file"
          name={upload ? undefined : name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            // Picking the same file again should fire change again; the kept files are put back by putFiles.
            e.target.value = "";
          }}
        />
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {items.length > 0 && (
        <>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full border-collapse text-[14px] leading-5">
              <thead>
                <tr>
                  <th scope="col" className={th}>
                    Name
                  </th>
                  <th scope="col" className={th}>
                    Size
                  </th>
                  <th scope="col" className={th}>
                    Status
                  </th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className={cn(td, "min-w-32")}>
                      <span className="break-all">{i.name}</span>
                      {i.type && <span className="block text-[12px] text-muted-foreground">{i.type}</span>}
                    </td>
                    <td className={cn(td, "text-right whitespace-nowrap tabular-nums")}>{formatSize(i.size)}</td>
                    <td className={td}>
                      <StatusText item={i} />
                    </td>
                    <td className={cn(td, "max-sm:w-0")}>
                      <Actions item={i} cancel={cancel} retry={retry} remove={remove} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] tabular-nums">
            <span>
              {plural(items.length, "file")}, {formatSize(total)}
            </span>
            <span className="text-muted-foreground">
              {(
                [
                  ["uploading", "uploading"],
                  ["ready", "ready"],
                  ["done", "uploaded"],
                  ["failed", "failed"],
                  ["rejected", "refused"],
                  ["canceled", "canceled"],
                ] as const
              )
                .map(([s, word]) => count(s) && `${count(s)} ${word}`)
                .filter(Boolean)
                .join(", ")}
            </span>
            {finished > 0 && upload && (
              <Button size="xs" variant="link" onClick={clearFinished}>
                Clear finished
              </Button>
            )}
          </p>
        </>
      )}
      {pageOver > 0 && <PageOverlay count={pageOver} />}
    </div>
  );
}

/** Window-level drag tracking for `pageDrop`: how many files are being dragged over the page. */
function usePageDrop(enabled: boolean, onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(0);
  const drop = useEffectEvent((files: File[]) => onFiles(files));
  useEffect(() => {
    if (!enabled) return;
    let depth = 0;
    const hasFiles = (e: globalThis.DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
    const onEnter = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setOver(Math.max(1, e.dataTransfer!.items.length));
    };
    const onOver = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = "copy";
    };
    const onLeave = () => {
      if (--depth <= 0) {
        depth = 0;
        setOver(0);
      }
    };
    const onDrop = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setOver(0);
      // Drops on a zone are handled by the zone itself.
      if (!(e.target as Element | null)?.closest?.("[data-drop-zone]")) drop(Array.from(e.dataTransfer!.files));
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [enabled]);
  return over;
}

function PageOverlay({ count }: { count: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-2 z-50 flex items-center justify-center border-2 border-dashed border-primary bg-background/85">
      <span className="border border-border bg-background px-3 py-1.5 font-medium">Drop anywhere to add {count > 1 ? `${count} files` : "the file"}</span>
    </div>
  );
}

export interface FileFieldProps extends Rules {
  /** Label above the line. Leave it out inside a <Field>, which brings its own label, hint and error. */
  label?: string;
  upload?: UploadFunction;
  /** Name of the hidden file input, for a plain form post (only when there is no upload function) */
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** The file listed from the start: the current one, or a state to show */
  defaultItem?: UploadItem;
  onItemChange?: (item: UploadItem | null) => void;
  /** Line under the field (standalone only); defaults to the rules */
  hint?: ReactNode;
  id?: string;
  className?: string;
}

/**
 * A one-line, one-file input for forms: "Choose file…", then the file's name, size and progress
 * in place, with Cancel, Retry and Remove. Dropping a file on the line works too. Inside a Field
 * it takes the field's label, hint and error like Input does.
 */
export function FileField({ label, upload, name, accept, maxSize, disabled = false, invalid, defaultItem, onItemChange, hint, id, className }: FileFieldProps) {
  const autoId = useId();
  const f = useFieldProps({ id, invalid });
  const buttonId = f.id ?? `${autoId}-button`;
  const input = useRef<HTMLInputElement>(null);
  const { items, add, cancel, retry, remove } = useUploads(defaultItem ? [defaultItem] : [], upload, (list) => onItemChange?.(list[0] ?? null));
  const formPost = !upload && !!name;
  useEffect(() => {
    if (formPost) putFiles(input.current, items);
  }, [formPost, items]);
  const item = items[0];
  const addFiles = (files: File[]) => {
    if (files[0]) add([checkFile(files[0], { accept, maxSize }, !!upload)], true);
  };
  const zone = useDropTarget(addFiles, disabled);
  const rules = [accept && describeAccept(accept), maxSize != null && `up to ${formatSize(maxSize)}`]
    .filter(Boolean)
    .join(", ")
    .replace(/^./, (c) => c.toUpperCase());
  const own = label != null;

  return (
    <div data-slot="file-field" className={cn("flex min-w-0 flex-col gap-1 text-[14px]", className)}>
      {own && (
        <label id={`${autoId}-label`} htmlFor={buttonId} className="text-[14px] font-medium">
          {label}
        </label>
      )}
      <div
        {...zone.props}
        data-drop-zone
        className={cn(
          "ctl-sm -mx-1 flex min-h-8 min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border px-1 py-0.5",
          zone.over ? "border-primary bg-accent" : f.invalid ? "border-destructive" : "border-transparent",
        )}
      >
        <Button
          id={buttonId}
          onClick={() => input.current?.click()}
          disabled={disabled}
          aria-labelledby={own ? `${autoId}-label ${buttonId}-text` : undefined}
          aria-describedby={own ? (hint || rules ? `${autoId}-hint` : undefined) : f["aria-describedby"]}
          aria-invalid={f["aria-invalid"]}
        >
          <span id={`${buttonId}-text`}>{item ? "Replace…" : "Choose file…"}</span>
        </Button>
        {zone.over ? (
          <span className="font-medium">Release to use this file</span>
        ) : item ? (
          <>
            <span className="min-w-0 truncate" title={item.name}>
              {item.name}
            </span>
            <span className="text-muted-foreground tabular-nums">{formatSize(item.size)}</span>
            <StatusText item={item} />
            <Actions item={item} cancel={cancel} retry={retry} remove={remove} />
          </>
        ) : (
          <span className="text-muted-foreground">No file chosen{disabled ? "" : ", or drop one here"}</span>
        )}
        <input
          ref={input}
          type="file"
          name={upload ? undefined : name}
          accept={accept}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>
      {own && (hint || rules) && (
        <span id={`${autoId}-hint`} className="text-[13px] text-muted-foreground">
          {hint ?? rules}
        </span>
      )}
    </div>
  );
}
