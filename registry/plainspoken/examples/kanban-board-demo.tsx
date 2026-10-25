"use client";

import { useState } from "react";
import { CARDS_BY_ID, COLUMNS, KANBAN_TODAY } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanBoard } from "@/registry/plainspoken/blocks/kanban/board";

/**
 * The demo board keeping its own columns. Drag a card with the mouse, or touch and hold it on a
 * phone. From the keyboard: Tab to a card, arrows to move between cards, Space to pick one up,
 * arrows to carry it, Space to drop, Escape to put it back. Right-click a card for Move to.
 */
export default function KanbanBoardDemo() {
  const [opened, setOpened] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <KanbanBoard
        defaultColumns={COLUMNS}
        cards={CARDS_BY_ID}
        today={KANBAN_TODAY}
        onOpen={(id) => setOpened(`Opened ${id}. In the app this is the card dialog.`)}
        onMove={(m) => setOpened(`Moved ${m.cardId} from ${m.from} to ${m.to}.`)}
        cardMenu={() => []}
        className="h-[600px] border border-border"
      />
      <p className="text-[13px] text-muted-foreground">{opened || "Nothing moved yet."}</p>
    </div>
  );
}
