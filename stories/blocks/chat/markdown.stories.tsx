import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { messageText } from "@/registry/plainspoken/blocks/chat/format";
import { ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";

const reply = (id: string) => messageText(CHAT_SHOWCASE.messages.find((m) => m.id === id)!);

const meta: Meta<typeof ChatMarkdown> = {
  title: "Blocks/AI chat/Markdown",
  component: ChatMarkdown,
  args: { children: reply("l2") },
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatMarkdown>;

/** A plan: headings, bold, italic and struck-out text, nested lists, a task list, a rule and a quote. */
export const Answer: Story = {};

/** Everything it draws, in one answer: headings 1 to 6, nested quotes, a table aligned three ways, code in four languages, math, a pie chart, footnotes, a picture, autolinks, allowed and escaped HTML, and long words that wrap. */
export const Everything: Story = { args: { children: reply("l20") } };

/** A table wider than the column scrolls on its own; the numbers are right-aligned. */
export const WideTable: Story = { args: { children: reply("l4") } };

/** Code in SQL, TypeScript (long), Bash and JSON, a state diagram, a link and a footnote. */
export const Code: Story = { args: { children: reply("l8") } };

/** Math from $…$, \(…\), \[…\] and $$…$$; "$3 to $4" stays text. */
export const Math: Story = { args: { children: `${messageText(chatConversation("quadratic").messages[1])}\n\nA bag of rye is about $3 to $4.` } };

/** A flowchart with subgraphs, decisions and styled classes, and a sequence diagram, in the theme's colours. Switch to dark: they are drawn again. */
export const Diagrams: Story = { args: { children: reply("l6") } };

function Streaming({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x >= text.length ? 0 : x + 6)), 40);
    return () => clearInterval(t);
  }, [text]);
  return <ChatMarkdown streaming={n < text.length}>{text.slice(0, n)}</ChatMarkdown>;
}

/** The SQL-and-TypeScript answer arriving six characters at a time, over and over: unfinished fences, tables and formulas are closed for drawing, and the diagram waits for its fence to close. */
export const Arriving: Story = { render: () => <Streaming text={reply("l8")} /> };

/** The small size, as reasoning uses it. */
export const Small: Story = { args: { size: "sm", children: reply("l14") } };
