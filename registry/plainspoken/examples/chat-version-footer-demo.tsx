"use client";

import { useState } from "react";
import { ChatVersionFooter } from "@/registry/plainspoken/blocks/chat/version-footer";
import { showcaseArtifact } from "@/registry/plainspoken/blocks/chat/showcase";

const versions = showcaseArtifact("doc-store").versions;

/** Under a document: step through its versions; an older one has Restore and Latest. */
export default function ChatVersionFooterDemo() {
  const [index, setIndex] = useState(0);
  const [diff, setDiff] = useState(false);
  return (
    <ChatVersionFooter
      versions={versions}
      index={index}
      onIndexChange={setIndex}
      diff={diff}
      onDiffChange={setDiff}
      onRestore={(i) => console.log("restore", i)}
      className="max-w-2xl border border-border"
    />
  );
}
