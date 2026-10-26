"use client";

import { useState } from "react";
import { DEFAULT_DISPLAY, type ErdDisplay } from "@/registry/plainspoken/blocks/erd/model";
import { ErdToolbar } from "@/registry/plainspoken/blocks/erd/toolbar";

/** The tools over the diagram; here they only report what was asked. Undo is named after what it would undo. */
export default function ErdToolbarDemo() {
  const [display, setDisplay] = useState<ErdDisplay>(DEFAULT_DISPLAY);
  const [last, setLast] = useState("—");
  const say = (what: string) => () => setLast(what);
  return (
    <div className="flex flex-col gap-2">
      <ErdToolbar
        display={display}
        onDisplayChange={(patch) => {
          setDisplay((d) => ({ ...d, ...patch }));
          setLast(`Display: ${JSON.stringify(patch)}`);
        }}
        undo="Renamed orders to purchases"
        redo={null}
        onUndo={say("Undo")}
        onRedo={say("Redo")}
        onAddTable={say("Add table")}
        onAutoLayout={say("Auto-layout")}
        onResetLayout={say("Reset layout")}
        onCollapseAll={(on) => setLast(on ? "Fold all" : "Open all")}
        onImport={say("Import")}
        onExport={(kind) => setLast(`Export ${kind}`)}
        className="border border-border"
      />
      <p className="text-[13px] text-muted-foreground" aria-live="polite">
        Last: {last}
      </p>
    </div>
  );
}
