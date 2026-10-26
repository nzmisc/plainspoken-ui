"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { diffWords, joinBlocks, splitBlocks } from "@/registry/plainspoken/lib/diff";
import { markdownToHtml } from "@/registry/plainspoken/lib/markdown";
import { ChevronLeft, ChevronRight, CircleCheck, CloudUpload, TriangleAlert, X } from "@/registry/plainspoken/lib/icons";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Diff } from "@/registry/plainspoken/ui/diff";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { MergeConflict } from "@/registry/plainspoken/ui/merge-conflict";
import { PresenceAvatar, firstName } from "@/registry/plainspoken/ui/presence";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { AMARA, CHECKLIST } from "@/registry/plainspoken/blocks/conflicts/content";
import {
  BlockText,
  DocHeader,
  DocMergedNote,
  SyncedEditor,
  blockLabel,
  changeParts,
  pickBlocks,
  plain,
  type ChangePart,
  type ChangeRow,
} from "@/registry/plainspoken/blocks/conflicts/doc-field";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { mergeDoc, mergeDocAll, mergeDocTheirs, useSim, type Revision, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, peerDoing } from "@/registry/plainspoken/blocks/conflicts/synced-field";
import { cn } from "@/lib/utils";

export const OFFLINE_REVIEW_INFO: ApproachInfo = {
  letter: "D",
  name: "Offline review list",
  suits: "Apps people use on trains and planes, and documents edited in long sessions: field notes, drafts, anything offline-first.",
  pro: "Everything that merged cleanly is synced at once, and what's left is a short list you step through, rather than a document full of marks.",
  con: "A list is one step removed from the text; with many clashes it turns into a chore, and people may wave them through.",
  howTo: (
    <>
      Press <b>Go offline, edit, reconnect</b>: two of your edits and four of Jonas&apos;s meet. Read the report, then step through what needs you.
    </>
  ),
};

/** The three texts a report is about, kept after they are settled so the report can still be read */
interface Report {
  base: string;
  mine: string;
  theirs: Revision;
  offline: boolean;
  /** Already settled: no choices left */
  done: boolean;
}

/** "You", "Jonas", "You and Jonas", with their avatars */
function Who({ by, theirs }: { by: ChangeRow["by"]; theirs: Revision }) {
  const people = by === "mine" ? [AMARA] : by === "theirs" ? [theirs.author] : [AMARA, theirs.author];
  const words = by === "mine" ? "You" : by === "theirs" ? firstName(theirs.author) : `You and ${firstName(theirs.author)}`;
  return (
    <span className="inline-flex items-center gap-1">
      {people.map((p) => (
        <PresenceAvatar key={p.id} person={p} size={16} aria-hidden />
      ))}
      <span>{words}</span>
    </span>
  );
}

/** One change in the report: who, where, done or not, and what it changed */
function ChangeItem({ row, theirs, settled }: { row: ChangeRow; theirs: Revision; settled: boolean }) {
  const [show, setShow] = useState(false);
  const needs = row.by === "both" && !row.merged && !settled;
  const after = row.by === "theirs" ? row.theirs : row.by === "both" && row.merged ? row.merged : row.mine;
  const verb = row.base.length === 0 ? "added" : after.length === 0 ? "removed" : "changed";
  return (
    <li className="flex flex-col gap-1 py-1">
      <div className="ctl-xs flex flex-wrap items-center gap-x-2 gap-y-1">
        {needs ? <Icon icon={TriangleAlert} className="text-warning" label="Needs you" /> : <Icon icon={CircleCheck} className="text-success" label="Synced" />}
        <Who by={row.by} theirs={theirs} />
        <span>
          {verb} {blockLabel(row.base[0] ?? after[0] ?? "")}
          {row.by === "both" && row.merged ? ", in different words: merged" : ""}
          {row.by === "both" && !row.merged ? (settled ? ", the same words: settled" : ", the same words") : ""}
        </span>
        {!needs && (
          <Button size="xs" variant="link" aria-expanded={show} onClick={() => setShow(!show)}>
            {show ? "Hide" : "Show"}
          </Button>
        )}
      </div>
      {show && <Diff parts={diffWords(plain(joinBlocks(row.base)), plain(joinBlocks(after)))} className="ml-5 border-l-2 border-border pl-2" />}
    </li>
  );
}

/** The report after a sync: what went through, and the clashes to step through */
function SyncReport({ report, onSettled, onDismiss }: { report: Report; onSettled: (markdown: string) => void; onDismiss: () => void }) {
  const id = useId();
  const who = firstName(report.theirs.author);
  const parts = useMemo(() => changeParts(report.base, report.mine, report.theirs.text), [report.base, report.mine, report.theirs.text]);
  const rows = parts.filter((p): p is Extract<ChangePart, { kind: "row" }> => p.kind === "row");
  const clashes = rows.map((r, i) => (r.by === "both" && !r.merged ? i : -1)).filter((i) => i >= 0);
  const [chosen, setChosen] = useState<Record<number, string[]>>({});
  const [step, setStep] = useState(0);
  const stepper = useRef<HTMLDivElement>(null);
  const left = report.done ? 0 : clashes.filter((i) => !(i in chosen)).length;
  const synced = rows.length - (report.done ? 0 : clashes.length);
  const current = clashes[Math.min(step, clashes.length - 1)];

  const settle = (i: number, blocks: string[]) => {
    const next = { ...chosen, [i]: blocks };
    setChosen(next);
    const open = clashes.filter((c) => !(c in next));
    if (open.length === 0) {
      let k = 0;
      const blocks = parts.flatMap((p) => {
        if (p.kind === "same") return p.blocks;
        const row = k++;
        return next[row] ?? pickBlocks(p, p.initial || "mine");
      });
      onSettled(joinBlocks(blocks));
      return;
    }
    setStep(clashes.indexOf(open[0]));
    requestAnimationFrame(() => stepper.current?.querySelector<HTMLElement>("button")?.focus());
  };

  return (
    <section aria-labelledby={`${id}-t`} className={cn("border border-l-4 px-3 py-2", left ? "border-warning" : "border-success")}>
      <div className="flex items-start justify-between gap-2">
        <h3 id={`${id}-t`} className="text-[14px] font-semibold">
          <Icon icon={left ? TriangleAlert : CloudUpload} className={cn("mr-1", left ? "text-warning" : "text-success")} />
          {report.offline ? "Back online: " : ""}
          {synced} {synced === 1 ? "change" : "changes"} synced{left ? `, ${left} ${left === 1 ? "needs" : "need"} you` : ""}
        </h3>
        {left === 0 && <IconButton size="sm" variant="ghost" icon={X} label="Dismiss the report" onClick={onDismiss} className="-mt-0.5 -mr-1.5 text-muted-foreground" />}
      </div>
      <ol aria-label="Changes" className="mt-1 divide-y divide-border text-[13px]">
        {rows.map((r, i) => (
          <ChangeItem key={i} row={r} theirs={report.theirs} settled={report.done || i in chosen} />
        ))}
      </ol>
      {left > 0 && current != null && (
        <div ref={stepper} className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
          <div className="ctl-sm flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold">
              Needs you: {clashes.indexOf(current) + 1} of {clashes.length}
            </span>
            <Button icon={ChevronLeft} disabled={step === 0} onClick={() => setStep(step - 1)}>
              Previous
            </Button>
            <Button iconEnd={ChevronRight} disabled={step >= clashes.length - 1} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </div>
          {current in chosen ? (
            <p className="text-[13px] text-muted-foreground">Settled.</p>
          ) : (
            <MergeConflict
              key={current}
              title={`You and ${who} both changed ${blockLabel(rows[current].base[0] ?? "")}`}
              base={joinBlocks(rows[current].base)}
              mine={{ text: joinBlocks(rows[current].mine), label: "Yours", mark: <PresenceAvatar person={AMARA} size={16} />, meta: report.offline ? "written offline" : undefined }}
              theirs={{ text: joinBlocks(rows[current].theirs), label: report.theirs.author.name, mark: <PresenceAvatar person={report.theirs.author} size={16} /> }}
              labels={{ theirs: `Keep ${who}'s` }}
              renderText={(text) => <BlockText md={text} base={joinBlocks(rows[current].base)} />}
              onResolve={(text) => settle(current, splitBlocks(text))}
            />
          )}
        </div>
      )}
    </section>
  );
}

/** The document while a clash waits: what has synced, rendered, with the waiting block marked */
function SyncedSoFar({ base, mine, theirs }: { base: string; mine: string; theirs: string }) {
  // Settled stretches run together into one rendering; each waiting block breaks them
  const runs: { waiting: boolean; blocks: string[] }[] = [];
  for (const p of changeParts(base, mine, theirs)) {
    const waiting = p.kind === "row" && p.by === "both" && !p.merged;
    const blocks = p.kind === "same" ? p.blocks : waiting ? p.mine : pickBlocks(p, p.initial || "mine");
    const last = runs.at(-1);
    if (last && !last.waiting && !waiting) last.blocks.push(...blocks);
    else runs.push({ waiting, blocks: [...blocks] });
  }
  return (
    <>
      {runs.map((r, i) =>
        r.waiting ? (
          <div key={i} className="my-3 border-l-4 border-warning bg-warning/10 px-2 py-1">
            <p className="text-[12px] font-semibold text-warning">Needs you: your version for now</p>
            <Prose html={markdownToHtml(joinBlocks(r.blocks))} />
          </div>
        ) : (
          <Prose key={i} html={markdownToHtml(joinBlocks(r.blocks))} />
        ),
      )}
    </>
  );
}

/** One person's screen: the editor, an offline note, and the report after a sync */
export function OfflineReviewDoc({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c = state[side];
  const [report, setReport] = useState<Report | null>(null);
  // A sync that merged or clashed opens the report; it stays (marked done) after settling, until dismissed
  const source = c.resolving ?? (c.merged?.offline ? { base: c.merged.base, mine: c.merged.mine, theirs: c.merged.theirs, offline: true } : null);
  const sourceKey = source ? `${source.theirs.version}:${source.mine.length}` : "";
  const [seen, setSeen] = useState("");
  if (sourceKey && sourceKey !== seen) {
    setSeen(sourceKey);
    setReport({ base: source!.base, mine: source!.mine, theirs: source!.theirs, offline: source!.offline, done: !c.resolving });
  }
  const wrap = useRef<HTMLDivElement>(null);
  const [refocus, setRefocus] = useState(false);
  useEffect(() => {
    if (refocus && !c.resolving) {
      wrap.current?.querySelector<HTMLElement>('[role="textbox"]')?.focus();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off after settling
      setRefocus(false);
    }
  }, [refocus, c.resolving]);

  return (
    <div ref={wrap} className="flex flex-col gap-2">
      <DocHeader client={c} caption={peerDoing(c)} />
      {!c.online && (
        <Alert variant="info" title="You're offline">
          Keep writing: your changes stay on this screen and sync when you&apos;re back. Anything that clashes with other people&apos;s changes will be listed
          for you then.
        </Alert>
      )}
      {report && (
        <SyncReport
          key={`${report.theirs.version}:${report.mine.length}`}
          report={report}
          onSettled={(md) => {
            sim.resolve(side, md);
            setReport({ ...report, done: true });
            setRefocus(true);
          }}
          onDismiss={() => {
            setReport(null);
            if (c.merged) sim.dismissMerged(side);
          }}
        />
      )}
      {c.resolving ? (
        <div className="flex flex-col gap-1">
          <p className="text-[13px] text-muted-foreground">The document as synced so far. The marked part waits for your choice above.</p>
          <div className="border border-input px-3 py-2.5">
            <SyncedSoFar base={c.resolving.base} mine={c.resolving.mine} theirs={c.resolving.theirs.text} />
          </div>
        </div>
      ) : (
        <SyncedEditor sim={sim} client={c} label="Launch checklist" showBlockMarks />
      )}
      {c.merged && !c.merged.offline && !c.resolving && <DocMergedNote key={c.merged.at} sim={sim} client={c} side={side} />}
      <SaveStatus client={c} autosave />
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface DocOfflineReviewProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach D for a rich text document: built for working offline. On reconnecting, everything
 * that merges cleanly is synced at once, and a report says so ("5 changes synced, 1 needs you"),
 * listing each change with who made it; the clashes are stepped through one at a time.
 */
export function DocOfflineReview({ defaultSplit, hideInfo, autoplay, className }: DocOfflineReviewProps) {
  const [sim, state] = useSim({ material: CHECKLIST, policy: "merge", merge: mergeDoc, mergeAll: mergeDocAll, partial: mergeDocTheirs });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={OFFLINE_REVIEW_INFO}
      kind="doc"
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <OfflineReviewDoc sim={sim} state={state} side={side} />}
    />
  );
}
