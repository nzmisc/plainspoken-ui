"use client";

import { useState } from "react";
import { Pencil, Trash } from "@/registry/plainspoken/lib/icons";
import { CHAT_CONVERSATIONS, CHAT_TODAY } from "@/registry/plainspoken/blocks/chat/data";
import { ChatDeleteDialog, ChatRenameDialog, chatSections } from "@/registry/plainspoken/blocks/chat/conversations";
import { Button } from "@/registry/plainspoken/ui/button";
import { SidebarList } from "@/registry/plainspoken/ui/sidebar";

/**
 * The conversations as a sidebar list, newest first under date headings. Pick one, then rename
 * or delete it with the buttons (in the app those are in the conversation's ⋯ menu).
 */
export default function ChatConversationsDemo() {
  const [conversations, setConversations] = useState(CHAT_CONVERSATIONS);
  const [current, setCurrent] = useState("debounce");
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const open = conversations.find((c) => c.id === current);
  return (
    <div className="flex flex-wrap items-start gap-4">
      <nav aria-label="Conversations" className="w-60 border border-border">
        <SidebarList sections={chatSections(conversations, CHAT_TODAY)} current={current} onNavigate={setCurrent} />
      </nav>
      <div className="flex gap-2">
        <Button icon={Pencil} disabled={!open} onClick={() => setDialog("rename")}>
          Rename…
        </Button>
        <Button icon={Trash} variant="destructive" disabled={!open} onClick={() => setDialog("delete")}>
          Delete…
        </Button>
      </div>
      <ChatRenameDialog
        open={dialog === "rename"}
        title={open?.title ?? ""}
        onClose={() => setDialog(null)}
        onRename={(title) => setConversations((cs) => cs.map((c) => (c.id === current ? { ...c, title } : c)))}
      />
      <ChatDeleteDialog
        open={dialog === "delete"}
        title={open?.title ?? ""}
        onClose={() => setDialog(null)}
        onDelete={() => setConversations((cs) => cs.filter((c) => c.id !== current))}
      />
    </div>
  );
}
