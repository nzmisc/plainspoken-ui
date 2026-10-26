"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { joinBlocks, mergeBlocks, splitBlocks, type BlockChunk } from "@/registry/plainspoken/lib/diff";
import { markdownToHtml } from "@/registry/plainspoken/lib/markdown";
import { TriangleAlert } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { MergeConflict } from "@/registry/plainspoken/ui/merge-conflict";
import { PERSON_COLORS, PresenceAvatar, firstName } from "@/registry/plainspoken/ui/presence";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { AMARA, CHECKLIST } from "@/registry/plainspoken/blocks/conflicts/content";
import { BlockText, DocHeader, DocMergedNote, SyncedEditor } from "@/registry/plainspoken/blocks/conflicts/doc-field";
import { ConflictPlayground, type ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { mergeDoc, mergeDocAll, useSim, type ClientState, type ScenarioId, type Side, type Sim, type SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { NewsAnnouncer, SaveStatus, peerDoing } from "@/registry/plainspoken/blocks/conflicts/synced-field";
import { cn } from "@/lib/utils";

export const INLINE_CONFLICTS_INFO: ApproachInfo = {
  letter: "B",
  name: "Inline conflict blocks",
  suits: "Documents edited by a few people over hours, saved as they type but not always at the same moment: specs, wikis, help articles.",
  pro: "Changes in different paragraphs (or different sentences of one) merge silently; a real clash shows right where it is, both versions with who wrote them.",
  con: "The document is stuck until the clash is settled, and a block-level choice is coarse when the paragraph is long.",
  howTo: (
    <>
      Press <b>Jonas edits a different paragraph</b> (it merges and says where), then <b>Jonas edits the same sentence</b>: that paragraph shows both versions.
    </>
  ),
};

/** The document while blocks need settling: the merged text, with each clash in place */
export function InlineConflictView({ client, onDone }: { client: ClientState; onDone: (markdown: string) => void }) {
  const r = client.resolving!;
  const result = useMemo(() => mergeBlocks(r.base, r.mine, r.theirs.text), [r.base, r.mine, r.theirs.text]);
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const box = useRef<HTMLDivElement>(null);
  const who = firstName(r.theirs.author);
  const total = result.conflicts;
  const settle = (k: number, text: string) => {
    const next = { ...chosen, [k]: text };
    setChosen(next);
    if (Object.keys(next).length === total) {
      let n = 0;
      onDone(joinBlocks(result.chunks.flatMap((c: BlockChunk) => (c.type === "clean" ? c.blocks : splitBlocks(next[n++])))));
    } else requestAnimationFrame(() => box.current?.querySelector<HTMLElement>("[data-open] button")?.focus());
  };
  let n = 0;
  return (
    <div ref={box} className="flex flex-col gap-2">
      <p className="text-[13px] text-warning">
        <Icon icon={TriangleAlert} className="mr-1" />
        {who} changed the same words as you{r.offline ? " while you were offline" : ""}. The rest of his changes are merged. Settle the marked{" "}
        {total === 1 ? "paragraph" : "paragraphs"} to go on editing.
      </p>
      <div role="document" aria-label="Launch checklist, with conflicts" className="flex flex-col gap-3 border border-input px-3 py-2.5">
        {result.chunks.map((c, i) => {
          if (c.type === "clean") {
            if (c.blocks.length === 0) return null;
            return (
              <Prose
                key={i}
                html={markdownToHtml(joinBlocks(c.blocks))}
                className={cn(c.from === "theirs" && cn("border-l-[3px] pl-2", PERSON_COLORS[r.theirs.author.color].border))}
                title={c.from === "theirs" ? `Merged from ${who}` : undefined}
              />
            );
          }
          const k = n++;
          if (k in chosen) return <Prose key={i} html={markdownToHtml(chosen[k])} />;
          return (
            <div key={i} data-open="" className="max-w-[75ch]">
              <MergeConflict
                title={`Both of you changed ${c.base.length === 1 && /^#/.test(c.base[0]) ? "this heading" : "this paragraph"}`}
                counter={total > 1 ? `${k + 1} of ${total}` : undefined}
                base={joinBlocks(c.base)}
                mine={{ text: joinBlocks(c.mine), label: "Yours", mark: <PresenceAvatar person={AMARA} size={16} /> }}
                theirs={{
                  text: joinBlocks(c.theirs),
                  label: r.theirs.author.name,
                  mark: <PresenceAvatar person={r.theirs.author} size={16} />,
                  meta: <RelativeTime date={r.theirs.at} format="short" />,
                }}
                labels={{ theirs: `Keep ${who}'s` }}
                renderText={(text) => <BlockText md={text} base={joinBlocks(c.base)} />}
                onResolve={(text) => settle(k, text)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One person's screen: the editor, or the document with its clashes while they need settling */
export function InlineConflictsDoc({ sim, state, side }: { sim: Sim; state: SimState; side: Side }) {
  const c = state[side];
  const [refocus, setRefocus] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
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
      {c.resolving ? (
        <InlineConflictView
          key={c.resolving.theirs.version}
          client={c}
          onDone={(md) => {
            sim.resolve(side, md);
            setRefocus(true);
          }}
        />
      ) : (
        <SyncedEditor sim={sim} client={c} label="Launch checklist" showBlockMarks />
      )}
      {c.merged && !c.resolving && <DocMergedNote key={c.merged.at} sim={sim} client={c} side={side} />}
      <SaveStatus client={c} autosave />
      <NewsAnnouncer client={c} />
    </div>
  );
}

export interface DocInlineConflictsProps {
  defaultSplit?: boolean;
  hideInfo?: boolean;
  /** Play a scenario as soon as it is on screen */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * Approach B for a rich text document: saves as you type and merges other people's changes by
 * blocks (and by words inside a block both changed), saying where. When both changed the same
 * words, that block shows both versions stacked in the document, tagged by author with their
 * changes marked: Keep mine, Keep theirs, Keep both or Edit, like a merge editor or suggestions.
 */
export function DocInlineConflicts({ defaultSplit, hideInfo, autoplay, className }: DocInlineConflictsProps) {
  const [sim, state] = useSim({ material: CHECKLIST, policy: "merge", merge: mergeDoc, mergeAll: mergeDocAll });
  return (
    <ConflictPlayground
      sim={sim}
      state={state}
      info={INLINE_CONFLICTS_INFO}
      kind="doc"
      defaultSplit={defaultSplit}
      hideInfo={hideInfo}
      autoplay={autoplay}
      className={className}
      renderSide={(side) => <InlineConflictsDoc sim={sim} state={state} side={side} />}
    />
  );
}
