"use client";

import { useState } from "react";
import { CARDS_BY_ID, COLUMNS } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanCardDetail } from "@/registry/plainspoken/blocks/kanban/card-detail";
import { Button } from "@/registry/plainspoken/ui/button";

/**
 * A card's dialog, keeping its own copy of the card: change anything and watch the Activity tab.
 * On a phone it is a drawer the height of the screen.
 */
export default function KanbanCardDetailDemo() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      {["FA-110", "FA-112", "FA-139"].map((id) => (
        <Button key={id} onClick={() => setOpen(id)}>
          Open {id}
        </Button>
      ))}
      <KanbanCardDetail card={open ? CARDS_BY_ID[open] : null} columns={COLUMNS} onClose={() => setOpen(null)} />
    </div>
  );
}
