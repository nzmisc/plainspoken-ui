import { MailAttachments } from "@/registry/plainspoken/blocks/mail/attachments";

/** Pictures get a thumbnail, other files a symbol. Click one for the preview. */
export default function MailAttachmentsDemo() {
  return (
    <MailAttachments
      attachments={[
        { name: "IMG_2041.jpg", size: 3.8 * 1024 * 1024, kind: "image" },
        { name: "lumen-mark-small-sizes.pdf", size: 1.1 * 1024 * 1024, kind: "pdf" },
        { name: "Q3-receipts-checklist.xlsx", size: 31 * 1024, kind: "sheet" },
        { name: "Kestrel-brand-2024.zip", size: 86.4 * 1024 * 1024, kind: "zip" },
      ]}
    />
  );
}
