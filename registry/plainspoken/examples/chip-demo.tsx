"use client";

import { useState } from "react";
import { Chip } from "@/registry/plainspoken/ui/chip";

export default function ChipDemo() {
  const [failed, setFailed] = useState(true);
  const [mine, setMine] = useState(false);
  const [tags, setTags] = useState(["linux", "storage", "backup"]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <Chip pressed={failed} onPressedChange={setFailed}>
          Failed only
        </Chip>
        <Chip pressed={mine} onPressedChange={setMine}>
          Mine
        </Chip>
        <Chip>v2.4.1</Chip>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Chip key={t} onRemove={() => setTags(tags.filter((x) => x !== t))}>
            {t}
          </Chip>
        ))}
      </div>
    </div>
  );
}
