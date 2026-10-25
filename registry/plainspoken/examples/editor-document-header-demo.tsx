"use client";

import { useState } from "react";
import type { DocStatus } from "@/registry/plainspoken/blocks/editor/data";
import { EditorDocumentHeader } from "@/registry/plainspoken/blocks/editor/document-header";

/** A draft: edit the title, press Publish (and Unpublish), open the menu. */
export default function EditorDocumentHeaderDemo() {
  const [title, setTitle] = useState("Autumn offsite: plan");
  const [status, setStatus] = useState<DocStatus>("draft");
  return (
    <div className="max-w-3xl border border-border">
      <EditorDocumentHeader
        title={title}
        onTitleChange={setTitle}
        status={status}
        onStatusChange={setStatus}
        section="The studio"
        words={142}
        save={{ at: "2026-10-24T15:31:00Z", by: "Maren Okafor", now: "2026-10-24T15:40:00Z" }}
        className="border-b-0"
      />
    </div>
  );
}
