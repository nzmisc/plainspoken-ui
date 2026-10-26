"use client";

import { useState } from "react";
import { Ellipsis, MapPin, Pause, Play, X } from "@/registry/plainspoken/lib/icons";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { toast } from "@/registry/plainspoken/ui/toast";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import { FORMAT_LABELS, isDigital, shortDate, type Branch, type Format, type LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export interface LibraryHold {
  book: Pick<LibraryBook, "id" | "title" | "author" | "formats">;
  format: Format;
  /** Branch id to pick it up at */
  pickup: string;
  /** Place in the queue, 1 = next */
  position: number;
  /** People in the queue */
  queue: number;
  status: "ready" | "in-transit" | "waiting" | "suspended";
  /** Ready: last day to collect. Suspended: paused until. */
  until?: ISODate;
}

export interface LibraryHoldsProps {
  holds: LibraryHold[];
  branches: Pick<Branch, "id" | "name">[];
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

function holdStatus(h: LibraryHold) {
  switch (h.status) {
    case "ready":
      return <Status variant="success">Ready{h.until && ` until ${shortDate(h.until)}`}</Status>;
    case "in-transit":
      return <Status variant="info">On its way</Status>;
    case "suspended":
      return <Status variant="warning">Paused{h.until && ` until ${shortDate(h.until)}`}</Status>;
    default:
      return <Status>Waiting</Status>;
  }
}

/**
 * A patron's holds: the title, where to collect it, the place in the queue (as "4 of 19" and a
 * bar), and the state: ready to collect and until when, on its way, waiting, or paused. Each row's
 * menu pauses or resumes the hold, changes the pickup branch, or cancels it after a confirmation.
 * The changes stay on this page; nothing is saved.
 */
export function LibraryHolds({ holds, branches, basePath = "/library", linkAs, className }: LibraryHoldsProps) {
  const L = linkAs ?? "a";
  const [rows, setRows] = useState(holds);
  const [cancel, setCancel] = useState<LibraryHold | null>(null);
  const name = (id: string) => branches.find((b) => b.id === id)?.name ?? id;
  const update = (h: LibraryHold, patch: Partial<LibraryHold>) => setRows((rs) => rs.map((r) => (r === h ? { ...r, ...patch } : r)));
  return (
    <div data-slot="library-holds" className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Pick up at</TableHead>
            <TableHead className="hidden sm:table-cell">Place in line</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((h) => (
            <TableRow key={`${h.book.id}/${h.format}`} className={cn(h.status === "ready" && "bg-success/8")}>
              <TableCell>
                <div className="flex items-start gap-2">
                  <BookCover book={h.book} size="xs" />
                  <div className="min-w-0">
                    <L href={`${basePath}/book/${h.book.id}`} className={cn(linkVariants(), "font-medium")}>
                      {h.book.title}
                    </L>
                    <div className="text-[13px] text-muted-foreground">
                      {FORMAT_LABELS[h.format]} · {h.book.author}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{isDigital(h.format) ? <span className="text-muted-foreground">Online</span> : name(h.pickup)}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {h.status === "ready" || h.status === "in-transit" ? (
                  <span className="text-muted-foreground">Your turn</span>
                ) : (
                  <Progress
                    label={`${h.book.title}: place in line`}
                    value={h.queue - h.position + 1}
                    max={h.queue}
                    showValue={`${h.position} of ${h.queue}`}
                    className="w-40"
                  />
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{holdStatus(h)}</TableCell>
              <TableCell className="ctl-xs text-right">
                <DropdownMenu
                  trigger={Ellipsis}
                  triggerVariant="ghost"
                  label={`Actions for ${h.book.title}`}
                  align="end"
                  items={[
                    h.status === "suspended"
                      ? { label: "Resume hold", icon: Play, onSelect: () => update(h, { status: "waiting", until: undefined }) }
                      : {
                          label: "Pause hold",
                          icon: Pause,
                          hint: "Keep your place, skip your turn",
                          disabled: h.status === "ready" || h.status === "in-transit",
                          onSelect: () => update(h, { status: "suspended", until: "2026-11-30" }),
                        },
                    ...(isDigital(h.format)
                      ? []
                      : [
                          {
                            type: "submenu" as const,
                            label: "Pick up at",
                            icon: MapPin,
                            items: [
                              {
                                type: "radio" as const,
                                value: h.pickup,
                                onValueChange: (v: string) => {
                                  update(h, { pickup: v });
                                  toast(`${h.book.title} will go to ${name(v)}`);
                                },
                                options: branches.map((b) => ({ value: b.id, label: b.name })),
                              },
                            ],
                          },
                        ]),
                    { type: "separator" },
                    { label: "Cancel hold…", icon: X, destructive: true, onSelect: () => setCancel(h) },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No holds. Place one from any title&apos;s page.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <AlertDialog
        open={cancel != null}
        onClose={() => setCancel(null)}
        title="Cancel this hold?"
        description={cancel ? `You will lose your place in line for ${cancel.book.title}${cancel.position > 1 ? ` (number ${cancel.position} of ${cancel.queue})` : ""}.` : ""}
        confirmLabel="Cancel hold"
        cancelLabel="Keep it"
        destructive
        onConfirm={() => {
          if (cancel) {
            setRows((rs) => rs.filter((r) => r !== cancel));
            toast({ title: `Hold on ${cancel.book.title} cancelled` });
          }
          setCancel(null);
        }}
      />
    </div>
  );
}
