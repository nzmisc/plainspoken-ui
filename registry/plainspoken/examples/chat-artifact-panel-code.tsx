"use client";

import { useState } from "react";
import { ChatArtifactPanel } from "@/registry/plainspoken/blocks/chat/artifact-panel";
import { showcaseArtifact } from "@/registry/plainspoken/blocks/chat/showcase";

/**
 * A TypeScript document: press Run and it runs in a sandboxed frame with no network, its console
 * below. Edit it and run it again.
 */
export default function ChatArtifactPanelCode() {
  const [doc, setDoc] = useState(() => showcaseArtifact("doc-window"));
  const [index, setIndex] = useState<number | undefined>();
  return <ChatArtifactPanel artifact={doc} onChange={setDoc} index={index} onIndexChange={setIndex} onClose={() => {}} className="h-[600px] max-w-3xl border border-border" />;
}
