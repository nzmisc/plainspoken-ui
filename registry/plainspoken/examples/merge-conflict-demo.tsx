"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { MergeConflict } from "@/registry/plainspoken/ui/merge-conflict";
import { PresenceAvatar, type Collaborator } from "@/registry/plainspoken/ui/presence";

const AMARA: Collaborator = { id: "amara", name: "Amara Osei", color: 1 };
const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };
const BASE = "The spring sale starts on Friday 14 March at 09:00.";

/**
 * Both versions of a paragraph, tagged by author, each with its change marked against the version
 * they started from. Keep both puts them one after the other; Edit opens both in a text box.
 */
export default function MergeConflictDemo() {
  const [result, setResult] = useState<string | null>(null);
  if (result != null)
    return (
      <div className="flex max-w-xl flex-col gap-2 text-[14px]">
        <p className="whitespace-pre-wrap">{result}</p>
        <Button variant="link" className="self-start" onClick={() => setResult(null)}>
          Show the conflict again
        </Button>
      </div>
    );
  return (
    <MergeConflict
      className="max-w-xl"
      base={BASE}
      mine={{ text: "The spring sale starts on Friday 14 March at 08:00.", label: "Yours", mark: <PresenceAvatar person={AMARA} size={16} /> }}
      theirs={{ text: "The spring sale starts on Friday 14 March at 10:00, after the stand-up.", label: "Jonas Weber", mark: <PresenceAvatar person={JONAS} size={16} />, meta: "2 min ago" }}
      labels={{ theirs: "Keep Jonas's" }}
      onResolve={(text) => setResult(text)}
    />
  );
}
