import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { MailApp } from "@/registry/plainspoken/blocks/mail/mail-app";
import { Toaster, toast } from "@/registry/plainspoken/ui/toast";

const meta: Meta<typeof MailApp> = {
  title: "Blocks/Mail/Mail app",
  component: MailApp,
  parameters: { layout: "fullscreen" },
  args: { defaultOpenId: "catalogue", className: "h-[720px]" },
};
export default meta;
type Story = StoryObj<typeof MailApp>;

/**
 * Three panes: folders, the inbox, and an unread conversation. Drag the line between list and
 * message (or focus it and use ←/→); "Collapse" narrows the sidebar to a rail.
 */
export const Inbox: Story = {};

/** Three conversations ticked: the select-all box is part-ticked and the bulk actions replace the count. */
export const Selection: Story = { args: { selected: ["harbour-invoice", "mum-lunch", "vat"] } };

/** Another folder: Sent lists who each message went to. */
export const Sent: Story = { args: { defaultView: "sent", defaultOpenId: "quote-library" } };

/** A label view, across folders. */
export const Label: Story = { args: { defaultView: "label:clients", defaultOpenId: "lumen" } };

/** An empty folder and no conversation open. */
export const NothingOpen: Story = { args: { defaultView: "trash", defaultOpenId: null, threads: [] } };

/** The compose dialog over the app. */
export const Composing: Story = { args: { defaultComposing: true } };

function ArchivedToast() {
  useEffect(() => {
    const id = toast({ title: "Conversation archived", description: "“Sunday lunch?” from Birgitta Lindqvist", action: { label: "Undo", onClick: () => {} }, duration: 0 });
    return () => toast.dismiss(id);
  }, []);
  return <Toaster />;
}

/** What archiving says: a toast with Undo, bottom right (along the bottom on phones). */
export const ArchivedWithUndo: Story = {
  render: (args) => (
    <>
      <MailApp {...args} />
      <ArchivedToast />
    </>
  ),
};

/** A phone: the list first; the menu button opens the folders as a drawer. */
export const PhoneList: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };

/** A phone, reading: the message alone, with "← Inbox" to go back. */
export const PhoneMessage: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh", defaultOpenId: "lumen", defaultPane: "message" } };
