"use client";

import { useState } from "react";
import { CARDS_BY_ID, KANBAN_TODAY } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanCard } from "@/registry/plainspoken/blocks/kanban/card";

/**
 * Three cards from the demo board: one with a cover, one overdue, one due tomorrow. Each face is
 * a button; the ⋯ beside it is a menu of its own.
 */
export default function KanbanCardDemo() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <ul className="grid max-w-3xl gap-2 sm:grid-cols-3">
        {["FA-110", "FA-112", "FA-121"].map((id) => (
          <li key={id}>
            <KanbanCard
              card={CARDS_BY_ID[id]}
              today={KANBAN_TODAY}
              onOpen={() => setOpened(id)}
              menu={[{ label: "Open card", onSelect: () => setOpened(id) }, { label: "Copy link" }, { type: "separator" }, { label: "Archive card" }]}
            />
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="text-[13px] text-muted-foreground">
        {opened ? `Opened ${opened}.` : "Click a card, or focus one and press Enter."}
      </p>
    </div>
  );
}
