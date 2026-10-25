"use client";

import type { ReactNode } from "react";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { Facepile } from "@/registry/plainspoken/ui/presence";
import { AMARA, JONAS, PRIYA } from "@/registry/plainspoken/blocks/conflicts/content";
import type { ApproachInfo } from "@/registry/plainspoken/blocks/conflicts/playground";
import { SOFT_LOCK_INFO, TextboxSoftLock } from "@/registry/plainspoken/blocks/conflicts/textbox-soft-lock";
import { TextboxWarn, WARN_INFO } from "@/registry/plainspoken/blocks/conflicts/textbox-warn";
import { SAVE_CONFLICT_INFO, TextboxSaveConflict } from "@/registry/plainspoken/blocks/conflicts/textbox-save-conflict";
import { AUTO_MERGE_INFO, TextboxAutoMerge } from "@/registry/plainspoken/blocks/conflicts/textbox-auto-merge";
import { DocLivePresence, LIVE_PRESENCE_INFO } from "@/registry/plainspoken/blocks/conflicts/doc-live-presence";
import { DocInlineConflicts, INLINE_CONFLICTS_INFO } from "@/registry/plainspoken/blocks/conflicts/doc-inline-conflicts";
import { COMPARE_INFO, DocCompareDialog } from "@/registry/plainspoken/blocks/conflicts/doc-compare-dialog";
import { DocOfflineReview, OFFLINE_REVIEW_INFO } from "@/registry/plainspoken/blocks/conflicts/doc-offline-review";
import { DocHistory, HISTORY_INFO } from "@/registry/plainspoken/blocks/conflicts/doc-history";
import { cn } from "@/lib/utils";

const TEXT: { info: ApproachInfo; el: ReactNode }[] = [
  { info: SOFT_LOCK_INFO, el: <TextboxSoftLock /> },
  { info: WARN_INFO, el: <TextboxWarn /> },
  { info: SAVE_CONFLICT_INFO, el: <TextboxSaveConflict /> },
  { info: AUTO_MERGE_INFO, el: <TextboxAutoMerge /> },
];

const DOC: { info: ApproachInfo; el: ReactNode }[] = [
  { info: LIVE_PRESENCE_INFO, el: <DocLivePresence /> },
  { info: INLINE_CONFLICTS_INFO, el: <DocInlineConflicts /> },
  { info: COMPARE_INFO, el: <DocCompareDialog /> },
  { info: OFFLINE_REVIEW_INFO, el: <DocOfflineReview /> },
  { info: HISTORY_INFO, el: <DocHistory /> },
];

/** The approaches of one section as a table: when each suits and what it costs */
function Compare({ caption, rows }: { caption: string; rows: ApproachInfo[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-[13px]">
        <caption className="mb-1 text-left text-[14px] font-semibold">{caption}</caption>
        <thead>
          <tr className="bg-muted text-left">
            <th scope="col" className="border border-border px-2 py-1">Approach</th>
            <th scope="col" className="border border-border px-2 py-1">Suits</th>
            <th scope="col" className="border border-border px-2 py-1">Good</th>
            <th scope="col" className="border border-border px-2 py-1">Costs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.letter} className="align-top">
              <th scope="row" className="border border-border px-2 py-1 text-left whitespace-nowrap">
                {r.letter}. {r.name}
              </th>
              <td className="border border-border px-2 py-1">{r.suits}</td>
              <td className="border border-border px-2 py-1">{r.pro}</td>
              <td className="border border-border px-2 py-1">{r.con}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface ConflictsAppProps {
  /** Controls at the top right: a theme switch */
  actions?: ReactNode;
  className?: string;
}

/**
 * The edit-conflicts prototypes on one page: for a text box and for a rich text document,
 * several approaches side by side in tabs, each with its scenarios, your screen and (if you
 * want) Jonas's, and a table comparing them.
 */
export function ConflictsApp({ actions, className }: ConflictsAppProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-[76rem] flex-col gap-6 px-3 py-4 text-[14px] sm:px-5", className)}>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-[22px] font-bold">Edit conflicts</h1>
          {actions}
        </div>
        <p className="max-w-[48rem]">
          What should happen when two people change the same text at once? Here are several answers for a text box and for a rich text document, side by
          side, so you can try each and compare. Everything runs in your browser: a small pretend server keeps numbered versions, and Jonas is a script
          that types when you press a <b>Simulate</b> button. Turn on <b>Show Jonas&apos;s screen too</b> to play both people yourself.
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Facepile people={[{ person: AMARA }]} label="You" /> You are {AMARA.name}.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Facepile people={[{ person: JONAS }]} label="Your colleague" /> {JONAS.name} edits the same things.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Facepile people={[{ person: PRIYA }]} label="A reader" /> {PRIYA.name} only reads the document.
          </span>
        </p>
      </header>

      <section aria-labelledby="conflicts-text" className="flex flex-col gap-2">
        <h2 id="conflicts-text" className="border-b border-border pb-0.5 text-[18px] font-bold">
          Text box
        </h2>
        <p className="max-w-[48rem]">The description of a ticket: one plain field, the kind every form has.</p>
        <Tabs label="Text box approaches" tabs={TEXT.map(({ info, el }) => ({ id: info.letter, label: `${info.letter}. ${info.name}`, content: el }))} />
        <Compare caption="The text box approaches compared" rows={TEXT.map((t) => t.info)} />
      </section>

      <section aria-labelledby="conflicts-doc" className="flex flex-col gap-2">
        <h2 id="conflicts-doc" className="border-b border-border pb-0.5 text-[18px] font-bold">
          Rich text editor
        </h2>
        <p className="max-w-[48rem]">
          A launch checklist in the library&apos;s rich text editor, kept as Markdown. Merges work on blocks (paragraphs, headings, list items), and on words
          inside a block both people changed.
        </p>
        <Tabs label="Rich text approaches" tabs={DOC.map(({ info, el }) => ({ id: info.letter, label: `${info.letter}. ${info.name}`, content: el }))} />
        <Compare caption="The rich text approaches compared" rows={DOC.map((t) => t.info)} />
      </section>
    </div>
  );
}
