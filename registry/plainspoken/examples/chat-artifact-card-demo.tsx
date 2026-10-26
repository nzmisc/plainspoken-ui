"use client";

import { useState } from "react";
import { ChatArtifactCard } from "@/registry/plainspoken/blocks/chat/artifact-card";
import { showcaseArtifact, showcaseToolPart } from "@/registry/plainspoken/blocks/chat/showcase";

/**
 * What document tool calls look like in an answer: a document made (Open marks it as the one
 * open), a change, and suggestions.
 */
export default function ChatArtifactCardDemo() {
  const [open, setOpen] = useState<string | null>(null);
  const onOpen = ({ callId }: { callId: string }) => setOpen(callId);
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <ChatArtifactCard part={showcaseToolPart("call-store-1")} artifact={showcaseArtifact("doc-store")} onOpen={onOpen} active={open === "call-store-1"} />
      <ChatArtifactCard part={showcaseToolPart("call-store-2")} onOpen={onOpen} />
      <ChatArtifactCard part={showcaseToolPart("call-store-3")} onOpen={onOpen} />
      <ChatArtifactCard part={showcaseToolPart("call-budget-1")} artifact={showcaseArtifact("doc-budget")} onOpen={onOpen} active={open === "call-budget-1"} />
    </div>
  );
}
