import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CONTACTS } from "@/registry/plainspoken/blocks/mail/data";
import { MailComposeDialog } from "@/registry/plainspoken/blocks/mail/compose";

const meta: Meta<typeof MailComposeDialog> = {
  title: "Blocks/Mail/Compose dialog",
  component: MailComposeDialog,
  parameters: { layout: "fullscreen" },
  args: { open: true, onClose: () => {}, contacts: CONTACTS },
  decorators: [(S) => <div className="min-h-[720px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof MailComposeDialog>;

/** A new message: focus starts in To. Type a name for suggestions; Cc appears when asked for. */
export const NewMessage: Story = {};

/** A saved draft opened again: recipients, Cc, subject, text and an attached file. */
export const Draft: Story = {
  args: {
    initial: {
      to: [CONTACTS[1]],
      cc: [CONTACTS[0]],
      subject: "Studio newsletter: autumn",
      body: "Lena, a first go at the autumn newsletter, can you check the dates?\n\nThis autumn we finished the Kestrel catalogue, started a new identity for Lumen Dental, and moved",
      attachments: [{ name: "autumn-photos.zip", size: 18_400_000, kind: "zip" }],
    },
  },
};

/** On a phone it fills the screen. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
