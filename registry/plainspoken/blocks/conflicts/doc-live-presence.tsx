"use client";

import { CHECKLIST, PRIYA } from "@/registry/plainspoken/blocks/conflicts/content";
import { DocHeader, SyncedEditor } from "@/registry/plainspoken/blocks/conflicts/doc-field";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { mergeDocAll, useSim, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, peerDoing } from "@/registry/plainspoken/blocks/conflicts/synced-field";

export const LIVE_PRESENCE_INFO: ApproachInfo = {
  letter: "A",
  name: "Live presence",
  suits: "Documents people write together at the same moment: meeting notes, plans, drafts (Google Docs, Notion, Figma's text).",
  pro: "You see who is where before you collide, and their words arrive as they type; most clashes simply never happen.",
  con: "Needs a live connection and real-time merging (OT or CRDTs) behind it; when two people do type in one spot, both edits land and the words get mangled.",
  howTo: (
    <>
      Click into a paragraph, then press <b>Jonas edits a different paragraph</b>: his caret and words appear, yours stays put. Then try{" "}
      <b>Jonas edits the same sentence</b>.
    </>
  ),
};

const WATCHERS = [{ person: PRIYA, find: "order dashboard" }];

/** One person's screen: the editor with everyone's carets and "is editing" marks */
export function LivePresenceDoc({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c = state[side];
  return (
    <div className="flex flex-col gap-2">
      <DocHeader client={c} extra={c.online ? [{ person: PRIYA, status: "reading" }] : []} caption={peerDoing(c)} />
      <SyncedEditor sim={sim} client={c} label="Launch checklist" showPeerCursor showBlockMarks watchers={WATCHERS} />
      <SaveStatus client={c} autosave />
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface DocLivePresenceProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach A for a rich text document: everyone's caret and selection in their colour with their
 * name, a mark beside the paragraph each person is in, and changes that flow in a few times a
 * second, merged as they come (keeping both where two people typed in one spot). Your caret
 * stays on your words while theirs arrive.
 */
export function DocLivePresence({ defaultSplit, hideInfo, autoplay, className }: DocLivePresenceProps) {
  const [sim, state] = useSim({ material: CHECKLIST, policy: "live", mergeAll: mergeDocAll });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={LIVE_PRESENCE_INFO}
      kind="doc"
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <LivePresenceDoc sim={sim} state={state} side={side} />}
    />
  );
}
