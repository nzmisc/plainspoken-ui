"use client";

import { useState } from "react";
import type { ChatAttachment } from "@/registry/plainspoken/blocks/chat/attachments";
import { ChatAttachmentChips, ChatFileList } from "@/registry/plainspoken/blocks/chat/attachment-chips";

const ATTACHED: ChatAttachment[] = [
  { id: "a1", name: "landing-draft.png", mediaType: "image/png", size: 182_400, url: "/demos/chat/landing-draft.png", status: "ready" },
  { id: "a2", name: "tidewater-brief.pdf", mediaType: "application/pdf", size: 48_100, url: "/demos/chat/tidewater-brief.pdf", status: "ready" },
  { id: "a3", name: "tide-tables-2027.pdf", mediaType: "application/pdf", size: 1_200_000, status: "reading" },
  { id: "a4", name: "harbour.heic", mediaType: "image/heic", size: 3_400_000, status: "error", error: "Not a kind of file the models can read" },
];

/**
 * Before sending, the chips above the box (remove one with ×); after, the files above the question,
 * each opening full size.
 */
export default function ChatAttachmentsDemo() {
  const [list, setList] = useState(ATTACHED);
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <ChatAttachmentChips attachments={list} onRemove={(id) => setList((l) => l.filter((a) => a.id !== id))} />
      <ChatFileList
        align="end"
        files={[
          { type: "file", mediaType: "image/png", filename: "landing-draft.png", url: "/demos/chat/landing-draft.png" },
          { type: "file", mediaType: "application/pdf", filename: "tidewater-brief.pdf", url: "/demos/chat/tidewater-brief.pdf" },
          { type: "file", mediaType: "text/csv", filename: "test-page.csv", url: "/demos/chat/test-page.csv" },
        ]}
        sizes={{ "landing-draft.png": 182_400, "tidewater-brief.pdf": 48_100, "test-page.csv": 2_300 }}
      />
    </div>
  );
}
