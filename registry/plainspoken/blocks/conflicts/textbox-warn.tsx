"use client";

import { useMemo, useState } from "react";
import { merge3, mergedText } from "@/registry/plainspoken/lib/diff";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Diff, DiffLegend } from "@/registry/plainspoken/ui/diff";
import { MergedText } from "@/registry/plainspoken/ui/merge-conflict";
import { firstName } from "@/registry/plainspoken/ui/presence";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { TICKET } from "@/registry/plainspoken/blocks/conflicts/content";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { useSim, type ClientState, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, SyncedTextarea, TicketHeader, peerDoing } from "@/registry/plainspoken/blocks/conflicts/synced-field";

export const WARN_INFO: ApproachInfo = {
  letter: "B",
  name: "Warn while typing",
  suits: "Forms with a Save button where people take their time: descriptions, settings, anything edited for minutes rather than seconds.",
  pro: "You hear about the other change as soon as it lands, while it's still easy to reconcile, and nothing you typed is ever touched.",
  con: "You have to stop and decide, and people tend to ignore notices; it needs a live connection to the server.",
  howTo: (
    <>
      Start typing in the box, then press <b>Jonas edits the same sentence</b>. Read the notice, open <b>See changes</b>, and try <b>Merge</b>.
    </>
  ),
};

/** The notice under the field when someone else saved while you were typing */
function ChangedNotice({ sim, client, side }: { sim: Sim; client: ClientState; side: Side }) {
  const inc = client.incoming!;
  const who = firstName(inc.rev.author);
  const [open, setOpen] = useState<"changes" | "merge" | null>(null);
  const merge = useMemo(() => merge3(client.base.text, client.text, inc.rev.text), [client.base.text, client.text, inc.rev.text]);
  const id = `${side}-changed`;
  return (
    <Alert
      id={id}
      variant={inc.blocked ? "destructive" : "warning"}
      announce={false}
      title={
        inc.blocked ? (
          <>Not saved: {who} saved a newer version</>
        ) : (
          <>
            {who} changed this <RelativeTime date={inc.rev.at} format="short" />
            {inc.offline && " (while you were offline)"}
          </>
        )
      }
      actions={
        <>
          <Button aria-expanded={open === "changes"} onClick={() => setOpen(open === "changes" ? null : "changes")}>
            {open === "changes" ? "Hide changes" : "See changes"}
          </Button>
          <Button onClick={() => sim.takeTheirs(side)}>Use {who}&apos;s</Button>
          <Button onClick={() => sim.keepMine(side)}>Keep mine</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (merge.conflicts === 0) sim.resolve(side, mergedText(merge));
              else setOpen("merge");
            }}
          >
            Merge
          </Button>
        </>
      }
    >
      <p className="text-[13px]">
        {inc.blocked
          ? `Your text is still here. Choose how to combine it with ${who}'s, then save again.`
          : `Your unsaved text is still here, untouched. ${merge.conflicts ? `You both changed the same words, so Merge will ask about ${merge.conflicts === 1 ? "that part" : "those parts"}.` : "Your changes don't overlap, so Merge can combine them."}`}
      </p>
      {open === "changes" && (
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <h4 className="text-[13px] font-semibold">What {who} changed</h4>
            <Diff before={client.base.text} after={inc.rev.text} className="border-l-2 border-border pl-2" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold">What you changed</h4>
            <Diff before={client.base.text} after={client.text} className="border-l-2 border-border pl-2" />
          </div>
          <DiffLegend />
        </div>
      )}
      {open === "merge" && (
        <div className="mt-2">
          <h4 className="mb-1 text-[13px] font-semibold">Merged: choose a version for the marked {merge.conflicts === 1 ? "part" : "parts"}</h4>
          <MergedText
            result={merge}
            mineLabel="You"
            theirsLabel={who}
            labels={{ theirs: `${who}'s` }}
            className="border border-input bg-background px-2 py-1"
            onDone={(text) => sim.resolve(side, text)}
          />
        </div>
      )}
    </Alert>
  );
}

/** One person's screen: the field, a Save button, and the notice when someone else saved meanwhile */
export function WarnField({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c = state[side];
  const doing = peerDoing(c);
  const dirty = c.text !== c.base.text;
  return (
    <div className="flex flex-col gap-2">
      <TicketHeader client={c} caption={doing} />
      <SyncedTextarea sim={sim} client={c} label="Description" describedBy={c.incoming ? `${side}-changed` : undefined} />
      {c.incoming && <ChangedNotice key={c.incoming.rev.version} sim={sim} client={c} side={side} />}
      <div className="ctl-sm flex items-center gap-2">
        <Button variant="primary" disabled={!dirty && !c.incoming} onClick={() => sim.save(side)}>
          Save
        </Button>
        <SaveStatus client={c} autosave={false} />
      </div>
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface TextboxWarnProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach B for a text box: you save by hand; when someone else saves first, a notice appears
 * under the field ("Jonas changed this 20 seconds ago") without touching your text. See changes
 * shows both word diffs; then Use theirs, Keep mine, or Merge (three-way, asking only about the
 * words you both changed).
 */
export function TextboxWarn({ defaultSplit, hideInfo, autoplay, className }: TextboxWarnProps) {
  const [sim, state] = useSim({ material: TICKET, policy: "warn" });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={WARN_INFO}
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <WarnField sim={sim} state={state} side={side} />}
    />
  );
}
