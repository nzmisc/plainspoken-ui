"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, File, FileCode, FileImage, FileSpreadsheet, FileText, ImageOff, X } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { ChatPart } from "@/registry/plainspoken/blocks/chat/data";
import { parseCsv } from "@/registry/plainspoken/blocks/chat/artifacts";
import { dataUrlBytes, download, partKind, useAttachmentUrl, type ChatAttachment } from "@/registry/plainspoken/blocks/chat/attachments";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { formatSize } from "@/registry/plainspoken/ui/file-upload";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { cn } from "@/lib/utils";

/** The icon for a file, by its name and type */
function fileIcon(name: string, mediaType: string) {
  if (mediaType.startsWith("image/")) return FileImage;
  if (/\.(csv|tsv|xlsx?)$/i.test(name) || mediaType === "text/csv") return FileSpreadsheet;
  if (mediaType === "application/pdf" || /\.(md|txt|pdf)$/i.test(name)) return FileText;
  if (/^(text\/x-|application\/(json|xml|sql|yaml|toml)|text\/(javascript|css|html))/.test(mediaType)) return FileCode;
  return File;
}

/** "PDF", "CSV", "PNG": the kind of file in a word */
function fileLabel(name: string, mediaType: string): string {
  const ext = /\.([a-z0-9]+)$/i.exec(name)?.[1];
  if (ext) return ext.toUpperCase();
  return mediaType.split("/")[1]?.toUpperCase() ?? "File";
}

/** A picture's thumbnail: a data: URL, or a file kept in the browser (a question being edited) */
function ChipThumb({ url }: { url: string }) {
  const { src } = useAttachmentUrl(url);
  // eslint-disable-next-line @next/next/no-img-element -- a data: URL
  return src ? <img src={src} alt="" className="size-full object-cover" /> : null;
}

export interface ChatAttachmentChipsProps {
  attachments: ChatAttachment[];
  /** Offers × on each one */
  onRemove?: (id: string) => void;
  className?: string;
}

/**
 * The files about to be sent, in a row above the message box: a thumbnail for a picture or an
 * icon for any other file, its name, its size, and × to take it off. A file still being read
 * shows a spinner; one that can't be sent (too big, the wrong kind) is outlined in red and says
 * why, and isn't sent.
 */
export function ChatAttachmentChips({ attachments, onRemove, className }: ChatAttachmentChipsProps) {
  if (!attachments.length) return null;
  return (
    <ul data-slot="chat-attachment-chips" aria-label="Attached files" className={cn("flex flex-wrap gap-1.5", className)}>
      {attachments.map((a) => {
        const failed = a.status === "error";
        return (
          <li
            key={a.id}
            className={cn("flex h-11 max-w-64 min-w-0 items-center gap-2 border bg-background pl-1 text-[13px]", failed ? "border-destructive" : "border-border", !onRemove && "pr-2")}
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden bg-muted">
              {a.status === "reading" ? (
                <Spinner label={null} />
              ) : a.mediaType.startsWith("image/") && a.url ? (
                <ChipThumb url={a.url} />
              ) : (
                <Icon icon={fileIcon(a.name, a.mediaType)} size={18} className="text-muted-foreground" />
              )}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-medium" title={a.name}>
                {a.name}
              </span>
              <span className={cn("truncate text-[12px]", failed ? "text-destructive" : "text-muted-foreground")} title={a.error}>
                {a.status === "reading" ? "Reading…" : failed ? a.error : `${fileLabel(a.name, a.mediaType)}, ${formatSize(a.size)}`}
              </span>
            </span>
            {onRemove && (
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                title="Remove"
                onClick={() => onRemove(a.id)}
                className={cn("ml-auto flex h-full w-7 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground", FOCUS_RING)}
              >
                <Icon icon={X} size={14} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------
// Files in a sent message

/** The text of a text file's data: URL */
function decodeText(url: string): string {
  const comma = url.indexOf(",");
  const head = url.slice(0, comma);
  const body = url.slice(comma + 1);
  if (!head.endsWith(";base64")) return decodeURIComponent(body);
  const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** A data: URL as a blob: URL, which the browser's PDF viewer will open in a frame */
function useBlobUrl(src: string | null, enabled: boolean): string | null {
  const [blob, setBlob] = useState<{ src: string; url: string } | null>(null);
  useEffect(() => {
    if (!enabled || !src?.startsWith("data:")) return;
    let url = "";
    let live = true;
    void fetch(src)
      .then((r) => r.blob())
      .then((b) => {
        if (!live) return;
        url = URL.createObjectURL(b);
        setBlob({ src, url });
      });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, enabled]);
  if (!src) return null;
  if (!src.startsWith("data:")) return src;
  return blob?.src === src ? blob.url : null;
}

/** A text file's contents in the viewer: a table for CSV, otherwise the text as it is */
function TextPreview({ src, name, mediaType }: { src: string; name: string; mediaType: string }) {
  const [text, setText] = useState<string | null>(() => (src.startsWith("data:") ? decodeText(src) : null));
  useEffect(() => {
    if (src.startsWith("data:")) return;
    let live = true;
    void fetch(src)
      .then((r) => r.text())
      .then((t) => live && setText(t), () => live && setText(""));
    return () => {
      live = false;
    };
  }, [src]);
  const csv = /\.csv$/i.test(name) || mediaType === "text/csv";
  const rows = useMemo(() => (csv && text ? parseCsv(text).slice(0, 501) : null), [csv, text]);
  if (text == null) return <Spinner className="text-muted-foreground">Reading…</Spinner>;
  if (rows && rows.length > 1) {
    const [head, ...body] = rows;
    return (
      <Table density="compact" stickyHeader wrapperClassName="max-h-full overflow-auto">
        <TableHeader>
          <TableRow>
            {head.map((h, i) => (
              <TableHead key={i}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {body.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (
                <TableCell key={j} numeric={/^-?[$€£]?\d[\d,.]*%?$/.test(c.trim())}>
                  {c}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  return <pre className="m-0 font-mono text-[13px] whitespace-pre-wrap">{text}</pre>;
}

interface ViewerProps {
  part: ChatPart;
  src: string | null;
  open: boolean;
  onClose: () => void;
}

/** A file at full size: a picture, a PDF in the browser's viewer, or a text file's contents; with Download */
function FileViewer({ part, src, open, onClose }: ViewerProps) {
  const name = part.filename ?? "file";
  // Any picture a model made shows as one (an SVG too: in an <img> it can't run anything)
  const kind = part.mediaType?.startsWith("image/") ? "image" : partKind(part);
  const pdf = useBlobUrl(src, open && kind === "pdf");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={name}
      size="full"
      bodyClassName={cn("flex min-h-0 flex-1 flex-col", kind === "pdf" && "p-0")}
      footer={
        src && (
          <Button icon={Download} onClick={() => download(src, name)}>
            Download
          </Button>
        )
      }
    >
      {!src ? (
        <p className="text-muted-foreground">This file is no longer kept in this browser.</p>
      ) : kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data: URL or a file on this site
        <img src={src} alt={name} className="m-auto max-h-full max-w-full object-contain" />
      ) : kind === "pdf" ? (
        pdf ? <iframe src={pdf} title={name} className="min-h-0 w-full flex-1 border-0" /> : <Spinner className="m-3 text-muted-foreground">Opening…</Spinner>
      ) : kind === "text" ? (
        <TextPreview src={src} name={name} mediaType={part.mediaType ?? ""} />
      ) : (
        <p className="text-muted-foreground">This kind of file can&apos;t be shown here; download it instead.</p>
      )}
    </Dialog>
  );
}

function ChatFile({ part, size, large }: { part: ChatPart; size?: number; large: boolean }) {
  const [open, setOpen] = useState(false);
  const { src, missing } = useAttachmentUrl(part.url);
  const name = part.filename ?? "file";
  const mediaType = part.mediaType ?? "";
  const bytes = size ?? (src?.startsWith("data:") ? dataUrlBytes(src) : undefined);
  const image = mediaType.startsWith("image/");
  if (image) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${name}, open full size`}
          title={name}
          className={cn("group/file relative block cursor-zoom-in overflow-hidden border border-border bg-muted", large ? "max-w-full" : "size-28", FOCUS_RING)}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data: URL or a file on this site
            <img src={src} alt="" className={cn(large ? "max-h-[28rem] w-auto max-w-full" : "size-full object-cover")} />
          ) : (
            <span className="flex size-28 flex-col items-center justify-center gap-1 p-2 text-center text-[12px] text-muted-foreground">
              <Icon icon={missing ? ImageOff : FileImage} size={20} />
              {missing ? "No longer kept here" : "Loading…"}
            </span>
          )}
        </button>
        <FileViewer part={part} src={src} open={open} onClose={() => setOpen(false)} />
      </li>
    );
  }
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("flex h-11 max-w-72 min-w-44 cursor-pointer items-center gap-2 border border-border bg-background pr-3 pl-1 text-left text-[13px] hover:bg-secondary", FOCUS_RING)}
      >
        <span className="flex size-9 shrink-0 items-center justify-center bg-muted">
          <Icon icon={fileIcon(name, mediaType)} size={18} className="text-muted-foreground" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-medium">{name}</span>
          <span className="truncate text-[12px] text-muted-foreground">
            {fileLabel(name, mediaType)}
            {bytes != null && `, ${formatSize(bytes)}`}
            {missing && ", no longer kept here"}
          </span>
        </span>
      </button>
      <FileViewer part={part} src={src} open={open} onClose={() => setOpen(false)} />
    </li>
  );
}

export interface ChatFileListProps {
  /** The message's file parts */
  files: ChatPart[];
  /** Bytes by file name, from the message's metadata */
  sizes?: Record<string, number>;
  /** Pictures at their own size (up to the column) rather than as thumbnails: for pictures a model made */
  large?: boolean;
  /** Right-aligned, under a question */
  align?: "start" | "end";
  className?: string;
}

/**
 * The files of a sent message: pictures as thumbnails, other files as cards with their kind and
 * size. Each opens full size in a dialog: a picture, a PDF in the browser's own viewer, a CSV as
 * a table and other text as it is, with Download. A file this browser no longer keeps says so.
 */
export function ChatFileList({ files, sizes, large = false, align = "start", className }: ChatFileListProps) {
  if (!files.length) return null;
  return (
    <ul data-slot="chat-file-list" aria-label="Files" className={cn("flex flex-wrap gap-1.5", align === "end" && "justify-end", className)}>
      {files.map((f, i) => (
        <ChatFile key={`${f.url?.slice(0, 64)}-${i}`} part={f} size={f.filename ? sizes?.[f.filename] : undefined} large={large} />
      ))}
    </ul>
  );
}
