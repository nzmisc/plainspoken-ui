import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatApp } from "@/registry/plainspoken/blocks/chat/chat-app";
import { CHAT_CONVERSATIONS, CHAT_TODAY } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { fakeTransport } from "./fixtures";

const meta: Meta<typeof ChatApp> = {
  title: "Blocks/AI chat/Chat app",
  component: ChatApp,
  parameters: { layout: "fullscreen" },
  // Feedback, copying and sharing say so in a toast
  decorators: [
    (S) => (
      <>
        {S()}
        <Toaster />
      </>
    ),
  ],
  args: {
    transport: fakeTransport(),
    showcase: [CHAT_SHOWCASE],
    defaultConversations: CHAT_CONVERSATIONS,
    demoToday: CHAT_TODAY,
    today: CHAT_TODAY,
    defaultOpenId: "launch",
    className: "h-[720px]",
  },
};
export default meta;
type Story = StoryObj<typeof ChatApp>;

/**
 * The showcase conversation open. Storybook has no API routes, so sending goes to a stand-in that
 * streams a canned answer slowly: try Stop, scroll up while it streams, Regenerate, and Edit. Ask
 * about the weather, or to write notes, code or a sheet, and it calls that tool first: a document
 * opens beside the chat as it is written.
 */
export const Showcase: Story = {};

/** A new chat: the prompts to start from, focus in the box. */
export const NewChat: Story = { args: { defaultOpenId: null } };

/** No conversations at all yet. */
export const Empty: Story = { args: { defaultOpenId: null, showcase: [], defaultConversations: [] } };

/** Every request fails for lack of credit: send something to see the error and Retry. */
export const OutOfCredit: Story = { args: { transport: fakeTransport({ fail: "credit" }), defaultOpenId: "rain" } };

/** The server has no OPENROUTER_API_KEY: a notice takes the composer's place; conversations can still be read. */
export const MissingKey: Story = { args: { missingKey: true } };

/** Thinking off by default. */
export const ThinkingOff: Story = { args: { defaultThinking: false, defaultOpenId: "rain" } };

/** A phone: one column; the menu button opens the conversations as a drawer. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };
