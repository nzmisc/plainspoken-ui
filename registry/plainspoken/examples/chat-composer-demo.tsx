"use client";

import { useState } from "react";
import { Brain } from "@/registry/plainspoken/lib/icons";
import { ChatComposer } from "@/registry/plainspoken/blocks/chat/composer";
import { ChatModelPicker } from "@/registry/plainspoken/blocks/chat/model-picker";
import { DEFAULT_CHAT_MODEL } from "@/registry/plainspoken/blocks/chat/models";
import { Toggle } from "@/registry/plainspoken/ui/toggle";

/**
 * Type a few lines (Shift+Enter for a new one) and watch the box grow; Enter sends. The model
 * picker and a toggle sit under it as tools.
 */
export default function ChatComposerDemo() {
  const [model, setModel] = useState(DEFAULT_CHAT_MODEL);
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <ChatComposer
        onSend={setSent}
        placeholder="Message Claude Haiku 5.5"
        tools={
          <>
            <ChatModelPicker value={model} onChange={setModel} />
            <Toggle variant="ghost" icon={Brain} defaultPressed>
              Thinking
            </Toggle>
          </>
        }
      />
      <p className="text-[13px] text-muted-foreground" aria-live="polite">
        {sent ? `Sent: “${sent}”` : "Nothing sent yet."}
      </p>
    </div>
  );
}
