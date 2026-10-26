"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";

const START = `## Handover

The late shift closes the depot at 21:00.

- Lock the bike cage
- Charge the van`;

const NOTES = ["- Empty the parcel lockers", "- Switch off the kettle", "- Note anything broken in the log"];

/**
 * Controlled: the value lives in the page, here shown as it changes. "Add a line" changes it from
 * outside, as a colleague's edit would: only the new line goes in, the caret stays where you left
 * it, and ⌘Z undoes only your own typing.
 */
export default function MilkdownEditorControlled() {
  const [value, setValue] = useState(START);
  const [n, setN] = useState(0);
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          disabled={n >= NOTES.length}
          onClick={() => {
            setValue((v) => `${v}\n${NOTES[n]}`);
            setN(n + 1);
          }}
        >
          Add a line from outside
        </Button>
        <span className="text-[13px] text-muted-foreground tabular-nums">{value.length} characters</span>
      </div>
      <MilkdownEditor aria-label="Handover" value={value} onChange={setValue} />
      <pre className="max-h-40 overflow-auto border border-border bg-muted p-2 text-[12px] whitespace-pre-wrap">{value}</pre>
    </div>
  );
}
