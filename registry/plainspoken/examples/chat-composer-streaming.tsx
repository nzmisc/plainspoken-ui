"use client";

import { useState } from "react";
import { ChatComposer } from "@/registry/plainspoken/blocks/chat/composer";

/** While an answer streams the send button is Stop, in the same place. Press it to stop. */
export default function ChatComposerStreaming() {
  const [streaming, setStreaming] = useState(true);
  return (
    <ChatComposer
      className="max-w-3xl"
      streaming={streaming}
      onStop={() => setStreaming(false)}
      onSend={() => setStreaming(true)}
      defaultValue="And what about the second week?"
    />
  );
}
