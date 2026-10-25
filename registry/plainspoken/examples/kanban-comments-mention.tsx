"use client";

import { useState } from "react";
import { CommentBox, CommentText } from "@/registry/plainspoken/blocks/kanban/comments";

/**
 * The comment box alone. Type @ and a letter or two: the people who match are suggested under the
 * box. ↑ and ↓ choose, Enter or Tab puts the name in, Escape closes the list. Ctrl+Enter sends.
 */
export default function KanbanCommentsMention() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="flex max-w-lg flex-col gap-3">
      <CommentBox onSubmit={(text) => setSent((s) => [...s, text])} defaultValue="Ready for review. @" />
      {sent.map((text, i) => (
        <CommentText key={i} text={text} className="border-t border-border pt-2" />
      ))}
    </div>
  );
}
