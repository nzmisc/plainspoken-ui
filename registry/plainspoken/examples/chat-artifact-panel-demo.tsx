"use client";

import { useState } from "react";
import { ChatArtifactPanel } from "@/registry/plainspoken/blocks/chat/artifact-panel";
import { showcaseArtifact } from "@/registry/plainspoken/blocks/chat/showcase";

/**
 * A text document with three suggestions from the model: accept or reject them, step through the
 * versions, see the changes, edit it yourself, copy or download it. The quick actions only log here.
 */
export default function ChatArtifactPanelDemo() {
  const [doc, setDoc] = useState(() => showcaseArtifact("doc-store"));
  const [index, setIndex] = useState<number | undefined>();
  return (
    <ChatArtifactPanel
      artifact={doc}
      onChange={setDoc}
      index={index}
      onIndexChange={setIndex}
      onAsk={(prompt) => console.log("ask", prompt)}
      onClose={() => console.log("close")}
      className="h-[600px] max-w-3xl border border-border"
    />
  );
}
