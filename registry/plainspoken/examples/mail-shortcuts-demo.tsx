"use client";

import { useState } from "react";
import { Keyboard } from "@/registry/plainspoken/lib/icons";
import { MailShortcutsDialog } from "@/registry/plainspoken/blocks/mail/shortcuts";
import { Button } from "@/registry/plainspoken/ui/button";

/** The help a "?" key or a keyboard button opens: the shortcuts in three groups, as keycaps. */
export default function MailShortcutsDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon={Keyboard} onClick={() => setOpen(true)}>
        Keyboard shortcuts
      </Button>
      <MailShortcutsDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
