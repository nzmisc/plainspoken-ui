"use client";

import { useId, useRef, useState } from "react";
import { Download, Ellipsis, Eye, Image as ImageIcon, ImageOff, Paperclip, Trash } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { KANBAN_NOW, ME, PEOPLE, type Attachment, type Person } from "@/registry/plainspoken/blocks/kanban/data";
import { fileKind, ms, newId, personById } from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanPicture } from "@/registry/plainspoken/blocks/kanban/picture";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { FileUpload, formatSize, type UploadFunction } from "@/registry/plainspoken/ui/file-upload";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { cn } from "@/lib/utils";

/**
 * Stands in for a server: "sends" a file in one to two seconds, with progress, and stops when
 * cancelled. Nothing leaves the browser; the file stays in the tab through an object URL.
 */
export const pretendUpload: UploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    const steps = Math.round(10 + Math.min(10, file.size / (2 * 1024 * 1024)));
    let n = 0;
    const timer = setInterval(() => {
      onProgress(++n / steps);
      if (n >= steps) {
        clearInterval(timer);
        resolve();
      }
    }, 90);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(signal.reason);
    });
  });

/** A file's picture: the real one for a file added in the browser, the drawn stand-in for the demo's own */
function Thumb({ a, className }: { a: Attachment; className?: string }) {
  if (a.url && fileKind(a.name, a.type).image)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.url} alt="" draggable={false} className={cn("object-cover", className)} />;
  if (a.picture) return <KanbanPicture kind={a.picture} className={className} />;
  return null;
}

export interface KanbanAttachmentsProps {
  /** The files. Leave out (and use defaultAttachments) to let the list keep its own. */
  attachments?: Attachment[];
  defaultAttachments?: Attachment[];
  /** Id of the picture shown on the card's front */
  cover?: string | null;
  onCoverChange?: (id: string | null) => void;
  onAdd?: (attachment: Attachment) => void;
  onRemove?: (attachment: Attachment) => void;
  people?: Person[];
  /** Who adds files */
  me?: string;
  /** The demo's clock, for "2 days ago" and for files added now */
  now?: string;
  /** Sends a file. Default: a pretend upload that keeps it in the browser. */
  upload?: UploadFunction;
  /** No adding or removing */
  readOnly?: boolean;
  /** Heading level of "Attachments". Default 3. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/**
 * A card's files: a thumbnail for pictures and a file-type symbol for the rest, then the name,
 * what it is, its size, and who added it how long ago. A click opens a preview in a dialog over
 * the card; the ⋯ menu has Preview, Make cover (pictures), Download (files added here) and Remove,
 * which asks first. The drop zone under the list adds files through the library's file upload,
 * with progress; once "uploaded" a file leaves the upload list and joins the attachments.
 */
export function KanbanAttachments({
  attachments,
  defaultAttachments = [],
  cover = null,
  onCoverChange,
  onAdd,
  onRemove,
  people = PEOPLE,
  me = ME,
  now = KANBAN_NOW,
  upload = pretendUpload,
  readOnly = false,
  headingLevel = 3,
  className,
}: KanbanAttachmentsProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultAttachments);
  const list = attachments ?? own;
  const [ownCover, setOwnCover] = useState(cover);
  const coverId = onCoverChange ? cover : ownCover;
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [removing, setRemoving] = useState<Attachment | null>(null);
  const [said, setSaid] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const H = `h${headingLevel}` as "h3";

  const setCover = (next: string | null) => {
    setOwnCover(next);
    onCoverChange?.(next);
  };
  const add = (a: Attachment) => {
    if (!attachments) setOwn((l) => [...l, a]);
    onAdd?.(a);
    setSaid(`${a.name} attached.`);
  };
  const remove = (a: Attachment) => {
    const i = list.findIndex((x) => x.id === a.id);
    const next = list[i + 1] ?? list[i - 1];
    if (!attachments) setOwn((l) => l.filter((x) => x.id !== a.id));
    if (a.id === coverId) setCover(null);
    onRemove?.(a);
    if (a.url) URL.revokeObjectURL(a.url);
    setSaid(`${a.name} removed.`);
    // Focus to the next file, or the upload button, once the dialog has closed
    requestAnimationFrame(() => {
      const el = next ? root.current?.querySelector<HTMLElement>(`[data-file="${next.id}"]`) : root.current?.querySelector<HTMLElement>("[data-drop-zone] button");
      el?.focus();
    });
  };
  const download = (a: Attachment) => {
    if (!a.url) return;
    const link = document.createElement("a");
    link.href = a.url;
    link.download = a.name;
    link.click();
  };

  const menu = (a: Attachment): MenuItem[] => {
    const k = fileKind(a.name, a.type);
    const items: MenuItem[] = [{ label: "Preview", icon: Eye, onSelect: () => setPreview(a) }];
    if (k.image && !readOnly)
      items.push(
        a.id === coverId
          ? { label: "Remove as cover", icon: ImageOff, onSelect: () => setCover(null) }
          : { label: "Make cover", icon: ImageIcon, hint: "Show it on the card", onSelect: () => setCover(a.id) },
      );
    if (a.url) items.push({ label: "Download", icon: Download, onSelect: () => download(a) });
    if (!readOnly) items.push({ type: "separator" }, { label: "Remove", icon: Trash, destructive: true, onSelect: () => setRemoving(a) });
    return items;
  };

  const p = preview ? { kind: fileKind(preview.name, preview.type), by: personById(preview.by, people) } : null;

  return (
    <div ref={root} data-slot="kanban-attachments" className={cn("flex flex-col gap-1.5", className)}>
      <H id={`${id}-h`} className="flex items-center gap-1.5 text-[14px] font-bold">
        <Icon icon={Paperclip} className="text-muted-foreground" />
        Attachments
        {list.length > 0 && <span className="font-normal text-muted-foreground tabular-nums">{list.length}</span>}
      </H>
      {list.length > 0 ? (
        <ul aria-labelledby={`${id}-h`} className="flex flex-col border-t border-border">
          {list.map((a) => {
            const k = fileKind(a.name, a.type);
            const who = personById(a.by, people);
            const pictured = k.image && (a.url || a.picture);
            return (
              <li key={a.id} className="flex items-center gap-1 border-b border-border">
                <button
                  type="button"
                  data-file={a.id}
                  onClick={() => setPreview(a)}
                  className={cn("flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-1.5 pr-1 text-left hover:bg-muted", FOCUS_RING, "focus-visible:-outline-offset-2")}
                >
                  {pictured ? (
                    <Thumb a={a} className="h-10 w-16 shrink-0 border border-border" />
                  ) : (
                    <span className="flex h-10 w-16 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
                      <Icon icon={k.icon} size={20} strokeWidth={1.75} />
                    </span>
                  )}
                  <span className="flex min-w-0 flex-col leading-snug">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-medium">{a.name}</span>
                      {a.id === coverId && (
                        <Badge icon={false} className="shrink-0">
                          Cover
                        </Badge>
                      )}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {k.word}, <span className="tabular-nums">{formatSize(a.size)}</span>
                      <span className="max-sm:hidden">
                        {" "}
                        · {who.id === me ? "you" : who.name}, <RelativeTime date={ms(a.at)} now={ms(now)} format="long" locale="en-GB" />
                      </span>
                    </span>
                  </span>
                </button>
                <DropdownMenu items={menu(a)} trigger={Ellipsis} triggerVariant="ghost" size="sm" label={`Actions for ${a.name}`} align="end" />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground">No files yet.</p>
      )}
      {!readOnly && (
        <FileUpload
          label="Add files"
          upload={upload}
          clearOnDone
          maxSize={25 * 1024 * 1024}
          hint="Any type, up to 25 MiB each. In this demo they stay in your browser."
          onUploaded={(item) =>
            add({
              id: newId("f"),
              name: item.name,
              size: item.size,
              type: item.type,
              by: me,
              at: now,
              url: item.file ? URL.createObjectURL(item.file) : undefined,
            })
          }
        />
      )}
      <p aria-live="polite" className="sr-only">
        {said}
      </p>

      <Dialog
        open={preview != null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description={preview && p ? `${p.kind.word}, ${formatSize(preview.size)}, added by ${p.by.name}` : undefined}
        size="lg"
        footer={
          <>
            {preview?.url && (
              <Button icon={Download} onClick={() => download(preview)}>
                Download
              </Button>
            )}
            <Button onClick={() => setPreview(null)}>Close</Button>
          </>
        }
      >
        {preview &&
          p &&
          (p.kind.image && (preview.url || preview.picture) ? (
            <Thumb a={preview} className="aspect-[2/1] max-h-[70dvh] w-full border border-border object-contain" />
          ) : (
            <EmptyState
              icon={p.kind.icon}
              title="No preview for this file"
              description={preview.url ? "Download it to open it on your computer." : `The demo board has no real files. In a real app the ${p.kind.word.toLowerCase()} would open here.`}
            />
          ))}
      </Dialog>
      <AlertDialog
        open={removing != null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name ?? "the file"}?`}
        description="It goes from this card for everyone on the board. Anyone who downloaded it keeps their copy."
        confirmLabel="Remove file"
        destructive
        onConfirm={() => {
          if (removing) remove(removing);
          setRemoving(null);
        }}
      />
    </div>
  );
}
