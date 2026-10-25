import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CHAT_SUGGESTIONS, chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_ERRORS } from "@/registry/plainspoken/blocks/chat/format";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";
import { ChatThread } from "@/registry/plainspoken/blocks/chat/thread";

const meta: Meta<typeof ChatThread> = {
  title: "Blocks/AI chat/Thread",
  component: ChatThread,
  parameters: { layout: "fullscreen" },
  args: { messages: CHAT_SHOWCASE.messages, onRegenerate: () => {}, onEdit: () => {}, onRetry: () => {}, className: "h-[640px] border-b border-border" },
};
export default meta;
type Story = StoryObj<typeof ChatThread>;

/**
 * The showcase conversation, opened at the end. Scroll up and "Jump to latest" appears; the
 * scrolling area takes focus, so arrow keys and Page Up/Down work.
 */
export const Conversation: Story = {};

/** A new conversation: prompts to start from. */
export const Empty: Story = { args: { messages: [], suggestions: CHAT_SUGGESTIONS, onSuggestion: () => {} } };

/** Sent, waiting for the first words. The live region says "Sent. Waiting for Claude Haiku 5.5." */
export const Waiting: Story = { args: { messages: chatConversation("rain").messages.slice(0, 1), status: "submitted", pendingModel: "anthropic/claude-haiku-5.5" } };

/** Out of credit: the reason after the last message, and Retry. */
export const OutOfCredit: Story = { args: { messages: chatConversation("rain").messages.slice(0, 1), status: "error", error: { code: "credit", message: CHAT_ERRORS.credit.body } } };

/** The network failed partway through an answer: what arrived stays above the error. */
export const NetworkError: Story = {
  args: {
    messages: [chatConversation("rain").messages[0], { ...chatConversation("rain").messages[1], parts: [{ type: "text", text: "### Keep dry\n\n- [x] A waterproof jacket" }] }],
    status: "error",
    error: { code: "network", message: CHAT_ERRORS.network.body },
  },
};

/** Rate-limited. */
export const RateLimited: Story = { args: { messages: chatConversation("rain").messages.slice(0, 1), status: "error", error: { code: "rate-limit", message: CHAT_ERRORS["rate-limit"].body } } };

/** A question whose answer never came (the page was closed while it streamed): "Get an answer". */
export const NoAnswer: Story = { args: { messages: chatConversation("rain").messages.slice(0, 1) } };

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };
