import { CHAT_CONVERSATIONS, CHAT_TODAY } from "@/registry/plainspoken/blocks/chat/data";
import { ChatApp } from "@/registry/plainspoken/blocks/chat/chat-app";

/**
 * The whole chat in a 640px box, with the demo's conversations (kept in memory only here). It is
 * live: what you send goes to the chat route, and from there to the model you pick.
 */
export default function ChatAppDemo() {
  return <ChatApp defaultConversations={CHAT_CONVERSATIONS} defaultOpenId="debounce" today={CHAT_TODAY} className="h-[640px] border border-border" />;
}
