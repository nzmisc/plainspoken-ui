import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ChatShareDialog } from "@/registry/plainspoken/blocks/chat/share-dialog";
import { chatConversation } from "@/registry/plainspoken/blocks/chat/data";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";
import { Button } from "@/registry/plainspoken/ui/button";
import type { ChatConversation } from "@/registry/plainspoken/blocks/chat/data";

function Share({ conversation }: { conversation: ChatConversation }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Share a link…</Button>
      <ChatShareDialog open={open} onClose={() => setOpen(false)} conversation={conversation} baseUrl="https://plainspoken-ui.example/demos/chat" />
    </>
  );
}

const meta: Meta<typeof Share> = {
  title: "Blocks/AI chat/Share dialog",
  component: Share,
  args: { conversation: CHAT_SHOWCASE },
};
export default meta;
type Story = StoryObj<typeof Share>;

/**
 * The showcase as a link: its three documents can be left in or out, and its reasoning; the files
 * never go in, only their names. Its size is shown, with a warning past what links safely hold.
 */
export const WithDocuments: Story = {};

/** A short conversation: just the link and Copy. */
export const Short: Story = { args: { conversation: chatConversation("rain") } };
