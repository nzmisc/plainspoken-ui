"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { diffWords, merge3, mergedText, type DiffPart } from "@/registry/plainspoken/lib/diff";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { DiffLegend, DiffText } from "@/registry/plainspoken/ui/diff";
import { firstName } from "@/registry/plainspoken/ui/presence";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { JONAS, TICKET } from "@/registry/plainspoken/blocks/conflicts/content";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { useSim, type ClientState, type Revision, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, SyncedTextarea, TicketHeader } from "@/registry/plainspoken/blocks/conflicts/synced-field";
import { cn } from "@/lib/utils";

export const SAVE_CONFLICT_INFO: ApproachInfo = {
  letter: "C",
  name: "Conflict on save",
  suits: "Forms saved now and then, where two people rarely edit at once, and anything behind a plain API (optimistic concurrency: “If-Match” on a version).",
  pro: "Cheap and robust: one version number on the server, no live connection, nothing is ever lost silently.",
  con: "You find out late, after the work is done, and in a dialog that interrupts you; the merge is up to you.",
  howTo: (
    <>
      Change a word, press <b>Jonas edits a different sentence</b> (nothing shows: this form doesn&apos;t listen), then press <b>Save</b>. Or press{" "}
      <b>Save with an old version</b>.
    </>
  ),
};

/** A save the server refused */
export interface SaveConflict {
  /** Your text, which wasn't saved */
  mine: string;
  /** The version you started from */
  base: Revision;
  /** The newer version that made the server refuse */
  theirs: Revision;
}

export interface SaveConflictDialogProps {
  /** The refused save; null keeps the dialog closed */
  conflict: SaveConflict | null;
  onKeepMine: () => void;
  onUseTheirs: () => void;
  onSaveMerged: (text: string) => void;
  /** Escape or ×: decide later */
  onClose: () => void;
}

const NONE: SaveConflict = { mine: "", base: { version: 0, text: "", author: JONAS, at: 0 }, theirs: { version: 0, text: "", author: JONAS, at: 0 } };

/**
 * The dialog for a save the server refused: their version and yours side by side (or as one
 * inline diff), then Keep mine, Use theirs, or Edit merged, which opens the three-way merge in a
 * text box, with both versions of any words you both changed, to tidy and save. Stays mounted
 * and opens when `conflict` is set.
 */
export function SaveConflictDialog({ conflict, onKeepMine, onUseTheirs, onSaveMerged, onClose }: SaveConflictDialogProps) {
  const { mine, base, theirs } = conflict ?? NONE;
  const who = firstName(theirs.author);
  const fieldId = useId();
  const [mode, setMode] = useState<"compare" | "edit">("compare");
  const [layout, setLayout] = useState<"split" | "inline">("split");
  const merge = useMemo(() => merge3(base.text, mine, theirs.text), [base.text, mine, theirs.text]);
  const [draft, setDraft] = useState("");
  // A new refusal starts afresh: comparing, with the merge as the draft
  const [shown, setShown] = useState<SaveConflict | null>(null);
  if (conflict !== shown) {
    setShown(conflict);
    setMode("compare");
    setDraft(mergedText(merge, "both"));
  }
  const conflicts = merge.chunks.filter((c) => c.type === "conflict");
  // Switching between comparing and editing swaps the buttons: put focus where the work is
  const editRef = useRef<HTMLTextAreaElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const switched = useRef(false);
  useEffect(() => {
    if (!switched.current) return;
    if (mode === "edit") editRef.current?.focus();
    else editButton.current?.focus();
  }, [mode]);
  const go = (m: "compare" | "edit") => {
    switched.current = true;
    setMode(m);
  };
  return (
    <Dialog
      open={conflict != null}
      onClose={onClose}
      size="lg"
      dismissOnBackdrop={false}
      title={`${who} saved a newer version`}
      description={
        <>
          Your changes aren&apos;t saved. {who} saved version {theirs.version} (<RelativeTime date={theirs.at} format="short" />) after you opened version {base.version}.
        </>
      }
      footer={
        mode === "compare" ? (
          <>
            <Button onClick={onUseTheirs}>Use {who}&apos;s</Button>
            <Button onClick={onKeepMine}>Keep mine</Button>
            <Button ref={editButton} variant="primary" onClick={() => go("edit")}>
              Edit merged
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => go("compare")}>Back</Button>
            <Button variant="primary" onClick={() => onSaveMerged(draft)}>
              Save merged
            </Button>
          </>
        )
      }
    >
      {mode === "compare" ? (
        <div className="flex flex-col gap-2">
          <div className="ctl-sm flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-muted-foreground">Marked: what each of you changed since version {base.version}.</p>
            <SegmentedControl
              label="Show"
              value={layout}
              onChange={setLayout}
              options={[
                { value: "split", label: "Side by side" },
                { value: "inline", label: "Changes only" },
              ]}
            />
          </div>
          <div className={cn("grid gap-2", layout === "split" && "sm:grid-cols-2")}>
            {([
              [`${who}'s version (saved)`, theirs.text],
              ["Yours (not saved)", mine],
            ] as const).map(([label, text]) => (
              <section key={label} className="min-w-0 border border-border">
                <h3 className="border-b border-border bg-muted px-2 py-0.5 text-[13px] font-semibold">{label}</h3>
                {layout === "split" ? (
                  <DiffText parts={diffWords(base.text, text)} className="block px-2 py-1.5 leading-relaxed" />
                ) : (
                  <ChangesOnly parts={diffWords(base.text, text)} />
                )}
              </section>
            ))}
          </div>
          <DiffLegend />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[13px]">
            Both sets of changes are combined below.{" "}
            {conflicts.length > 0
              ? `You both changed the same words in ${conflicts.length === 1 ? "one place" : `${conflicts.length} places`}, so both versions are in the text there:`
              : "None of them overlap."}
          </p>
          {conflicts.length > 0 && (
            <ul className="list-disc pl-5 text-[13px]">
              {conflicts.map((c, i) =>
                c.type === "conflict" ? (
                  <li key={i}>
                    “{c.base}”: you wrote “{c.mine}”, {who} wrote “{c.theirs}”. Keep one.
                  </li>
                ) : null,
              )}
            </ul>
          )}
          <label htmlFor={fieldId} className="text-[13px] font-semibold">
            Merged description
          </label>
          <Textarea id={fieldId} ref={editRef} rows={7} value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
      )}
    </Dialog>
  );
}

/** Only the changed stretches of a diff, each with a few words around it: "…in the iOS app, but not on Android. Expected…" */
function ChangesOnly({ parts }: { parts: DiffPart[] }) {
  // About five words either side, cut at a space
  const tail = (t: string) => (t.length > 32 ? `…${t.slice(-32).replace(/^\S*\s/, "")}` : t);
  const head = (t: string) => (t.length > 32 ? `${t.slice(0, 32).replace(/\s\S*$/, "")}…` : t);
  const items: DiffPart[][] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].op === "equal") continue;
    const item: DiffPart[] = [];
    if (parts[i - 1]?.op === "equal") item.push({ op: "equal", text: tail(parts[i - 1].text) });
    while (i < parts.length && parts[i].op !== "equal") item.push(parts[i++]);
    if (parts[i]?.op === "equal") item.push({ op: "equal", text: head(parts[i].text) });
    items.push(item);
  }
  if (items.length === 0) return <p className="px-2 py-1.5 text-muted-foreground">No changes.</p>;
  return (
    <ul className="flex flex-col gap-1 px-2 py-1.5">
      {items.map((item, i) => (
        <li key={i}>
          <DiffText parts={item} />
        </li>
      ))}
    </ul>
  );
}

/** One person's screen: the field and Save; the dialog when the server refuses */
export function SaveConflictField({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c: ClientState = state[side];
  const dirty = c.text !== c.base.text;
  return (
    <div className="flex flex-col gap-2">
      <TicketHeader client={c} presence={false} />
      <SyncedTextarea sim={sim} client={c} label="Description" />
      <div className="ctl-sm flex items-center gap-2">
        <Button variant="primary" disabled={!dirty} onClick={() => sim.save(side)}>
          Save
        </Button>
        <SaveStatus client={c} autosave={false} />
      </div>
      <SaveConflictDialog
        conflict={c.rejected}
        onClose={() => sim.dismissRejected(side)}
        onUseTheirs={() => sim.takeTheirs(side)}
        onKeepMine={() => sim.keepMine(side, true)}
        onSaveMerged={(text) => sim.resolve(side, text, true)}
      />
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface TextboxSaveConflictProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach C for a text box: a plain form with a version number. Nothing happens while you
 * type; when you save after someone else did, the server refuses and a dialog shows both
 * versions with a diff: Keep mine, Use theirs, or Edit merged.
 */
export function TextboxSaveConflict({ defaultSplit, hideInfo, autoplay, className }: TextboxSaveConflictProps) {
  const [sim, state] = useSim({ material: TICKET, policy: "save" });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={SAVE_CONFLICT_INFO}
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <SaveConflictField sim={sim} state={state} side={side} />}
    />
  );
}
