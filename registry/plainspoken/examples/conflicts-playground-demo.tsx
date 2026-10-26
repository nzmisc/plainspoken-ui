"use client";

import { TICKET } from "@/registry/plainspoken/blocks/conflicts/content";
import { ConflictPlayground } from "@/registry/plainspoken/blocks/conflicts/playground";
import { mergeTextAll, useSim } from "@/registry/plainspoken/blocks/conflicts/sim";
import { SaveStatus, SyncedTextarea } from "@/registry/plainspoken/blocks/conflicts/synced-field";

/**
 * The frame around a deliberately naive text box, to build your own approach in: it saves as you
 * type and merges everything, keeping both where you both typed. Press the buttons and watch the log.
 */
export default function ConflictsPlaygroundDemo() {
  const [sim, state] = useSim({ material: TICKET, policy: "live", mergeAll: mergeTextAll });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={{
        letter: "0",
        name: "Merge everything, ask nothing",
        suits: "Nothing, really: it's the baseline the other approaches improve on.",
        pro: "No interruptions ever.",
        con: "Where two people change the same words, both land, and nobody is told.",
        howTo: (
          <>
            Press <b>Jonas edits the same sentence</b> and read the last sentence.
          </>
        ),
      }}
      renderSide={(side) => (
        <div className="flex flex-col gap-1">
          <SyncedTextarea sim={sim} client={state[side]} label="Description" showPeerCursor />
          <SaveStatus client={state[side]} autosave />
        </div>
      )}
    />
  );
}
