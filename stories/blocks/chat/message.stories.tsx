import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ChatMessage } from "@/registry/plainspoken/blocks/chat/data";
import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { ChatMessageView } from "@/registry/plainspoken/blocks/chat/message";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";

const show = (id: string) => CHAT_SHOWCASE.messages.find((m) => m.id === id)!;
const answer = (text: string, metadata: ChatMessage["metadata"]): ChatMessage => ({ id: "x", role: "assistant", parts: text ? [{ type: "text", text }] : [], metadata });

const meta: Meta<typeof ChatMessageView> = {
  title: "Blocks/AI chat/Message",
  component: ChatMessageView,
  args: { message: show("l1"), onEdit: () => {}, onRegenerate: () => {} },
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatMessageView>;

/** A question: on the right, as typed, with Copy and Edit. */
export const Question: Story = {};

/** A question that was edited and sent again says so. */
export const Edited: Story = { args: { message: show("l9") } };

/** Editing: the question becomes a composer in place. Enter sends it again, Escape or Cancel leaves it. */
export const Editing: Story = { args: { defaultEditing: true, editNote: "Sending replaces the 12 messages below." } };

/** An answer under its model's name, with its reasoning folded above it, Copy and Regenerate. */
export const Answer: Story = { args: { message: show("l2") } };

/** The reasoning opened. */
export const ReasoningOpen: Story = { args: { message: show("l2"), defaultReasoningOpen: true } };

/** Still streaming: no actions yet, and unfinished Markdown is closed for drawing. */
export const Streaming: Story = { args: { message: answer("Here it is, in US dollars:\n\n| Week | Focus |\n| --- | --- |\n| 1 | Prod", { model: "anthropic/claude-haiku-5.5" }), streaming: true } };

/** Before the first word: "Writing…". */
export const Waiting: Story = { args: { message: answer("", { model: "anthropic/claude-haiku-5.5" }), streaming: true } };

/** Stopped by the person. */
export const Stopped: Story = { args: { message: chatConversation("card").messages[1] } };

/** Cut off at the length limit. */
export const CutOff: Story = { args: { message: answer("The first forty years of the club's minutes are mostly about the boathouse roof, which leaked from 1871 until", { model: "openai/gpt-6-luna", finishReason: "length" }) } };

/** All the tokens went on thinking. */
export const ThoughtTooLong: Story = { args: { message: { ...answer("", { model: "qwen/qwen3.8-flash", finishReason: "length", reasoningMs: 41000 }), parts: [{ type: "reasoning", text: "Long reasoning…" }] } } };

/** Declined by the model's content rules. */
export const Declined: Story = { args: { message: answer("", { model: "google/gemini-3.8-flash", finishReason: "content-filter" }) } };

/** No Edit or Regenerate while another answer streams: the actions are simply left out. */
export const NoActions: Story = { args: { message: show("l2"), onRegenerate: undefined } };
