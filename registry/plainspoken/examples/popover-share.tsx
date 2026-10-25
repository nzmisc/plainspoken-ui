"use client";

import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Input } from "@/registry/plainspoken/ui/input";
import { Popover } from "@/registry/plainspoken/ui/popover";

const URL = "https://northwind.example/p/q3-plan";

/** Opened above the button and aligned to its end, as from a toolbar at the bottom right. It flips below by itself when there is no room above. */
export default function PopoverShare() {
  return (
    <div className="flex justify-end">
      <Popover trigger="Share" side="top" align="end" arrow title="Share link">
        <div className="flex w-80 max-w-full items-center gap-2">
          <Input readOnly aria-label="Link" value={URL} className="min-w-0 flex-1" inputClassName="font-mono text-[13px]" onFocus={(e) => e.target.select()} />
          <CopyButton text={URL} label="Copy" size="md" variant="default" />
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">Anyone with the link can view. Editing needs an invite.</p>
      </Popover>
    </div>
  );
}
