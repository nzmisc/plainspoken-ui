"use client";

import { useState } from "react";
import { ChatModelPicker } from "@/registry/plainspoken/blocks/chat/model-picker";

/** The cheap fast models, then the stronger one, each with its price per million tokens in and out. */
export default function ChatModelPickerDemo() {
  const [model, setModel] = useState("anthropic/claude-sonnet-5.5");
  return <ChatModelPicker value={model} onChange={setModel} />;
}
