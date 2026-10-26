"use client";

import { useId, useMemo, useState } from "react";
import { joinBlocks } from "@/registry/plainspoken/lib/diff";
import { markdownToHtml } from "@/registry/plainspoken/lib/markdown";
import { TriangleAlert } from "@/registry/plainspoken/lib/icons";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { DiffLegend } from "@/registry/plainspoken/ui/diff";
import { firstName } from "@/registry/plainspoken/ui/presence";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { CHECKLIST, JONAS } from "@/registry/plainspoken/blocks/conflicts/content";
import { BlockText, DocHeader, SyncedEditor, blockLabel, changeParts, pickBlocks, type ChangePart, type ChangePick, type ChangeRow } from "@/registry/plainspoken/blocks/conflicts/doc-field";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { useSim, type Revision, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus } from "@/registry/plainspoken/blocks/conflicts/synced-field";
import { cn } from "@/lib/utils";

export const COMPARE_INFO: ApproachInfo = {
  letter: "C",
  name: "Compare dialog on save",
  suits: "Long documents saved by hand by people who aren't online together: policies, contracts, release notes, anything that gets reviewed.",
  pro: "Everything on one screen: the version you started from, theirs and yours, block by block, with the result shown before anything is saved.",
  con: "Heavy: a modal full of columns at the moment you thought you were done; too much for a one-word change.",
  howTo: (
    <>
      Change a word, press <b>Jonas edits a different paragraph</b>, then <b>Jonas edits the same sentence</b> and press <b>Save</b>. Or just press{" "}
      <b>Save with an old version</b>.
    </>
  ),
};

type Pick = ChangePick;

const take = (r: ChangeRow, p: Pick): string[] => pickBlocks(r, p);

export interface CompareDialogProps {
  /** The refused save: your text, the version you started from, and the newer one. Null keeps the dialog closed. */
  conflict: { mine: string; base: Revision; theirs: Revision } | null;
  /** Save this Markdown as the result */
  onDone: (markdown: string) => void;
  /** Escape or ×: decide later */
  onClose: () => void;
}

/**
 * The compare dialog for a document whose save was refused: three columns (the version you both
 * started from, theirs and yours) for each block that changed, each version marked against the
 * base; a choice per block, set to the obvious one where only one of you changed it (or the
 * word-by-word merge where you changed different words); and the resulting document, rendered,
 * underneath. Save result stays off until every clash has a choice.
 */
export function CompareDialog({ conflict, onDone, onClose }: CompareDialogProps) {
  const c = conflict ?? { mine: "", base: { version: 0, text: "", author: JONAS, at: 0 }, theirs: { version: 0, text: "", author: JONAS, at: 0 } };
  const who = firstName(c.theirs.author);
  const parts = useMemo(() => changeParts(c.base.text, c.mine, c.theirs.text), [c.base.text, c.mine, c.theirs.text]);
  const changeRows = parts.filter((p): p is Extract<ChangePart, { kind: "row" }> => p.kind === "row");
  const id = useId();
  const [picks, setPicks] = useState<(Pick | "")[]>([]);
  // A new refusal starts from the defaults
  const [shown, setShown] = useState<CompareDialogProps["conflict"]>(null);
  if (conflict !== shown) {
    setShown(conflict);
    setPicks(changeRows.map((r) => r.initial));
  }
  const open = changeRows.filter((_, i) => !picks[i]).length;
  let k = 0;
  const result = joinBlocks(parts.flatMap((p) => (p.kind === "same" ? p.blocks : take(p, (picks[k++] || "mine") as Pick))));

  return (
    <Dialog
      open={conflict != null}
      onClose={onClose}
      size="full"
      dismissOnBackdrop={false}
      title={`${who} saved a newer version: compare and choose`}
      description={
        <>
          Your changes aren&apos;t saved. {who} saved version {c.theirs.version} (<RelativeTime date={c.theirs.at} format="short" />) after you opened version{" "}
          {c.base.version}. Blocks only one of you changed are set already; choose for the rest.
        </>
      }
      footer={
        <>
          <span aria-live="polite" className="mr-auto text-[13px] text-muted-foreground">
            {open > 0 ? `${open} of ${changeRows.length} ${open === 1 ? "change needs" : "changes need"} a choice.` : `${changeRows.length} ${changeRows.length === 1 ? "change" : "changes"}, all chosen.`}
          </span>
          <Button onClick={() => onDone(c.theirs.text)}>Use {who}&apos;s version</Button>
          <Button onClick={() => onDone(c.mine)}>Keep mine</Button>
          <Button variant="primary" disabled={open > 0} onClick={() => onDone(result)}>
            Save result
          </Button>
        </>
      }
      bodyClassName="p-0"
    >
      {conflict && (
        <div className="flex flex-col">
          <div className="sticky top-0 z-[1] hidden grid-cols-3 gap-px border-b border-border bg-muted text-[13px] font-semibold lg:grid">
            <span className="px-3 py-1">Version {c.base.version}, which you both started from</span>
            <span className="px-3 py-1">
              {who}&apos;s, version {c.theirs.version}
            </span>
            <span className="px-3 py-1">Yours, not saved</span>
          </div>
          <ol className="flex flex-col">
            {changeRows.map((r, i) => {
              const clash = r.by === "both";
              const options: { value: Pick; label: string }[] = [
                { value: "theirs", label: `${who}'s` },
                { value: "mine", label: "Yours" },
                ...(clash ? [{ value: "both" as const, label: "Both" }] : []),
                ...(r.merged ? [{ value: "merged" as const, label: "Merged" }] : []),
              ];
              const what = blockLabel(r.base[0] ?? r.mine[0] ?? r.theirs[0] ?? "");
              return (
                <li key={i} className={cn("border-b border-border", clash && !r.merged && "border-l-4 border-l-warning")}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 pt-2 text-[13px]">
                    <span className="font-semibold">
                      Change {i + 1} of {changeRows.length}: {what}
                    </span>
                    {r.by === "mine" && <Badge>You changed it</Badge>}
                    {r.by === "theirs" && <Badge>{who} changed it</Badge>}
                    {r.by === "both-same" && <Badge variant="success">You both made the same change</Badge>}
                    {clash && r.merged && <Badge variant="info">Both changed it, in different words: merged</Badge>}
                    {clash && !r.merged && (
                      <Badge variant="warning" icon={TriangleAlert}>
                        Both changed the same words
                      </Badge>
                    )}
                  </div>
                  <div className="grid gap-2 px-3 py-2 lg:grid-cols-3 lg:gap-4">
                    {([
                      [`Version ${c.base.version}`, r.base, undefined],
                      [`${who}'s`, r.theirs, r.base],
                      ["Yours", r.mine, r.base],
                    ] as const).map(([label, blocks, against]) => (
                      <div key={label} className="min-w-0">
                        <p className="text-[12px] text-muted-foreground lg:sr-only">{label}</p>
                        <BlockText md={joinBlocks(blocks)} base={against ? joinBlocks(against) : undefined} />
                      </div>
                    ))}
                  </div>
                  <div className="ctl-sm flex flex-wrap items-center gap-2 px-3 pb-2">
                    <SegmentedControl<Pick | "">
                      label={`Change ${i + 1}: use`}
                      value={picks[i] ?? ""}
                      onChange={(v) => setPicks((p) => p.map((x, j) => (j === i ? v : x)))}
                      options={options}
                    />
                    {!picks[i] && <span className="text-[13px] text-warning">Choose one</span>}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="px-3 py-2">
            <DiffLegend />
          </div>
          <section aria-labelledby={`${id}-result`} className="border-t border-border">
            <h3 id={`${id}-result`} className="bg-muted px-3 py-1 text-[13px] font-semibold">
              The result, as it will be saved
            </h3>
            <Prose html={markdownToHtml(result)} className="px-3 py-2" />
          </section>
        </div>
      )}
    </Dialog>
  );
}

/** One person's screen: the editor, Save, and the compare dialog when the server refuses */
export function CompareDoc({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c = state[side];
  const dirty = c.text !== c.base.text;
  return (
    <div className="flex flex-col gap-2">
      <DocHeader client={c} presence={false} />
      <SyncedEditor sim={sim} client={c} label="Launch checklist" />
      <div className="ctl-sm flex items-center gap-2">
        <Button variant="primary" disabled={!dirty} onClick={() => sim.save(side)}>
          Save
        </Button>
        <SaveStatus client={c} autosave={false} />
      </div>
      <CompareDialog conflict={c.rejected} onClose={() => sim.dismissRejected(side)} onDone={(md) => sim.resolve(side, md, true)} />
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface DocCompareDialogProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach C for a rich text document: you save by hand; when someone saved first, a full-screen
 * dialog compares the three versions block by block, with a choice for each change and the
 * result rendered underneath.
 */
export function DocCompareDialog({ defaultSplit, hideInfo, autoplay, className }: DocCompareDialogProps) {
  const [sim, state] = useSim({ material: CHECKLIST, policy: "save" });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={COMPARE_INFO}
      kind="doc"
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <CompareDoc sim={sim} state={state} side={side} />}
    />
  );
}
