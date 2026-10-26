import { merge3, mergedText } from "@/registry/plainspoken/lib/diff";

const BASE = "We should fix this before the spring sale on Friday. It happens on web and in the app.";
const MINE = "We should fix this before the spring sale on Thursday. It happens on web and in the app.";
const THEIRS = "We should fix this before the spring sale starts on Monday. It happens on web and in the iOS app.";

/**
 * lib/diff's three-way merge: what each side changed from the base, combined. Changes in different
 * places merge cleanly (“starts”, “iOS”); only the word both changed (“Friday”) is a conflict,
 * settled here by keeping mine.
 */
export default function DiffMerge() {
  const result = merge3(BASE, MINE, THEIRS);
  return (
    <div className="flex max-w-2xl flex-col gap-2 text-[14px]">
      <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">Base</dt>
        <dd>{BASE}</dd>
        <dt className="text-muted-foreground">Mine</dt>
        <dd>{MINE}</dd>
        <dt className="text-muted-foreground">Theirs</dt>
        <dd>{THEIRS}</dd>
      </dl>
      <p className="border-t border-border pt-2">
        <span className="font-semibold">Chunks: </span>
        {result.chunks.map((c, i) =>
          c.type === "clean" ? (
            <span key={i} className={c.from === "base" ? "" : "bg-success/15"} title={`from ${c.from}`}>
              {c.text}
            </span>
          ) : (
            <span key={i} className="border border-warning bg-warning/10 px-0.5" title="conflict">
              {c.mine} | {c.theirs}
            </span>
          ),
        )}
      </p>
      <p>
        <span className="font-semibold">Settled with mine: </span>
        {mergedText(result, "mine")}
      </p>
    </div>
  );
}
