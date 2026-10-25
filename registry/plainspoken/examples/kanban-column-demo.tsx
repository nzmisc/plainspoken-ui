"use client";

import { useState } from "react";
import { CARDS_BY_ID, COLUMNS, KANBAN_TODAY, type BoardCard } from "@/registry/plainspoken/blocks/kanban/data";
import { nextCardId } from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanCard } from "@/registry/plainspoken/blocks/kanban/card";
import { KanbanColumn } from "@/registry/plainspoken/blocks/kanban/column";

/**
 * The Review column at its limit of three. "Add a card" opens a box at the foot: type a title and
 * press Enter, and the card joins the list (and the column goes over its limit).
 */
export default function KanbanColumnDemo() {
  const [column, setColumn] = useState(COLUMNS.find((c) => c.id === "review")!);
  const [cards, setCards] = useState<Record<string, BoardCard>>(CARDS_BY_ID);
  return (
    <div className="flex h-[560px]">
      <KanbanColumn
        column={column}
        menu={[{ label: "Sort by priority" }, { label: "Sort by due date" }]}
        onAddCard={(title) => {
          const id = nextCardId(cards);
          setCards((all) => ({ ...all, [id]: { ...all["FA-137"], id, title, labels: [], comments: [], attachments: [] } }));
          setColumn((c) => ({ ...c, cardIds: [...c.cardIds, id] }));
        }}
      >
        {column.cardIds.map((id) => (
          <li key={id}>
            <KanbanCard card={cards[id]} today={KANBAN_TODAY} />
          </li>
        ))}
      </KanbanColumn>
    </div>
  );
}
