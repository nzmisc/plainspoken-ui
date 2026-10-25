"use client";

import { useState } from "react";
import { MergeConflict } from "@/registry/plainspoken/ui/merge-conflict";

/** A few words in running text that two people changed differently, with small buttons right after them. */
export default function MergeConflictInline() {
  const [day, setDay] = useState<string | null>(null);
  return (
    <p className="max-w-xl text-[14px] leading-[1.9]">
      We should fix this before the spring sale starts on{" "}
      {day ?? (
        <MergeConflict
          variant="inline"
          mine={{ text: "Thursday", label: "You" }}
          theirs={{ text: "Monday", label: "Jonas" }}
          labels={{ theirs: "Jonas's" }}
          onResolve={(text) => setDay(text)}
        />
      )}
      .
    </p>
  );
}
