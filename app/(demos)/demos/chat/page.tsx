import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { ChatApp } from "@/registry/plainspoken/blocks/chat/chat-app";
import { CHAT_CONVERSATIONS, CHAT_TODAY } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";

export const metadata: Metadata = {
  title: "AI chat",
  description:
    "A working chat with language models, built from plainspoken-ui: conversations kept in the browser, a model picker, and answers streamed in as Markdown with tables, highlighted code, math, diagrams and the model's reasoning.",
};

export default function ChatPage() {
  // Only whether the key is there reaches the page; the key itself stays in the route
  const missingKey = !process.env.OPENROUTER_API_KEY;
  return (
    <ChatApp
      storageKey="parley"
      showcase={[CHAT_SHOWCASE]}
      defaultConversations={CHAT_CONVERSATIONS}
      demoToday={CHAT_TODAY}
      defaultOpenId={CHAT_SHOWCASE.id}
      missingKey={missingKey}
      actions={<ThemeToggle size="sm" />}
      className="h-[calc(100dvh-var(--demo-bar))]"
    />
  );
}
