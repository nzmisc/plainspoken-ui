"use client";

import { useState } from "react";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import type { ChatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { groupConversations } from "@/registry/plainspoken/blocks/chat/format";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";

/**
 * The conversations as sidebar sections, newest first under Today, Yesterday, Previous 7 days and
 * Older (one plain list until `today` is known in the browser), or a muted "None yet". Demo
 * conversations are filed by `demoToday`. Items link to `#<id>`; pass `onNavigate` to the sidebar
 * to open them instead.
 */
export function chatSections(conversations: ChatConversation[], today: ISODate | null, demoToday?: ISODate): SidebarSection[] {
  // An item without a link is drawn muted: the sidebar (and New chat above it) stays in place
  if (conversations.length === 0) return [{ key: "none", heading: "Conversations", items: [{ key: "none", label: "None yet" }] }];
  return groupConversations(conversations, today, demoToday).map((g) => ({
    key: g.key,
    heading: g.heading,
    items: g.conversations.map((c) => ({ key: c.id, label: c.title, href: `#${c.id}` })),
  }));
}

export interface ChatRenameDialogProps {
  open: boolean;
  /** The title now */
  title: string;
  onClose: () => void;
  /** Called with the new title, trimmed and not empty */
  onRename: (title: string) => void;
}

/** A small dialog with the conversation's title in a text box, selected; Enter saves. */
export function ChatRenameDialog({ open, title, onClose, onRename }: ChatRenameDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Rename conversation" size="sm" dismissOnBackdrop={false}>
      {/* The dialog renders its body only while open, so the box starts from the title each time */}
      <RenameForm title={title} onClose={onClose} onRename={onRename} />
    </Dialog>
  );
}

function RenameForm({ title, onClose, onRename }: Omit<ChatRenameDialogProps, "open">) {
  const [value, setValue] = useState(title);
  const name = value.trim();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name) return;
        onRename(name);
        onClose();
      }}
    >
      <Field label="Title">
        <Input value={value} onChange={(e) => setValue(e.target.value)} onFocus={(e) => e.target.select()} maxLength={120} data-autofocus />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!name}>
          Save
        </Button>
      </div>
    </form>
  );
}

export interface ChatDeleteDialogProps {
  open: boolean;
  /** The conversation's title, to say which one */
  title: string;
  onClose: () => void;
  onDelete: () => void;
}

/** Asks before a conversation is deleted: it is kept only in this browser, so it can't come back. */
export function ChatDeleteDialog({ open, title, onClose, onDelete }: ChatDeleteDialogProps) {
  return (
    <AlertDialog
      open={open}
      onClose={onClose}
      title="Delete this conversation?"
      description={
        <>
          “{title}” and all its messages will be deleted from this browser. This can&apos;t be undone.
        </>
      }
      confirmLabel="Delete conversation"
      destructive
      onConfirm={onDelete}
    />
  );
}
