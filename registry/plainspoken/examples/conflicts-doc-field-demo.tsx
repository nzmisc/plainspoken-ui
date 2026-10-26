"use client";

import { Button } from "@/registry/plainspoken/ui/button";
import { CHECKLIST, PRIYA } from "@/registry/plainspoken/blocks/conflicts/content";
import { SyncedEditor } from "@/registry/plainspoken/blocks/conflicts/doc-field";
import { mergeDocAll, useSim } from "@/registry/plainspoken/blocks/conflicts/sim";

/**
 * The rich text editor bound to the pretend server. Click into a paragraph, then press the button:
 * Jonas types into another one, his caret and “is editing” mark move with him, and yours stays where
 * you left it. Priya's selection sits on “order dashboard”.
 */
export default function ConflictsDocFieldDemo() {
  const [sim, state] = useSim({ material: CHECKLIST, policy: "live", mergeAll: mergeDocAll });
  return (
    <div className="flex flex-col gap-2">
      <Button className="self-start" size="sm" disabled={!!state.running} onClick={() => void sim.run("other")}>
        Jonas edits a different paragraph
      </Button>
      <SyncedEditor sim={sim} client={state.you} label="Launch checklist" showPeerCursor showBlockMarks watchers={[{ person: PRIYA, find: "order dashboard" }]} />
    </div>
  );
}
