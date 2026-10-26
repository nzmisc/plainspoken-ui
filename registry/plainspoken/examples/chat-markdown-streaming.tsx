import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";

// Cut off mid-way, as it is while streaming: only the end is unfinished, here an open code fence
const PARTIAL = `Feed it **twice a day** from day 5. To work out the flour for a week:

\`\`\`ts
const feeds = [50, 50, 50, 50, 100, 100, 100];
const total = feeds.reduce((sum, g) => sum + g`;

/**
 * Markdown as it arrives, cut off mid-line. With `streaming`, the open code fence is closed for
 * drawing (so is an unfinished table row or `**bold`), and a formula that hasn't closed yet shows
 * as text, so nothing jumps when the rest comes.
 */
export default function ChatMarkdownStreaming() {
  return (
    <ChatMarkdown streaming className="max-w-2xl">
      {PARTIAL}
    </ChatMarkdown>
  );
}
