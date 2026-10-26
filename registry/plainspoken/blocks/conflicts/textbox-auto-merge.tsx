"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { diffWords, merge3 } from "@/registry/plainspoken/lib/diff";
import { CircleCheck, TriangleAlert, X } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Diff } from "@/registry/plainspoken/ui/diff";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { MergedText } from "@/registry/plainspoken/ui/merge-conflict";
import { PERSON_COLORS, firstName } from "@/registry/plainspoken/ui/presence";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { TICKET } from "@/registry/plainspoken/blocks/conflicts/content";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { mergeText, mergeTextAll, useSim, type ClientState, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, SyncedTextarea, TicketHeader, peerDoing } from "@/registry/plainspoken/blocks/conflicts/synced-field";

export const AUTO_MERGE_INFO: ApproachInfo = {
  letter: "D",
  name: "Automatic three-way merge",
  suits: "Text that saves as you type and is shared by a few people: descriptions, notes, comments being edited, offline-capable apps.",
  pro: "Most of the time nobody notices anything: changes in different places just combine, and only real clashes ask, right where they are.",
  con: "A clean merge can still read wrong (two edits that each make sense but not together), so it must say what it did and offer Undo.",
  howTo: (
    <>
      Press <b>Jonas edits a different sentence</b> while you type elsewhere: it merges and says so. Then <b>Jonas edits the same sentence</b>: only “Friday”
      is marked.
    </>
  ),
};

/** "Merged Jonas's change", with what it changed and Undo */
function MergedNote({ sim, client, side }: { sim: Sim; client: ClientState; side: Side }) {
  const m = client.merged!;
  const who = firstName(m.theirs.author);
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1 text-[13px]">
      <div className="ctl-xs flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-success">
          <Icon icon={CircleCheck} className="mr-1" />
          Merged {who}&apos;s change{m.offline ? " from while you were offline" : ""}
        </span>
        <RelativeTime date={m.at} format="short" className="text-muted-foreground" />
        <Button size="xs" variant="link" aria-expanded={show} onClick={() => setShow(!show)}>
          {show ? "Hide" : "Show"}
        </Button>
        <Button size="xs" variant="link" onClick={() => sim.undoMerge(side)}>
          Undo
        </Button>
        <IconButton size="xs" variant="ghost" icon={X} label="Dismiss" onClick={() => sim.dismissMerged(side)} className="text-muted-foreground" />
      </div>
      {show && <Diff parts={diffWords(m.mine, m.result)} className="border-l-2 border-border pl-2" />}
    </div>
  );
}

/** While a part needs you: the merged text read-only, with the clash marked inline */
function Settle({ sim, client, side, onDone }: { sim: Sim; client: ClientState; side: Side; onDone: () => void }) {
  const r = client.resolving!;
  const who = firstName(r.theirs.author);
  const result = useMemo(() => merge3(r.base, r.mine, r.theirs.text), [r.base, r.mine, r.theirs.text]);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[14px] font-semibold" id={`${side}-settle-label`}>
        Description
      </span>
      <p className="text-[13px] text-warning">
        <Icon icon={TriangleAlert} className="mr-1" />
        {who} changed the same words as you{r.offline ? " while you were offline" : ""}. Everything else is merged; choose a version for the marked part.
      </p>
      <div role="group" aria-labelledby={`${side}-settle-label`} className="border border-input bg-background px-2 py-1">
        <MergedText
          key={r.theirs.version}
          result={result}
          mineLabel="You"
          theirsLabel={who}
          labels={{ theirs: `${who}'s` }}
          theirsClassName={PERSON_COLORS[r.theirs.author.color].tint}
          onDone={(text) => {
            sim.resolve(side, text);
            onDone();
          }}
        />
      </div>
    </div>
  );
}

/** One person's screen: a field that merges others' changes in as they arrive */
export function AutoMergeField({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c = state[side];
  const doing = peerDoing(c);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [refocus, setRefocus] = useState(false);
  // Back to the text box after settling: the keyboard was on a button that is gone
  useEffect(() => {
    if (refocus && !c.resolving) {
      ref.current?.focus();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off after settling
      setRefocus(false);
    }
  }, [refocus, c.resolving]);
  return (
    <div className="flex flex-col gap-2">
      <TicketHeader client={c} caption={doing} />
      {c.resolving ? (
        <Settle sim={sim} client={c} side={side} onDone={() => setRefocus(true)} />
      ) : (
        <SyncedTextarea sim={sim} client={c} label="Description" textareaRef={ref} showPeerCursor />
      )}
      {c.merged && !c.resolving && <MergedNote key={c.merged.at} sim={sim} client={c} side={side} />}
      <SaveStatus client={c} autosave />
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface TextboxAutoMergeProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach D for a text box: saves as you type and merges other people's changes in (three-way,
 * by words), keeping your caret where it was. A clean merge says so, with Show and Undo. Where
 * you both changed the same words, the box turns into the merged text with only that stretch
 * marked, both versions side by side and a button for each.
 */
export function TextboxAutoMerge({ defaultSplit, hideInfo, autoplay, className }: TextboxAutoMergeProps) {
  const [sim, state] = useSim({ material: TICKET, policy: "merge", merge: mergeText, mergeAll: mergeTextAll });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={AUTO_MERGE_INFO}
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <AutoMergeField sim={sim} state={state} side={side} />}
    />
  );
}
