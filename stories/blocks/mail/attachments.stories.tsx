import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AttachmentPicture, MailAttachments } from "@/registry/plainspoken/blocks/mail/attachments";

const MB = 1024 * 1024;

const meta: Meta<typeof MailAttachments> = {
  title: "Blocks/Mail/Attachments",
  component: MailAttachments,
  args: {
    attachments: [
      { name: "IMG_2041.jpg", size: 3.8 * MB, kind: "image" },
      { name: "lumen-mark-small-sizes.pdf", size: 1.1 * MB, kind: "pdf" },
      { name: "Q3-receipts-checklist.xlsx", size: 31 * 1024, kind: "sheet" },
      { name: "festival-poster-copy-final.docx", size: 42 * 1024, kind: "doc" },
      { name: "Kestrel-brand-2024.zip", size: 86.4 * MB, kind: "zip" },
    ],
  },
};
export default meta;
type Story = StoryObj<typeof MailAttachments>;

/** In a received message: a count and total, then the chips. Click one for the preview dialog. */
export const Received: Story = {};

/** In the compose box: no thumbnails, a × on each. */
export const Removable: Story = { args: { onRemove: () => {} } };

/** A long name is cut short with an ellipsis; the full name is in the preview's title. */
export const LongName: Story = { args: { attachments: [{ name: "Kestrel-SS27-catalogue-proof-v3-comments-from-marketing-final.pdf", size: 14.2 * MB, kind: "pdf" }] } };

/** The stand-in pictures, drawn from the file name: the same name always gives the same picture. */
export const Pictures: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {["IMG_2041.jpg", "IMG_2047.jpg", "IMG_2058.jpg", "cover-B-white-logo.png", "favicon-preview.png"].map((n) => (
        <AttachmentPicture key={n} name={n} className="h-24 w-36 border border-border" />
      ))}
    </div>
  ),
};
