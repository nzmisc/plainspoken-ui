"use client";

import { useState } from "react";
import { SquarePen } from "@/registry/plainspoken/lib/icons";
import { CONTACTS, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailComposeDialog } from "@/registry/plainspoken/blocks/mail/compose";
import { Button } from "@/registry/plainspoken/ui/button";

/** A new message, or a saved draft opened again with its recipients, subject and text. */
export default function MailComposeDemo() {
  const [open, setOpen] = useState<"new" | "draft" | null>(null);
  const draft = THREADS.find((t) => t.id === "draft-newsletter")!;
  const m = draft.messages[0];
  return (
    <div className="flex gap-2">
      <Button variant="primary" icon={SquarePen} onClick={() => setOpen("new")}>
        Compose
      </Button>
      <Button onClick={() => setOpen("draft")}>Open a draft</Button>
      <MailComposeDialog
        open={open != null}
        onClose={() => setOpen(null)}
        contacts={CONTACTS}
        initial={open === "draft" ? { to: m.to, cc: [CONTACTS[0]], subject: draft.subject, body: m.body, attachments: [{ name: "autumn-photos.zip", size: 18_400_000, kind: "zip" }] } : undefined}
      />
    </div>
  );
}
