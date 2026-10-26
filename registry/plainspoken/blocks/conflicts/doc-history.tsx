"use client";

import { useId, useMemo, useState } from "react";
import { diffBlocks, diffWords } from "@/registry/plainspoken/lib/diff";
import { ArrowLeft, RotateCcwClock } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { DiffLegend, DiffText, INSERT_CLASS, DELETE_CLASS } from "@/registry/plainspoken/ui/diff";
import { PresenceAvatar, firstName } from "@/registry/plainspoken/ui/presence";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { CHECKLIST, PRIYA } from "@/registry/plainspoken/blocks/conflicts/content";
import { DocHeader, SyncedEditor, changedBlocks, plain } from "@/registry/plainspoken/blocks/conflicts/doc-field";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { mergeDocAll, useSim, type Revision, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, peerDoing } from "@/registry/plainspoken/blocks/conflicts/synced-field";
import { cn } from "@/lib/utils";

export const HISTORY_INFO: ApproachInfo = {
  letter: "E",
  name: "Version history",
  suits: "Any of the others, as a safety net; on its own, for documents where a bad merge is cheap to undo but must never be final.",
  pro: "Nothing is ever lost: every merge, good or bad, can be looked at and undone later, by anyone, without anyone being interrupted now.",
  con: "It repairs after the fact: someone has to notice the mangled sentence first, and restoring a whole version also throws away the good changes made since.",
  howTo: (
    <>
      Press <b>Jonas edits the same sentence</b>: both edits land and the start time reads oddly. Open the version from before in <b>History</b> and restore
      it.
    </>
  ),
};

/** Saves close together by one person, shown as one entry the way document apps do */
interface Group {
  /** The newest version in the group */
  last: Revision;
  /** The version before the group, to compare with */
  before: Revision | null;
  count: number;
}

function groupRevisions(revs: Revision[]): Group[] {
  const groups: Group[] = [];
  revs.forEach((r, i) => {
    const g = groups.at(-1);
    if (g && g.last.author.id === r.author.id && !r.note && !g.last.note && r.at - g.last.at < 10_000 && i > 1) {
      g.last = r;
      g.count++;
    } else groups.push({ last: r, before: revs[i - 1] ?? null, count: 1 });
  });
  return groups.reverse();
}

/** What a group of saves did, in words */
function summary(g: Group): string {
  if (g.last.note) return g.last.note;
  if (!g.before) return "The first version";
  const where = changedBlocks(g.before.text, g.last.text);
  if (where.length === 0) return "No visible change";
  return where.length === 1 ? `Changed ${where[0]}` : `Changed ${where.length} places`;
}

/** What restoring `target` would do to `current`, block by block */
function RestorePreview({ current, target }: { current: string; target: string }) {
  const rows = useMemo(() => diffBlocks(current, target), [current, target]);
  return (
    <div className="flex flex-col gap-1.5 border border-input px-3 py-2.5 text-[14px] leading-relaxed">
      {rows.map((r, i) => {
        if (r.op === "equal") return <p key={i} className="text-muted-foreground">{plain(r.after)}</p>;
        if (r.op === "change") return <p key={i}><DiffText parts={diffWords(plain(r.before), plain(r.after))} /></p>;
        if (r.op === "insert")
          return (
            <p key={i}>
              <ins className={INSERT_CLASS}>
                <span className="sr-only">(added: </span>
                {plain(r.after)}
                <span className="sr-only">)</span>
              </ins>
            </p>
          );
        return (
          <p key={i}>
            <del className={DELETE_CLASS}>
              <span className="sr-only">(removed: </span>
              {plain(r.before)}
              <span className="sr-only">)</span>
            </del>
          </p>
        );
      })}
    </div>
  );
}

/** The list of versions, newest first, each one selectable */
function HistoryList({ groups, selected, onSelect }: { groups: Group[]; selected: number | null; onSelect: (version: number) => void }) {
  return (
    <ol aria-label="Versions, newest first" className="flex max-h-[26rem] flex-col overflow-y-auto">
      {groups.map((g, i) => {
        const on = selected === g.last.version;
        return (
          <li key={g.last.version} className="border-b border-border last:border-b-0">
            <button
              type="button"
              aria-current={on ? "true" : undefined}
              onClick={() => onSelect(g.last.version)}
              className={cn(
                "flex w-full cursor-pointer flex-col items-start gap-0.5 px-2 py-1.5 text-left text-[13px] hover:bg-secondary",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                on && "bg-accent",
              )}
            >
              <span className="flex w-full items-center gap-1.5">
                <PresenceAvatar person={g.last.author} size={16} aria-hidden />
                <span className={cn(on && "font-semibold")}>{firstName(g.last.author)}</span>
                <span className="text-muted-foreground">
                  · version {g.last.version}
                  {g.count > 1 ? ` (${g.count} saves)` : ""}
                </span>
                {i === 0 && <span className="ml-auto text-[12px] font-semibold">Current</span>}
              </span>
              <span className="text-muted-foreground">
                {summary(g)}
                {g.last.at > 0 ? (
                  <>
                    , <RelativeTime date={g.last.at} format="short" />
                  </>
                ) : (
                  ", before you came"
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** One person's screen: the editor beside the history, or a version compared with now and Restore */
export function HistoryDoc({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const id = useId();
  const c = state[side];
  const groups = useMemo(() => groupRevisions(state.revisions), [state.revisions]);
  const [selected, setSelected] = useState<number | null>(null);
  const [restored, setRestored] = useState<number | null>(null);
  const target = selected != null ? state.revisions.find((r) => r.version === selected) : null;
  const viewing = target && target.version !== groups[0]?.last.version ? target : null;
  return (
    <div className="flex flex-col gap-2">
      <DocHeader client={c} extra={c.online ? [{ person: PRIYA, status: "reading" }] : []} caption={peerDoing(c)} />
      <div className="grid gap-3 lg:grid-cols-[1fr_17rem]">
        <div className="flex min-w-0 flex-col gap-2">
          {viewing ? (
            <section aria-labelledby={`${id}-v`} className="flex flex-col gap-2">
              <div className="ctl-sm flex flex-wrap items-center gap-2">
                <h3 id={`${id}-v`} className="mr-auto text-[14px] font-semibold">
                  Version {viewing.version}, compared with now
                </h3>
                <Button icon={ArrowLeft} onClick={() => setSelected(null)}>
                  Back to editing
                </Button>
                <Button
                  variant="primary"
                  icon={RotateCcwClock}
                  onClick={() => {
                    sim.restore(side, viewing.version);
                    setRestored(viewing.version);
                    setSelected(null);
                  }}
                >
                  Restore version {viewing.version}
                </Button>
              </div>
              <p className="text-[13px] text-muted-foreground">What restoring it would do to the document as it is now:</p>
              <RestorePreview current={c.text} target={viewing.text} />
              <DiffLegend />
            </section>
          ) : (
            <SyncedEditor sim={sim} client={c} label="Launch checklist" showPeerCursor showBlockMarks />
          )}
          {restored != null && !viewing && (
            <p role="status" className="text-[13px]">
              Restored version {restored} as a new version. Changed your mind? Restore the one before it: nothing is lost.
            </p>
          )}
          <SaveStatus client={c} autosave />
        </div>
        <section aria-labelledby={`${id}-h`} className="min-w-0 self-start border border-border">
          <h3 id={`${id}-h`} className="border-b border-border bg-muted px-2 py-0.5 text-[13px] font-semibold">
            History
          </h3>
          <HistoryList groups={groups} selected={selected} onSelect={(v) => setSelected(v === selected ? null : v)} />
        </section>
      </div>
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface DocHistoryProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach E for a rich text document: live editing that merges everything (as A does), with the
 * version history beside it as the safety net. Saves close together by one person show as one
 * entry; any of them can be compared with now and restored, which is itself a new version, so a
 * restore can be undone the same way.
 */
export function DocHistory({ defaultSplit, hideInfo, autoplay, className }: DocHistoryProps) {
  const [sim, state] = useSim({ material: CHECKLIST, policy: "live", mergeAll: mergeDocAll });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={HISTORY_INFO}
      kind="doc"
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <HistoryDoc sim={sim} state={state} side={side} />}
    />
  );
}
