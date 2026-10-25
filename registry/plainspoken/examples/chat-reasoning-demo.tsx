import { CHAT_CONVERSATIONS } from "@/registry/plainspoken/blocks/chat/data";
import { messageReasoning } from "@/registry/plainspoken/blocks/chat/format";
import { ChatReasoning } from "@/registry/plainspoken/blocks/chat/reasoning";

/** Finished reasoning, opened, and reasoning still coming in. Click a summary to fold or unfold it. */
export default function ChatReasoningDemo() {
  const text = messageReasoning(CHAT_CONVERSATIONS.find((c) => c.id === "debounce")!.messages[1]);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <ChatReasoning text={text} durationMs={4200} defaultOpen />
      <ChatReasoning text="They want the ball's price. If the ball is x, the bat is x + 1, so" streaming />
    </div>
  );
}
