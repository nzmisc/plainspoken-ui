import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { ChatAttachment } from "@/registry/plainspoken/blocks/chat/attachments";
import { ChatAttachmentChips, ChatFileList } from "@/registry/plainspoken/blocks/chat/attachment-chips";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";

const ATTACHED: ChatAttachment[] = [
  { id: "a1", name: "landing-draft.png", mediaType: "image/png", size: 182_400, url: "/demos/chat/landing-draft.png", status: "ready" },
  { id: "a2", name: "tidewater-brief.pdf", mediaType: "application/pdf", size: 48_100, url: "/demos/chat/tidewater-brief.pdf", status: "ready" },
  { id: "a3", name: "test-page.csv", mediaType: "text/csv", size: 2_300, url: "/demos/chat/test-page.csv", status: "ready" },
  { id: "a4", name: "harbour-photos.heic", mediaType: "image/heic", size: 3_400_000, status: "error", error: "Not a kind of file the models can read" },
  { id: "a5", name: "tide-tables-2027.pdf", mediaType: "application/pdf", size: 1_200_000, status: "reading" },
];

const sent = CHAT_SHOWCASE.messages.find((m) => m.id === "l23")!;
const files = sent.parts.filter((p) => p.type === "file");

function Removable({ attachments }: { attachments: ChatAttachment[] }) {
  const [list, setList] = useState(attachments);
  return <ChatAttachmentChips attachments={list} onRemove={(id) => setList((l) => l.filter((a) => a.id !== id))} />;
}

const meta: Meta<typeof ChatAttachmentChips> = {
  title: "Blocks/AI chat/Attachment chips",
  component: ChatAttachmentChips,
  args: { attachments: ATTACHED },
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatAttachmentChips>;

/**
 * Above the message box, before sending: a thumbnail or the kind of file, its name and size, and
 * remove. A file being read shows a spinner; one that can't be sent says why, in red.
 */
export const Chips: Story = { render: (args) => <Removable attachments={args.attachments} /> };

/** Without remove: while an answer streams, or when the files are only shown. */
export const ReadOnly: Story = {};

/**
 * The files of a sent question, above it: pictures as thumbnails, other files as cards. Each opens
 * full size in a viewer (PDFs in the browser's own reader, text as text).
 */
export const SentFiles: Story = { render: () => <ChatFileList files={files} sizes={sent.metadata?.sizes} align="end" /> };

/** Large: a picture the model made, at its own size. */
export const Large: Story = { render: () => <ChatFileList files={[{ type: "file", mediaType: "image/svg+xml", filename: "icon-concepts.svg", url: "/demos/chat/icon-concepts.svg" }]} large /> };
