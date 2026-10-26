"use client";

import { useState } from "react";
import { MilkdownEditor, type EditorMode } from "@/registry/plainspoken/ui/milkdown-editor";

const MINUTES = `### Depot meeting, 4 March

Present: Ines, Callum, Wiremu. **Decided:** the cargo bikes get new brake pads before the spring rush.

1. Order pads from the usual supplier
2. Book the workshop for a Saturday`;

/**
 * Write, Markdown and Preview, here controlled from outside: the buttons above and the switch in
 * the editor's own toolbar change the same mode. Edit in one, switch, and the text is the same.
 */
export default function MilkdownEditorModes() {
  const [mode, setMode] = useState<EditorMode>("markdown");
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <p className="text-[13px] text-muted-foreground">
        Mode: <strong className="text-foreground">{mode}</strong>
      </p>
      <MilkdownEditor aria-label="Meeting minutes" defaultValue={MINUTES} mode={mode} onModeChange={setMode} />
    </div>
  );
}
