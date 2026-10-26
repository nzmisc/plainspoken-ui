import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { messageText } from "@/registry/plainspoken/blocks/chat/format";
import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";

const PRICES = "A 1 kg bag of rye is about $3 to $4, and $HOME/$USER is a path: dollars that aren't math stay text.";

/**
 * Math with KaTeX, written the four ways models write it: `$…$` and `\(…\)` inline, on the text's
 * baseline and in its colour, `\[…\]` and `$$…$$` on lines of their own, centred, scrolling sideways
 * when too wide. Prices and shell variables stay as they are.
 */
export default function ChatMarkdownMath() {
  return <ChatMarkdown className="max-w-2xl">{`${messageText(chatConversation("quadratic").messages[1])}\n\n${PRICES}`}</ChatMarkdown>;
}
