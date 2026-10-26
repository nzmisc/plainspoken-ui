"use client";

import { useState } from "react";
import { BookmarkPlus } from "@/registry/plainspoken/lib/icons";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button, type ButtonVariant } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { DatePicker } from "@/registry/plainspoken/ui/date-picker";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { Select } from "@/registry/plainspoken/ui/select";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import {
  FORMAT_LABELS,
  availabilityText,
  creatorLine,
  isDigital,
  type Branch,
  type Format,
  type FormatAvailability,
  type LibraryBook,
} from "@/registry/plainspoken/blocks/library/lib";

export interface LibraryHoldDialogProps {
  book: Pick<LibraryBook, "id" | "title" | "author" | "creatorRole" | "formats">;
  /** Per format, for the choice of format and the place in the queue */
  availability: FormatAvailability[];
  branches: Pick<Branch, "id" | "name">[];
  /** The patron's home branch, chosen at first */
  defaultBranch?: string;
  /** Earliest "not needed after" date; pass it from the server */
  today?: ISODate;
  /** The button's look and size */
  variant?: ButtonVariant;
  size?: ControlSize;
  /** The button's words. Default "Place hold". */
  label?: string;
  /** Start with the dialog open (stories, screenshots) */
  defaultOpen?: boolean;
}

/**
 * A "Place hold" button and the dialog it opens: which format (with where each stands: "2 of 5
 * available", "On hold: 3 waiting"), the branch to pick it up at (not for e-books and audiobooks,
 * which are borrowed online), an optional date after which it isn't wanted, and email notice.
 * Placing it shows the place in the queue in the same dialog. A demo: nothing is sent anywhere.
 */
export function LibraryHoldDialog({
  book,
  availability,
  branches,
  defaultBranch,
  today,
  variant = "default",
  size,
  label = "Place hold",
  defaultOpen = false,
}: LibraryHoldDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [placed, setPlaced] = useState(false);
  const firstFree = availability.find((a) => a.available > 0)?.format;
  const [format, setFormat] = useState<Format>(firstFree ?? availability[0]?.format ?? "book");
  const [branch, setBranch] = useState(defaultBranch ?? branches[0]?.id ?? "");
  const [until, setUntil] = useState<ISODate | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const chosen = availability.find((a) => a.format === format);
  const digital = isDigital(format);
  const close = () => {
    setOpen(false);
    setPlaced(false);
  };
  const position = (chosen?.holds ?? 0) + 1;

  return (
    <>
      <Button variant={variant} size={size} icon={BookmarkPlus} onClick={() => setOpen(true)} aria-label={`${label}: ${book.title}`}>
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        size="md"
        title={placed ? "Hold placed" : "Place a hold"}
        dismissOnBackdrop={false}
        footer={
          placed ? (
            <Button variant="primary" onClick={close} data-autofocus>
              Done
            </Button>
          ) : (
            <>
              <Button onClick={close}>Cancel</Button>
              <Button variant="primary" type="submit" form={`hold-${book.id}`}>
                {chosen && chosen.available > 0 && digital ? "Borrow now" : "Place hold"}
              </Button>
            </>
          )
        }
      >
        <div className="mb-3 flex items-start gap-3 border-b border-border pb-3">
          <BookCover book={book} size="sm" />
          <div className="min-w-0">
            <p className="font-bold">{book.title}</p>
            <p className="text-[13px] text-muted-foreground">{creatorLine(book)}</p>
          </div>
        </div>
        {placed ? (
          <Alert variant="success" title={digital && chosen && chosen.available > 0 ? "Borrowed" : "You're on the list"} announce>
            {digital && chosen && chosen.available > 0
              ? `The ${FORMAT_LABELS[format].toLowerCase()} is on your loans page for 21 days.`
              : position === 1 && chosen && chosen.available > 0
                ? `A copy will be set aside at ${branches.find((b) => b.id === branch)?.name}. We'll email you when it's ready, usually within two days.`
                : `You are number ${position} in line for the ${FORMAT_LABELS[format].toLowerCase()}${digital ? "" : `, to pick up at ${branches.find((b) => b.id === branch)?.name}`}. We'll email you when it's your turn.`}
          </Alert>
        ) : (
          <form
            id={`hold-${book.id}`}
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dateError) setPlaced(true);
            }}
          >
            <RadioGroup
              legend="Format"
              value={format}
              onChange={setFormat}
              options={availability.map((a) => ({ value: a.format, label: FORMAT_LABELS[a.format], description: availabilityText(a).text }))}
            />
            {digital ? (
              <p className="text-[13px] text-muted-foreground">
                {FORMAT_LABELS[format]}s are borrowed online with your library card; there is nothing to pick up.
              </p>
            ) : (
              <Field label="Pick up at">
                <Select value={branch} onChange={(e) => setBranch(e.target.value)} options={branches.map((b) => ({ value: b.id, label: b.name }))} />
              </Field>
            )}
            <Field label="Not needed after" hint="Optional. We'll cancel the hold if it isn't ready by then." error={dateError}>
              <DatePicker value={until} onChange={setUntil} onError={setDateError} min={today} today={today} locale="en-US" className="w-44" />
            </Field>
            <Checkbox label="Email me when it's ready" defaultChecked />
          </form>
        )}
      </Dialog>
    </>
  );
}
