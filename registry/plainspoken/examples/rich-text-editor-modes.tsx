"use client";

import { useState } from "react";
import { RichTextEditor, type EditorMode } from "@/registry/plainspoken/ui/rich-text-editor";

const AGENDA = `# Planning, Thursday

**Present:** Maren, Tobias, Irena

- [x] Agree the launch date
- [ ] Draft the announcement
  - [ ] Pictures from the studio
- [ ] Book the room for the retro

Next meeting: *Thursday 6 November*, same time.`;

/**
 * One Markdown string, three ways to look at it. This one starts in Markdown mode; edit the
 * source, then switch to Write or Preview. The value and the mode are both controlled here: the
 * line under the editor shows what onChange and onModeChange hand you.
 */
export default function RichTextEditorModes() {
  const [value, setValue] = useState(AGENDA);
  const [mode, setMode] = useState<EditorMode>("markdown");
  return (
    <div className="flex max-w-2xl flex-col gap-1.5">
      <RichTextEditor aria-label="Meeting notes" value={value} onChange={setValue} mode={mode} onModeChange={setMode} />
      <p className="text-[13px] text-muted-foreground tabular-nums">
        Mode: {mode}. Markdown: {value.length} characters, {value.split("\n").length} lines.
      </p>
    </div>
  );
}
