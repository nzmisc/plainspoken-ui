"use client";

import { useState } from "react";
import { FileArchive, FileSpreadsheet, FileText, Image as ImageIcon, X, type Glyph } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { Attachment, AttachmentKind } from "@/registry/plainspoken/blocks/mail/data";
import { formatBytes } from "@/registry/plainspoken/blocks/mail/format";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

const KIND: Record<AttachmentKind, { icon: Glyph; word: string }> = {
  pdf: { icon: FileText, word: "PDF document" },
  doc: { icon: FileText, word: "Word document" },
  sheet: { icon: FileSpreadsheet, word: "Spreadsheet" },
  image: { icon: ImageIcon, word: "Image" },
  zip: { icon: FileArchive, word: "Zip archive" },
};

/** What a file is, from its name and MIME type: for files picked in the compose box */
export function attachmentKind(name: string, type = ""): AttachmentKind {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv", "numbers", "ods"].includes(ext)) return "sheet";
  if (["zip", "rar", "7z", "gz", "tar"].includes(ext)) return "zip";
  return "doc";
}

/** A small number from a string, the same every time: picks the colours and shapes of a picture */
function seed(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

const SKY = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"];
const HILL = ["var(--chart-3)", "var(--chart-5)", "var(--chart-2)"];

/**
 * A stand-in picture for an image attachment, drawn as SVG from its name: a sky, a sun, hills
 * and a lake in the chart colours. The demo has no real photos, and this never fails to load.
 */
export function AttachmentPicture({ name, className }: { name: string; className?: string }) {
  const h = seed(name);
  const sky = SKY[h % SKY.length];
  const hill = HILL[(h >> 3) % HILL.length];
  const sunX = 30 + ((h >> 5) % 140);
  const peak1 = 40 + ((h >> 8) % 30);
  const peak2 = 30 + ((h >> 11) % 35);
  return (
    <svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" aria-hidden className={cn("block", className)}>
      <rect width="200" height="130" fill={sky} opacity="0.35" />
      <circle cx={sunX} cy="34" r="13" fill="var(--background)" opacity="0.9" />
      <path d={`M0 95 L45 ${peak1} L80 85 L125 ${peak2} L200 92 L200 130 L0 130 Z`} fill={hill} opacity="0.8" />
      <path d={`M0 104 L60 ${70 + (h % 15)} L110 100 L160 ${78 + ((h >> 2) % 12)} L200 104 L200 130 L0 130 Z`} fill={hill} />
      <rect y="108" width="200" height="22" fill={sky} opacity="0.55" />
      <path d="M20 116 H70 M95 121 H150" stroke="var(--background)" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

export interface MailAttachmentsProps {
  attachments: Attachment[];
  /** Shows a × on each, for the compose box; leave out in a received message */
  onRemove?: (index: number) => void;
  /** Accessible name of the list. Default "Attachments". */
  label?: string;
  className?: string;
}

/**
 * A message's attachments as file chips: a thumbnail for pictures, a file symbol for the rest, the
 * name and the size. Clicking one opens a preview in a dialog. In the compose box each chip has a
 * × to take the file off again.
 */
export function MailAttachments({ attachments, onRemove, label = "Attachments", className }: MailAttachmentsProps) {
  const [preview, setPreview] = useState<Attachment | null>(null);
  if (!attachments.length) return null;
  const total = attachments.reduce((s, a) => s + a.size, 0);
  return (
    <div data-slot="mail-attachments" className={cn("flex flex-col gap-1.5", className)}>
      {!onRemove && (
        <p className="text-[13px] text-muted-foreground">
          {attachments.length === 1 ? "1 attachment" : `${attachments.length} attachments`} · {formatBytes(total)}
        </p>
      )}
      <ul aria-label={label} className="flex flex-wrap gap-2">
        {attachments.map((a, i) => {
          const k = KIND[a.kind];
          return (
            <li key={a.name + i} className="flex max-w-full min-w-0 border border-border bg-background">
              <button
                type="button"
                onClick={() => setPreview(a)}
                title={`Preview ${a.name}`}
                className={cn("flex min-w-0 cursor-pointer items-center gap-2 py-1 pr-2 pl-1 text-left hover:bg-secondary", FOCUS_RING, "focus-visible:-outline-offset-2")}
              >
                {a.kind === "image" && !onRemove ? (
                  <AttachmentPicture name={a.name} className="h-9 w-14 shrink-0 border border-border" />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center bg-muted text-muted-foreground [&_svg]:size-5">
                    <Icon icon={k.icon} />
                  </span>
                )}
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="max-w-56 truncate text-[13px] font-medium">{a.name}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {k.word}, {formatBytes(a.size)}
                  </span>
                </span>
              </button>
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  title="Remove"
                  onClick={() => onRemove(i)}
                  className={cn("flex w-7 shrink-0 cursor-pointer items-center justify-center border-l border-border text-muted-foreground hover:bg-secondary hover:text-foreground", FOCUS_RING)}
                >
                  <Icon icon={X} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <Dialog
        open={preview != null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description={preview ? `${KIND[preview.kind].word}, ${formatBytes(preview.size)}` : undefined}
        size="lg"
        footer={<Button onClick={() => setPreview(null)}>Close</Button>}
      >
        {preview &&
          (preview.kind === "image" ? (
            <AttachmentPicture name={preview.name} className="aspect-[200/130] w-full border border-border" />
          ) : (
            <EmptyState
              icon={KIND[preview.kind].icon}
              title="No preview in this demo"
              description={`The demo mailbox has no real files. In a mail app this is where the ${KIND[preview.kind].word.toLowerCase()} would open.`}
            />
          ))}
      </Dialog>
    </div>
  );
}
