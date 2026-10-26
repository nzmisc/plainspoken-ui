"use client";

import { useState } from "react";
import { ChatShareDialog } from "@/registry/plainspoken/blocks/chat/share-dialog";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";
import { Button } from "@/registry/plainspoken/ui/button";

/** The showcase conversation as a link, with its documents or without. Opening the link shows it read-only. */
export default function ChatShareDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Share a link…</Button>
      <ChatShareDialog open={open} onClose={() => setOpen(false)} conversation={CHAT_SHOWCASE} baseUrl="https://plainspoken-ui.example/demos/chat" />
    </>
  );
}
