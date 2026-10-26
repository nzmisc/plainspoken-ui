import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { messageText } from "@/registry/plainspoken/blocks/chat/format";
import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";

/**
 * A ```mermaid fence, drawn as a diagram once it has closed: the theme's colours and font, square
 * boxes, redrawn when the page turns dark. Mermaid is only fetched when the first diagram appears.
 */
export default function ChatMarkdownDiagram() {
  return <ChatMarkdown className="max-w-2xl">{messageText(chatConversation("review").messages[1])}</ChatMarkdown>;
}
