import { Diff } from "@/registry/plainspoken/ui/diff";

const BEFORE = "colour: grey;\nmargin: 0 auto;\npadding: 4px;\n";
const AFTER = "color: gray;\nmargin: 0 auto;\npadding: 6px 4px;\n";

/**
 * The same change by characters (precise, noisy; right for moving a caret), by words (what people
 * read) and by lines (for code and lists).
 */
export default function DiffGranularity() {
  return (
    <dl className="grid max-w-xl grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-[14px]">
      {(["char", "word", "line"] as const).map((g) => (
        <div key={g} className="contents">
          <dt className="font-semibold">{g === "char" ? "Characters" : g === "word" ? "Words" : "Lines"}</dt>
          <dd>
            <Diff before={BEFORE} after={AFTER} granularity={g} className="font-mono text-[13px]" />
          </dd>
        </div>
      ))}
    </dl>
  );
}
