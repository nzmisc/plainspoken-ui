import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatApp } from "@/registry/plainspoken/blocks/chat/chat-app";
import { CHAT_CONVERSATIONS, CHAT_TODAY } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { fakeTransport } from "../blocks/chat/fixtures";

const meta: Meta<typeof ChatApp> = {
  title: "Demos/AI chat",
  component: ChatApp,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "760px" } } },
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
    defaultOpenId: CHAT_SHOWCASE.id,
    className: "h-dvh",
  },
};
export default meta;
type Story = StoryObj<typeof ChatApp>;

/**
 * The demo as it is at /demos/chat, Parley, open on the showcase conversation: planning the launch
 * of a tide-times app, with tables, code, math, diagrams and reasoning. On the site it talks to
 * real models through OpenRouter; here a stand-in streams a canned answer.
 */
export const Launch: Story = {};

/** A new chat. */
export const NewChat: Story = { args: { defaultOpenId: null } };

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
