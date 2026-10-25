"use client";

import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS } from "@/registry/plainspoken/blocks/chat/format";
import { ChatThread } from "@/registry/plainspoken/blocks/chat/thread";

/** A request that failed: the reason after the last message, and Retry. */
export default function ChatThreadError() {
  const [question] = chatConversation("rain").messages;
  return (
    <ChatThread
      messages={[question]}
      status="error"
      error={{ code: "credit", message: CHAT_ERRORS.credit.body }}
      onRetry={() => console.log("retry")}
      className="h-[320px] border border-border"
    />
  );
}
