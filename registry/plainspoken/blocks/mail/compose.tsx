"use client";

import { useId, useRef, useState } from "react";
import { Paperclip, Send, Trash } from "@/registry/plainspoken/lib/icons";
import { ME, type MailDraft, type Person } from "@/registry/plainspoken/blocks/mail/data";
import { attachmentKind, MailAttachments } from "@/registry/plainspoken/blocks/mail/attachments";
import { RecipientInput } from "@/registry/plainspoken/blocks/mail/recipient-input";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Input } from "@/registry/plainspoken/ui/input";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

export const EMPTY_DRAFT: MailDraft = { to: [], cc: [], subject: "", body: "", attachments: [] };

export interface MailComposeDialogProps {
  open: boolean;
  /** Closed: the ×, Escape, Send or Discard */
  onClose: () => void;
  /** What the form starts with: empty for a new message, or a saved draft */
  initial?: MailDraft;
  contacts?: Person[];
  /** Send pressed; the dialog closes after */
  onSend?: () => void;
  /** Discard pressed; the dialog closes after */
  onDiscard?: () => void;
}

const ROW = "grid grid-cols-[4.5rem_1fr] items-start gap-x-2 border-b border-border px-3 py-1.5 max-sm:grid-cols-[3.5rem_1fr]";
const LABEL = "flex h-7 items-center text-[13px] font-semibold text-muted-foreground";

/**
 * Writing a new message, in a dialog (the whole screen on a phone): From, To and Cc as chips with
 * suggestions, Subject, the message, and files attached from the computer, listed as chips with
 * a × each. Cc stays out of the way until asked for. The form is only rendered while the dialog
 * is open, so it starts from `initial` every time.
 */
export function MailComposeDialog({ open, onClose, initial = EMPTY_DRAFT, contacts, onSend, onDiscard }: MailComposeDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial.subject.trim() || "New message"}
      size="md"
      dismissOnBackdrop={false}
      bodyClassName="flex flex-col p-0"
      className="sm:h-[min(40rem,calc(100dvh-2rem))]"
    >
      {open && (
        <ComposeForm
          initial={initial}
          contacts={contacts}
          onSend={() => {
            onSend?.();
            onClose();
          }}
          onDiscard={() => {
            onDiscard?.();
            onClose();
          }}
        />
      )}
    </Dialog>
  );
}

function ComposeForm({ initial, contacts, onSend, onDiscard }: { initial: MailDraft; contacts?: Person[]; onSend: () => void; onDiscard: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [showCc, setShowCc] = useState(initial.cc.length > 0);
  const files = useRef<HTMLInputElement>(null);
  const id = useId();
  const set = (patch: Partial<MailDraft>) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <div className={ROW}>
          <span className={LABEL}>From</span>
          <span className="flex h-7 min-w-0 items-center text-[14px]">
            <span className="truncate">
              {ME.name} <span className="text-muted-foreground">&lt;{ME.email}&gt;</span>
            </span>
          </span>
        </div>
        <div className={ROW}>
          <label htmlFor={`${id}-to`} className={LABEL}>
            To
          </label>
          <div className="flex min-w-0 items-start gap-1">
            <RecipientInput
              id={`${id}-to`}
              label="To"
              value={draft.to}
              onChange={(to) => set({ to })}
              contacts={contacts}
              autoFocus={draft.to.length === 0}
              placeholder="Name or address"
              className="flex-1"
            />
            {!showCc && (
              <Button variant="ghost" onClick={() => setShowCc(true)} aria-label="Add Cc recipients">
                Cc
              </Button>
            )}
          </div>
        </div>
        {showCc && (
          <div className={ROW}>
            <label htmlFor={`${id}-cc`} className={LABEL}>
              Cc
            </label>
            <RecipientInput id={`${id}-cc`} label="Cc" value={draft.cc} onChange={(cc) => set({ cc })} contacts={contacts} />
          </div>
        )}
        <div className={ROW}>
          <label htmlFor={`${id}-subject`} className={LABEL}>
            Subject
          </label>
          <Input
            id={`${id}-subject`}
            value={draft.subject}
            onChange={(e) => set({ subject: e.target.value })}
            className="w-full border-transparent hover:border-input has-[:focus-visible]:border-input"
          />
        </div>
        <Textarea
          aria-label="Message"
          value={draft.body}
          onChange={(e) => set({ body: e.target.value })}
          autoFocus={draft.to.length > 0}
          rows={10}
          placeholder="Write your message"
          className="min-h-40 flex-1 resize-none border-0 px-3 py-2 focus-visible:-outline-offset-2"
        />
        {draft.attachments.length > 0 && (
          <MailAttachments
            label="Attached files"
            attachments={draft.attachments}
            onRemove={(i) => set({ attachments: draft.attachments.filter((_, j) => j !== i) })}
            className="border-t border-border px-3 py-2"
          />
        )}
        <input
          ref={files}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const picked = [...(e.target.files ?? [])].map((f) => ({ name: f.name, size: f.size, kind: attachmentKind(f.name, f.type) }));
            set({ attachments: [...draft.attachments, ...picked] });
            e.target.value = "";
          }}
        />
      </div>
      <div data-dialog-footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-muted px-3 py-2">
        <Button icon={Paperclip} onClick={() => files.current?.click()} className="mr-auto">
          Attach
        </Button>
        <Button variant="ghost" icon={Trash} onClick={onDiscard}>
          Discard
        </Button>
        <Button variant="primary" icon={Send} onClick={onSend}>
          Send
        </Button>
      </div>
    </div>
  );
}
