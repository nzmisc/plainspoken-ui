import type { ChatMessage } from "@/registry/plainspoken/blocks/chat/data";
import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { ChatMessageView } from "@/registry/plainspoken/blocks/chat/message";

const cutOff: ChatMessage = {
  id: "n2",
  role: "assistant",
  parts: [{ type: "text", text: "The first 40 years of the society's minutes are mostly about the roof, which leaked from 1871 until" }],
  metadata: { model: "openai/gpt-6-luna", finishReason: "length" },
};

const declined: ChatMessage = { id: "n3", role: "assistant", parts: [], metadata: { model: "google/gemini-3.8-flash", finishReason: "content-filter" } };

/** How an answer says it ended early: stopped by you, cut off at the length limit, or declined by the model. */
export default function ChatMessageNotes() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <ChatMessageView message={chatConversation("card").messages[1]} />
      <ChatMessageView message={cutOff} />
      <ChatMessageView message={declined} />
    </div>
  );
}
