"use client";

import { CHAT_SUGGESTIONS } from "@/registry/plainspoken/blocks/chat/data";
import { ChatThread } from "@/registry/plainspoken/blocks/chat/thread";

/** A new conversation: a few prompts to start from. Picking one sends it. */
export default function ChatThreadEmpty() {
  return <ChatThread messages={[]} suggestions={CHAT_SUGGESTIONS} onSuggestion={(p) => console.log("send", p)} className="h-[480px] border border-border" />;
}
