"use client";

import { useState } from "react";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { MenuButton } from "@/registry/plainspoken/ui/menu-button";

const STATUSES = ["Pending", "Paid", "Shipped", "Refunded"];

export default function MenuButtonDemo() {
  const [shown, setShown] = useState<string[]>([]);
  const summary = shown.length === 0 ? "all" : shown.length === 1 ? shown[0] : `${shown.length} of ${STATUSES.length}`;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[14px]">
      <span className="text-muted-foreground">Orders:</span>
      <MenuButton label={`Status: ${summary}`} active={shown.length > 0}>
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-[13px] text-muted-foreground">Show only</legend>
          {STATUSES.map((s) => (
            <Checkbox
              key={s}
              label={s}
              className="pr-4"
              checked={shown.includes(s)}
              onChange={(e) => setShown(e.target.checked ? [...shown, s] : shown.filter((x) => x !== s))}
            />
          ))}
        </fieldset>
      </MenuButton>
    </div>
  );
}
