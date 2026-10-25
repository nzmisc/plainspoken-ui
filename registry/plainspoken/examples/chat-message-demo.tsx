"use client";

import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { ChatMessageView } from "@/registry/plainspoken/blocks/chat/message";

/** A question and its answer, with the model's reasoning folded above it. Edit and Regenerate only log here. */
export default function ChatMessageDemo() {
  const [question, answer] = chatConversation("debounce").messages;
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <ChatMessageView message={question} onEdit={(text) => console.log("send again:", text)} />
      <ChatMessageView message={answer} onRegenerate={() => console.log("regenerate")} />
    </div>
  );
}
