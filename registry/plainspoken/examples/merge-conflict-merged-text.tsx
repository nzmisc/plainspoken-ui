"use client";

import { useMemo, useState } from "react";
import { merge3 } from "@/registry/plainspoken/lib/diff";
import { MergedText } from "@/registry/plainspoken/ui/merge-conflict";

const BASE = "Expected: the email is sent again with the new address. We should fix this before the spring sale on Friday.";
const MINE = "Expected: the email is sent again with the new address, at once. We should fix this before the spring sale on Thursday.";
const THEIRS = "Expected: the email is sent again with the new address. We should fix this before the spring sale starts on Monday.";

/**
 * A whole three-way merge: what merged cleanly as plain text (Jonas's part tinted), the clash
 * marked where it is. Settling the last one hands back the finished text.
 */
export default function MergeConflictMergedText() {
  const result = useMemo(() => merge3(BASE, MINE, THEIRS), []);
  const [done, setDone] = useState<string | null>(null);
  return done != null ? (
    <p className="max-w-xl text-[14px]">
      <span className="font-semibold">Finished: </span>
      {done}
    </p>
  ) : (
    <MergedText result={result} mineLabel="You" theirsLabel="Jonas" labels={{ theirs: "Jonas's" }} theirsClassName="bg-chart-2/20" onDone={setDone} className="max-w-xl" />
  );
}
