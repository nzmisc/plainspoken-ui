"use client";

import { useState } from "react";
import { ChatPromptFill, ChatPromptLibrary } from "@/registry/plainspoken/blocks/chat/prompt-library";
import { CHAT_PROMPTS, type ChatPrompt } from "@/registry/plainspoken/blocks/chat/data";
import { Button } from "@/registry/plainspoken/ui/button";

/**
 * The saved prompts: add, change or delete one. Use fills in its {{blanks}} first, then the text
 * would go into the message box (here it is shown below).
 */
export default function ChatPromptLibraryDemo() {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState(CHAT_PROMPTS);
  const [filling, setFilling] = useState<ChatPrompt | null>(null);
  const [text, setText] = useState("");
  return (
    <div className="flex max-w-xl flex-col items-start gap-3">
      <Button onClick={() => setOpen(true)}>Prompts</Button>
      {text && <p className="w-full border border-border bg-muted px-3 py-2 whitespace-pre-wrap">{text}</p>}
      <ChatPromptLibrary
        open={open}
        onClose={() => setOpen(false)}
        prompts={prompts}
        onChange={setPrompts}
        onUse={(p) => {
          setOpen(false);
          if (p.text.includes("{{")) setFilling(p);
          else setText(p.text);
        }}
      />
      <ChatPromptFill prompt={filling} onClose={() => setFilling(null)} onUse={(t) => (setText(t), setFilling(null))} />
    </div>
  );
}
