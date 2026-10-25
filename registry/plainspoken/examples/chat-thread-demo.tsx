"use client";

import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { ChatThread } from "@/registry/plainspoken/blocks/chat/thread";

/**
 * A whole conversation in a 560px box, opened at the end. Scroll up and "Jump to latest" appears;
 * the last answer has Regenerate, every question Edit (they only log here).
 */
export default function ChatThreadDemo() {
  return (
    <ChatThread
      messages={chatConversation("debounce").messages}
      onRegenerate={() => console.log("regenerate")}
      onEdit={(id, text) => console.log("edit", id, text)}
      className="h-[560px] border border-border"
    />
  );
}
