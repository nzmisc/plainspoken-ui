"use client";

import { useRef } from "react";
import { Lock } from "@/registry/plainspoken/lib/icons";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { PresenceFrame, firstName } from "@/registry/plainspoken/ui/presence";
import { TICKET } from "@/registry/plainspoken/blocks/conflicts/content";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { useSim, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, SyncedTextarea, TicketHeader, peerDoing } from "@/registry/plainspoken/blocks/conflicts/synced-field";

export const SOFT_LOCK_INFO: ApproachInfo = {
  letter: "A",
  name: "Presence + soft lock",
  suits: "Short fields that one person edits at a time, in a tool where everyone is online: ticket fields, CMS entries.",
  pro: "Simple to build and to understand; clashes are rare because you see who is in the field before you start.",
  con: "Locks get in the way, go stale when someone wanders off, and mean nothing offline; when they fail, all that's left is a blunt choice of two.",
  howTo: (
    <>
      Press <b>Jonas edits the same sentence</b>: the field locks for you while he types. Then press <b>Edit anyway</b>, change a word, and see what you are
      left with.
    </>
  ),
};

/** One person's screen: the field, locked while the other is in it */
export function SoftLockField({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c = state[side];
  const ref = useRef<HTMLTextAreaElement>(null);
  const peer = c.peer;
  const doing = peerDoing(c);
  const locked = sim.lockedFor(side, state);
  const tagId = `${side}-lock-tag`;
  const lockId = `${side}-lock-note`;
  const who = peer ? firstName(peer.person) : "Jonas";
  return (
    <div className="flex flex-col gap-2">
      <TicketHeader client={c} />
      <SyncedTextarea
        sim={sim}
        client={c}
        label="Description"
        readOnly={locked}
        textareaRef={ref}
        describedBy={[doing && tagId, locked && lockId].filter(Boolean).join(" ") || undefined}
        frame={(box) => (
          <PresenceFrame person={peer?.person} active={!!doing} label={doing} labelId={tagId}>
            {box}
          </PresenceFrame>
        )}
      />
      {locked && (
        <div id={lockId} className="ctl-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <span>
            <Icon icon={Lock} className="mr-1 text-muted-foreground" />
            Read-only while {who} has it: you see his typing as it happens.
          </span>
          <Button
            onClick={() => {
              sim.setEditAnyway(side, true);
              ref.current?.focus();
            }}
          >
            Edit anyway
          </Button>
        </div>
      )}
      {c.editAnyway && doing && (
        <p className="text-[13px] text-warning">You are both editing now. If you both save, one of you will have to choose whose text stays.</p>
      )}
      {c.incoming && (
        <Alert
          variant="warning"
          title={`${firstName(c.incoming.rev.author)} saved while you were ${c.incoming.offline ? "offline" : "editing"}`}
          actions={
            <>
              <Button onClick={() => sim.keepMine(side)}>Keep mine</Button>
              <Button onClick={() => sim.takeTheirs(side)}>Use {firstName(c.incoming.rev.author)}&apos;s</Button>
            </>
          }
        >
          <p>Only one version can stay. Keeping yours replaces his.</p>
          <details className="mt-1">
            <summary className="cursor-pointer text-[13px]">{firstName(c.incoming.rev.author)}&apos;s version</summary>
            <p className="mt-1 border-l-2 border-border pl-2 text-[13px] whitespace-pre-wrap">{c.incoming.rev.text}</p>
          </details>
        </Alert>
      )}
      <SaveStatus client={c} autosave />
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface TextboxSoftLockProps {
  /** Show Jonas's screen next to yours from the start */
  defaultSplit?: boolean;
  /** Leave out the approach's name, fit and trade-offs */
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach A for a text box: a ring and a tag show who is in the field ("Jonas is typing…"),
 * and the field is read-only for everyone else, with Edit anyway. It saves as you type. When two
 * people end up editing anyway (or offline), the one who saves second chooses: theirs or mine.
 */
export function TextboxSoftLock({ defaultSplit, hideInfo, autoplay, className }: TextboxSoftLockProps) {
  const [sim, state] = useSim({ material: TICKET, policy: "lock" });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={SOFT_LOCK_INFO}
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <SoftLockField sim={sim} state={state} side={side} />}
    />
  );
}
