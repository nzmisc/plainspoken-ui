"use client";

import { useState } from "react";
import { ChatBranchPicker } from "@/registry/plainspoken/blocks/chat/branch-picker";

const ANSWERS = ["Spring tides come with the new and full Moon.", "The biggest tides follow a new or full Moon by a day or two.", "Around the new and full Moon, when Sun and Moon pull in line."];

/** Three answers to one question: step through them. */
export default function ChatBranchPickerDemo() {
  const [index, setIndex] = useState(2);
  return (
    <div className="flex max-w-xl flex-col gap-1">
      <p>{ANSWERS[index]}</p>
      <ChatBranchPicker index={index} count={ANSWERS.length} of="answer" onChange={(step) => setIndex((i) => i + step)} className="-ml-2" />
    </div>
  );
}
